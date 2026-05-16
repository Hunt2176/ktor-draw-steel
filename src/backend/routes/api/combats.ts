import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db, toInsertId } from "../../db";
import { getCampaignDtoById, getCombatById, getAllCombats } from "../../data/readers";
import { characterConditions, characters, combatants, combats } from "../../schema";
import { emitEntityChange } from "../../socket-hub";
import { asBool, asInt, asNullableString, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";

export function registerCombatRoutes(api: Hono): void {
	api.get("/combats", (c) => c.json(getAllCombats()));

	api.get("/combats/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const found = getCombatById(id);
		if (found == null) {
			return c.text("Entity not found", 404);
		}

		return c.json(found);
	});

	api.post("/combats", async (c) => {
		const body = parseBodyObject(await c.req.json());
		const campaign = asInt(body.campaign);

		if (campaign == null) {
			return c.text("campaign is required", 400);
		}

		const round = Math.max(1, asInt(body.round) ?? 1);
		const result = db.insert(combats).values({ round, campaign }).run();
		const id = toInsertId(result);

		emitEntityChange("Created", "Combats", id);
		return c.json(getCombatById(id), 201);
	});

	api.post("/combats/create", async (c) => {
		const body = parseBodyObject(await c.req.json());
		const campaignId = asInt(body.campaign);
		const rawCharacters = Array.isArray(body.characters) ? body.characters : [];
		const characterIds = [...new Set(rawCharacters.map((item) => asInt(item)).filter((item): item is number => item != null))];

		if (campaignId == null) {
			return c.text("campaign is required", 400);
		}

		if (getCampaignDtoById(campaignId) == null) {
			return c.text("Campaign not found", 404);
		}

		let combatId = 0;
		const createdCombatants: number[] = [];

		db.transaction((tx) => {
			for (const characterId of characterIds) {
				const row = tx
					.select({ id: characters.id })
					.from(characters)
					.where(and(eq(characters.id, characterId), eq(characters.campaign, campaignId)))
					.get();

				if (row == null) {
					throw new Error(`Character ${characterId} belonging to ${campaignId} not found`);
				}
			}

			const createdCombat = tx.insert(combats).values({ campaign: campaignId }).run();
			combatId = toInsertId(createdCombat);

			for (const characterId of characterIds) {
				const combatant = tx
					.insert(combatants)
					.values({
						character: characterId,
						combat: combatId,
						available: 1,
						surges: 0,
						resources: 0,
					})
					.run();
				createdCombatants.push(toInsertId(combatant));
			}
		});

		emitEntityChange("Created", "Combats", combatId, campaignId);
		for (const combatantId of createdCombatants) {
			emitEntityChange("Created", "Combatants", combatantId, campaignId);
		}

		return c.json(getCombatById(combatId), 201);
	});

	api.patch("/combats/:id/nextRound", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const fromRound = asInt(body.fromRound);
		const reset = asBool(body.reset) ?? false;
		const updateConditions = asBool(body.updateConditions) ?? false;

		const existing = getCombatById(id);
		if (existing == null) {
			return c.text("Combat not found", 404);
		}

		if (fromRound == null || existing.round !== fromRound) {
			return c.text("Combat round has changed", 409);
		}

		const removedConditions: Array<{ id: number; campaignId: number }> = [];

		db.transaction((tx) => {
			tx.update(combats).set({ round: existing.round + 1 }).where(eq(combats.id, id)).run();

			if (reset) {
				tx.update(combatants).set({ available: 1 }).where(eq(combatants.combat, id)).run();
			}

			if (updateConditions) {
				const conditions = tx
					.select({ id: characterConditions.id, campaignId: characters.campaign })
					.from(characterConditions)
					.innerJoin(characters, eq(characters.id, characterConditions.character))
					.innerJoin(
						combatants,
						and(eq(combatants.character, characters.id), eq(combatants.combat, id)),
					)
					.where(eq(characterConditions.endType, "endOfTurn"))
					.all();

				for (const condition of conditions) {
					tx.delete(characterConditions).where(eq(characterConditions.id, condition.id)).run();
					removedConditions.push({ id: condition.id, campaignId: condition.campaignId });
				}
			}
		});

		emitEntityChange("Updated", "Combats", id, existing.campaign);
		for (const condition of removedConditions) {
			emitEntityChange("Removed", "CharacterConditions", condition.id, condition.campaignId);
		}

		return c.json(getCombatById(id));
	});

	api.patch("/combats/:id/add", async (c) => {
		const combatId = parseIdParam(c);
		if (combatId == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const characterId = asInt(body.character);

		if (characterId == null) {
			return c.text("character is required", 400);
		}

		const combat = getCombatById(combatId);
		if (combat == null) {
			return c.text("Combat not found", 404);
		}

		const character = db
			.select({ id: characters.id })
			.from(characters)
			.where(and(eq(characters.id, characterId), eq(characters.campaign, combat.campaign)))
			.get();

		if (character == null) {
			return c.text(`Character ${characterId} belonging to ${combat.campaign} not found`, 404);
		}

		const result = db
			.insert(combatants)
			.values({
				character: characterId,
				combat: combatId,
				available: 1,
				surges: 0,
				resources: 0,
			})
			.run();

		emitEntityChange("Created", "Combatants", toInsertId(result), combat.campaign);
		return c.json(getCombatById(combatId));
	});

	api.patch("/combats/:id/remove", async (c) => {
		const combatId = parseIdParam(c);
		if (combatId == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const combatantId = asInt(body.character);

		if (combatantId == null) {
			return c.text("character is required", 400);
		}

		const combat = getCombatById(combatId);
		if (combat == null) {
			return c.text("Combat not found", 404);
		}

		const deleted = db
			.delete(combatants)
			.where(and(eq(combatants.id, combatantId), eq(combatants.combat, combatId)))
			.run();

		if (getChanges(deleted) !== 1) {
			return c.text(`Combatant ${combatantId} not found in ${combatId}`, 404);
		}

		emitEntityChange("Removed", "Combatants", combatantId, combat.campaign);
		return c.json(getCombatById(combatId));
	});

	api.patch("/combats/:id/quickAdd", async (c) => {
		const combatId = parseIdParam(c);
		if (combatId == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const character = parseBodyObject(body.character);

		const combat = getCombatById(combatId);
		if (combat == null) {
			return c.text("Combat not found", 404);
		}

		const name = asString(character.name);
		const user = asInt(character.user);
		if (name == null || user == null) {
			return c.text("character.name and character.user are required", 400);
		}

		let characterId = 0;
		let combatantId = 0;

		db.transaction((tx) => {
			const createdCharacter = tx
				.insert(characters)
				.values({
					name,
					might: asInt(character.might) ?? 0,
					agility: asInt(character.agility) ?? 0,
					reason: asInt(character.reason) ?? 0,
					intuition: asInt(character.intuition) ?? 0,
					presence: asInt(character.presence) ?? 0,
					removedHp: asInt(character.removedHp) ?? 0,
					maxHp: asInt(character.maxHp) ?? 0,
					temporaryHp: asInt(character.temporaryHp) ?? 0,
					removedRecoveries: asInt(character.removedRecoveries) ?? 0,
					maxRecoveries: asInt(character.maxRecoveries) ?? 0,
					temporaryRecoveries: asInt(character.temporaryRecoveries) ?? 0,
					victories: asInt(character.victories) ?? 0,
					minions: Math.max(0, asInt(character.minions) ?? 0),
					offstage: (asBool(character.offstage) ?? false) ? 1 : 0,
					resourceName: asNullableString(character.resourceName) ?? null,
					pictureUrl: asNullableString(character.pictureUrl) ?? null,
					border: asNullableString(character.border) ?? null,
					campaign: combat.campaign,
					user,
				})
				.run();

			characterId = toInsertId(createdCharacter);

			const createdCombatant = tx
				.insert(combatants)
				.values({
					character: characterId,
					combat: combatId,
					available: 1,
					surges: 0,
					resources: 0,
				})
				.run();
			combatantId = toInsertId(createdCombatant);
		});

		emitEntityChange("Created", "Characters", characterId, combat.campaign);
		emitEntityChange("Created", "Combatants", combatantId, combat.campaign);

		return c.json(getCombatById(combatId));
	});

	api.patch("/combats/:id/modify", async (c) => {
		const combatId = parseIdParam(c);
		if (combatId == null) {
			return c.text("Invalid ID", 400);
		}

		const combat = getCombatById(combatId);
		if (combat == null) {
			return c.text("Combat not found", 404);
		}

		const body = parseBodyObject(await c.req.json());
		const addList = Array.isArray(body.add) ? body.add : [];
		const removeList = Array.isArray(body.remove) ? body.remove : [];

		const createdCombatants: number[] = [];
		const removedCombatants: number[] = [];

		db.transaction((tx) => {
			for (const raw of addList) {
				const characterId = asInt(raw);
				if (characterId == null) {
					continue;
				}

				const character = tx
					.select({ id: characters.id })
					.from(characters)
					.where(and(eq(characters.id, characterId), eq(characters.campaign, combat.campaign)))
					.get();

				if (character == null) {
					throw new Error(`Character ${characterId} belonging to ${combat.campaign} not found`);
				}

				const created = tx
					.insert(combatants)
					.values({
						character: characterId,
						combat: combatId,
						available: 1,
						surges: 0,
						resources: 0,
					})
					.run();
				createdCombatants.push(toInsertId(created));
			}

			for (const raw of removeList) {
				const characterId = asInt(raw);
				if (characterId == null) {
					continue;
				}

				const combatant = tx
					.select({ id: combatants.id })
					.from(combatants)
					.where(and(eq(combatants.character, characterId), eq(combatants.combat, combatId)))
					.get();

				if (combatant == null) {
					throw new Error(`Combatant ${characterId} not found in ${combatId}`);
				}

				tx.delete(combatants).where(eq(combatants.id, combatant.id)).run();
				removedCombatants.push(combatant.id);
			}
		});

		for (const combatantId of createdCombatants) {
			emitEntityChange("Created", "Combatants", combatantId, combat.campaign);
		}

		for (const combatantId of removedCombatants) {
			emitEntityChange("Removed", "Combatants", combatantId, combat.campaign);
		}

		return c.json(getCombatById(combatId));
	});

	api.patch("/combats/:id", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		if (getCombatById(id) == null) {
			return c.text("Entity not found", 404);
		}

		const body = parseBodyObject(await c.req.json());
		const updates: Partial<typeof combats.$inferInsert> = {};

		if (Object.prototype.hasOwnProperty.call(body, "round")) {
			const round = asInt(body.round);
			if (round != null) {
				updates.round = Math.max(1, round);
			}
		}

		if (Object.prototype.hasOwnProperty.call(body, "campaign")) {
			const campaign = asInt(body.campaign);
			if (campaign != null) {
				updates.campaign = campaign;
			}
		}

		if (Object.keys(updates).length > 0) {
			db.update(combats).set(updates).where(eq(combats.id, id)).run();
			emitEntityChange("Updated", "Combats", id);
		}

		return c.json(getCombatById(id));
	});

	api.delete("/combats/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const combat = getCombatById(id);
		if (combat == null) {
			return c.text("Entity not found", 404);
		}

		db.delete(combats).where(eq(combats.id, id)).run();
		emitEntityChange("Removed", "Combats", id, combat.campaign);
		return c.json({ message: "Entity deleted" });
	});
}
