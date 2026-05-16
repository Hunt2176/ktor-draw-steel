import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { db, toInsertId } from "../../db";
import { campaignIdForEntity } from "../../data/socket-data";
import { getCombatantById } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { combatants } from "../../schema";
import { asBool, asInt, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";
import type { CombatantDTO } from "../../types";

export function registerCombatantRoutes(api: Hono): void {
	api.get("/combatants", (c) => {
		const rows = db
			.select({ id: combatants.id })
			.from(combatants)
			.orderBy(asc(combatants.id))
			.all();

		const data = rows
			.map((row) => getCombatantById(row.id))
			.filter((item): item is CombatantDTO => item != null);

		return c.json(data);
	});

	api.get("/combatants/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const found = getCombatantById(id);
		if (found == null) {
			return c.text("Entity not found", 404);
		}

		return c.json(found);
	});

	api.post("/combatants", async (c) => {
		const body = parseBodyObject(await c.req.json());
		const combat = asInt(body.combat);
		const character = asInt(body.character);

		if (combat == null || character == null) {
			return c.text("combat and character are required", 400);
		}

		const available = asBool(body.available) ?? true;
		const surges = Math.max(0, asInt(body.surges) ?? 0);
		const resources = Math.max(0, asInt(body.resources) ?? 0);

		const result = db
			.insert(combatants)
			.values({
				available: available ? 1 : 0,
				surges,
				resources,
				combat,
				character,
			})
			.run();

		const id = toInsertId(result);
		emitEntityChange("Created", "Combatants", id);
		return c.json(getCombatantById(id), 201);
	});

	api.patch("/combatants/:id/resources", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const value = Math.max(0, asInt(body.value) ?? 0);
		const type = asString(body.type);

		const combatant = getCombatantById(id);
		if (combatant == null) {
			return c.text("Combatant not found", 404);
		}

		const delta = type === "DECREASE" ? -value : value;
		const updated = Math.max(0, combatant.resources + delta);

		db.update(combatants).set({ resources: updated }).where(eq(combatants.id, id)).run();
		emitEntityChange("Updated", "Combatants", id);
		return c.json(getCombatantById(id));
	});

	api.patch("/combatants/:id/surges", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const value = Math.max(0, asInt(body.value) ?? 0);
		const type = asString(body.type);

		const combatant = getCombatantById(id);
		if (combatant == null) {
			return c.text("Combatant not found", 404);
		}

		const delta = type === "DECREASE" ? -value : value;
		const updated = Math.max(0, combatant.surges + delta);

		db.update(combatants).set({ surges: updated }).where(eq(combatants.id, id)).run();
		emitEntityChange("Updated", "Combatants", id);
		return c.json(getCombatantById(id));
	});

	api.patch("/combatants/:id", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		if (getCombatantById(id) == null) {
			return c.text("Entity not found", 404);
		}

		const body = parseBodyObject(await c.req.json());
		const updates: Partial<typeof combatants.$inferInsert> = {};

		if (Object.prototype.hasOwnProperty.call(body, "available")) {
			const parsed = asBool(body.available);
			if (parsed != null) {
				updates.available = parsed ? 1 : 0;
			}
		}

		if (Object.prototype.hasOwnProperty.call(body, "surges")) {
			const parsed = asInt(body.surges);
			if (parsed != null) {
				updates.surges = Math.max(0, parsed);
			}
		}

		if (Object.prototype.hasOwnProperty.call(body, "resources")) {
			const parsed = asInt(body.resources);
			if (parsed != null) {
				updates.resources = Math.max(0, parsed);
			}
		}

		if (Object.prototype.hasOwnProperty.call(body, "combat")) {
			const parsed = asInt(body.combat);
			if (parsed != null) {
				updates.combat = parsed;
			}
		}

		if (Object.prototype.hasOwnProperty.call(body, "character")) {
			const parsed = asInt(body.character);
			if (parsed != null) {
				updates.character = parsed;
			}
		}

		if (Object.keys(updates).length > 0) {
			db.update(combatants).set(updates).where(eq(combatants.id, id)).run();
			emitEntityChange("Updated", "Combatants", id);
		}

		return c.json(getCombatantById(id));
	});

	api.delete("/combatants/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const campaignId = campaignIdForEntity("Combatants", id);
		const deleted = db.delete(combatants).where(eq(combatants.id, id)).run();

		if (getChanges(deleted) === 0) {
			return c.text("Entity not found", 404);
		}

		if (campaignId != null) {
			emitEntityChange("Removed", "Combatants", id, campaignId);
		}

		return c.json({ message: "Entity deleted" });
	});
}
