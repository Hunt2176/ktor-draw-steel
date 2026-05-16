import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, toInsertId } from "../../db";
import { getCharacterById, getAllCharacters } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { characters } from "../../schema";
import { asBool, asInt, asNullableString, asString, parseBodyObject, parseIdParam } from "../../utils";

export function registerCharacterRoutes(api: Hono): void {
	api.get("/characters", (c) => c.json(getAllCharacters()));

	api.get("/characters/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const character = getCharacterById(id);
		if (character == null) {
			return c.text("Entity not found", 404);
		}

		return c.json(character);
	});

	api.post("/characters", async (c) => {
		const body = parseBodyObject(await c.req.json());

		const name = asString(body.name);
		const campaign = asInt(body.campaign);
		const user = asInt(body.user);

		if (name == null || campaign == null || user == null) {
			return c.text("name, campaign, and user are required", 400);
		}

		const result = db
			.insert(characters)
			.values({
				name,
				might: asInt(body.might) ?? 0,
				agility: asInt(body.agility) ?? 0,
				reason: asInt(body.reason) ?? 0,
				intuition: asInt(body.intuition) ?? 0,
				presence: asInt(body.presence) ?? 0,
				removedHp: asInt(body.removedHp) ?? 0,
				maxHp: asInt(body.maxHp) ?? 0,
				temporaryHp: asInt(body.temporaryHp) ?? 0,
				removedRecoveries: asInt(body.removedRecoveries) ?? 0,
				maxRecoveries: asInt(body.maxRecoveries) ?? 0,
				temporaryRecoveries: asInt(body.temporaryRecoveries) ?? 0,
				victories: asInt(body.victories) ?? 0,
				minions: Math.max(0, asInt(body.minions) ?? 0),
				offstage: (asBool(body.offstage) ?? false) ? 1 : 0,
				resourceName: asNullableString(body.resourceName) ?? null,
				pictureUrl: asNullableString(body.pictureUrl) ?? null,
				border: asNullableString(body.border) ?? null,
				campaign,
				user,
			})
			.run();

		const id = toInsertId(result);
		emitEntityChange("Created", "Characters", id);

		return c.json(getCharacterById(id), 201);
	});

	api.patch("/characters/:id/modify/health", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const mod = Math.max(0, asInt(body.mod) ?? 0);
		const type = asString(body.type);

		const character = getCharacterById(id);
		if (character == null) {
			return c.text("Character not found", 404);
		}

		let temporaryHp = Math.max(0, character.temporaryHp);
		let removedHp = Math.max(0, character.removedHp);

		if (type === "DAMAGE") {
			if (temporaryHp > 0) {
				const tempAfter = temporaryHp - mod;
				temporaryHp = Math.max(tempAfter, 0);
				if (tempAfter < 0) {
					removedHp += Math.max(0, -tempAfter);
				}
			} else {
				removedHp += mod;
			}
		} else {
			removedHp = Math.max(0, removedHp - mod);
		}

		db
			.update(characters)
			.set({
				temporaryHp,
				removedHp: Math.max(0, removedHp),
			})
			.where(eq(characters.id, id))
			.run();

		emitEntityChange("Updated", "Characters", id);
		return c.json(getCharacterById(id));
	});

	api.patch("/characters/:id/modify/recoveries", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const mod = Math.max(0, asInt(body.mod) ?? 0);
		const type = asString(body.type);

		const character = getCharacterById(id);
		if (character == null) {
			return c.text("Character not found", 404);
		}

		let temporaryRecoveries = Math.max(0, character.temporaryRecoveries);
		let removedRecoveries = Math.max(0, character.removedRecoveries);

		if (type === "DECREASE") {
			if (temporaryRecoveries > 0) {
				const tempAfter = temporaryRecoveries - mod;
				temporaryRecoveries = Math.max(tempAfter, 0);
				if (tempAfter < 0) {
					removedRecoveries += Math.max(0, -tempAfter);
				}
			} else {
				removedRecoveries += mod;
			}
		} else {
			removedRecoveries = Math.max(0, removedRecoveries - mod);
		}

		db
			.update(characters)
			.set({
				temporaryRecoveries,
				removedRecoveries: Math.max(0, removedRecoveries),
			})
			.where(eq(characters.id, id))
			.run();

		emitEntityChange("Updated", "Characters", id);
		return c.json(getCharacterById(id));
	});

	api.patch("/characters/:id", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		if (getCharacterById(id) == null) {
			return c.text("Entity not found", 404);
		}

		const body = parseBodyObject(await c.req.json());
		const updates: Partial<typeof characters.$inferInsert> = {};

		const assignInt = (jsonKey: string, column: string) => {
			if (Object.prototype.hasOwnProperty.call(body, jsonKey)) {
				const parsed = asInt(body[jsonKey]);
				if (parsed != null) {
					switch (column) {
						case "might":
							updates.might = parsed;
							break;
						case "agility":
							updates.agility = parsed;
							break;
						case "reason":
							updates.reason = parsed;
							break;
						case "intuition":
							updates.intuition = parsed;
							break;
						case "presence":
							updates.presence = parsed;
							break;
						case "removed_hp":
							updates.removedHp = parsed;
							break;
						case "max_hp":
							updates.maxHp = parsed;
							break;
						case "temporary_hp":
							updates.temporaryHp = parsed;
							break;
						case "removed_recoveries":
							updates.removedRecoveries = parsed;
							break;
						case "max_recoveries":
							updates.maxRecoveries = parsed;
							break;
						case "temporary_recoveries":
							updates.temporaryRecoveries = parsed;
							break;
						case "victories":
							updates.victories = parsed;
							break;
					}
				}
			}
		};

		const assignText = (jsonKey: string, column: string, nullable = false) => {
			if (!Object.prototype.hasOwnProperty.call(body, jsonKey)) {
				return;
			}

			const parsed = nullable ? asNullableString(body[jsonKey]) : asString(body[jsonKey]);
			if (parsed !== undefined && (nullable || parsed != null)) {
				switch (column) {
					case "name":
						updates.name = parsed as string;
						break;
					case "resource_name":
						updates.resourceName = parsed;
						break;
					case "picture_url":
						updates.pictureUrl = parsed;
						break;
					case "border":
						updates.border = parsed;
						break;
				}
			}
		};

		assignText("name", "name");
		assignInt("might", "might");
		assignInt("agility", "agility");
		assignInt("reason", "reason");
		assignInt("intuition", "intuition");
		assignInt("presence", "presence");
		assignInt("removedHp", "removed_hp");
		assignInt("maxHp", "max_hp");
		assignInt("temporaryHp", "temporary_hp");
		assignInt("removedRecoveries", "removed_recoveries");
		assignInt("maxRecoveries", "max_recoveries");
		assignInt("temporaryRecoveries", "temporary_recoveries");
		assignInt("victories", "victories");

		if (Object.prototype.hasOwnProperty.call(body, "minions")) {
			const parsed = asInt(body.minions);
			if (parsed != null) {
				updates.minions = Math.max(0, parsed);
			}
		}

		if (Object.prototype.hasOwnProperty.call(body, "offstage")) {
			const parsed = asBool(body.offstage);
			if (parsed != null) {
				updates.offstage = parsed ? 1 : 0;
			}
		}

		assignText("resourceName", "resource_name", true);
		assignText("pictureUrl", "picture_url", true);
		assignText("border", "border", true);

		if (Object.prototype.hasOwnProperty.call(body, "campaign")) {
			const parsed = asInt(body.campaign);
			if (parsed != null) {
				updates.campaign = parsed;
			}
		}

		if (Object.prototype.hasOwnProperty.call(body, "user")) {
			const parsed = asInt(body.user);
			if (parsed != null) {
				updates.user = parsed;
			}
		}

		if (Object.keys(updates).length > 0) {
			db.update(characters).set(updates).where(eq(characters.id, id)).run();
			emitEntityChange("Updated", "Characters", id);
		}

		return c.json(getCharacterById(id));
	});

	api.delete("/characters/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const character = getCharacterById(id);
		if (character == null) {
			return c.text("Entity not found", 404);
		}

		db.delete(characters).where(eq(characters.id, id)).run();
		emitEntityChange("Removed", "Characters", id, character.campaign);
		return c.json({ message: "Entity deleted" });
	});
}
