import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, toInsertId } from "../../db";
import { emitEntityChange } from "../../socket-hub";
import {
	getCampaignDetails,
	getCampaignDtoById,
	getCharactersByCampaignId,
	getCombatsByCampaignId,
} from "../../data/readers";
import { campaigns } from "../../schema";
import { asInt, asNullableString, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";

export function registerCampaignRoutes(api: Hono): void {
	api.get("/campaigns", (c) => c.json(getCampaignDetails()));

	api.get("/campaigns/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const details = getCampaignDetails([id]);
		if (details.length === 0) {
			return c.text("Campaign not found", 404);
		}

		return c.json(details[0]);
	});

	api.post("/campaigns", async (c) => {
		const body = parseBodyObject(await c.req.json());
		const name = asString(body.name);

		if (name == null || name.trim() === "") {
			return c.text("Name is required", 400);
		}

		const heroTokens = Math.max(0, asInt(body.heroTokens) ?? 0);
		const background = asNullableString(body.background) ?? null;
		const kankaApiId = body.kankaApiId == null ? null : asInt(body.kankaApiId);

		const result = db
			.insert(campaigns)
			.values({
				name,
				background,
				heroTokens,
				kankaApiId,
			})
			.run();

		const id = toInsertId(result);
		emitEntityChange("Created", "Campaigns", id, id);

		return c.json(getCampaignDtoById(id), 201);
	});

	api.patch("/campaigns/:id/modify/heroTokens", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const body = parseBodyObject(await c.req.json());
		const modifyBy = asInt(body.modifyBy) ?? 0;
		const type = asString(body.type);

		const existing = getCampaignDtoById(id);
		if (existing == null) {
			return c.text("Entity not found", 404);
		}

		const nextValue =
			type === "DECREASE"
				? Math.max(0, existing.heroTokens - modifyBy)
				: Math.max(0, existing.heroTokens + modifyBy);

		db
			.update(campaigns)
			.set({ heroTokens: nextValue })
			.where(eq(campaigns.id, id))
			.run();
		emitEntityChange("Updated", "Campaigns", id, id);

		return c.json(getCampaignDtoById(id));
	});

	api.get("/campaigns/:id/combats", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		if (getCampaignDtoById(id) == null) {
			return c.text("Campaign not found", 404);
		}

		return c.json(getCombatsByCampaignId(id));
	});

	api.get("/campaigns/:id/characters", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		if (getCampaignDtoById(id) == null) {
			return c.text("Campaign not found", 404);
		}

		return c.json(getCharactersByCampaignId(id));
	});

	api.patch("/campaigns/:id", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		if (getCampaignDtoById(id) == null) {
			return c.text("Entity not found", 404);
		}

		const body = parseBodyObject(await c.req.json());
		const updates: Partial<typeof campaigns.$inferInsert> = {};

		const name = asString(body.name);
		if (name != null) {
			updates.name = name;
		}

		const background = asNullableString(body.background);
		if (background !== undefined) {
			updates.background = background;
		}

		const heroTokens = asInt(body.heroTokens);
		if (heroTokens != null) {
			updates.heroTokens = Math.max(0, heroTokens);
		}

		if (Object.prototype.hasOwnProperty.call(body, "kankaApiId")) {
			updates.kankaApiId = body.kankaApiId == null ? null : asInt(body.kankaApiId);
		}

		if (Object.keys(updates).length > 0) {
			db.update(campaigns).set(updates).where(eq(campaigns.id, id)).run();
			emitEntityChange("Updated", "Campaigns", id, id);
		}

		return c.json(getCampaignDtoById(id));
	});

	api.delete("/campaigns/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const deleted = db.delete(campaigns).where(eq(campaigns.id, id)).run();
		if (getChanges(deleted) === 0) {
			return c.text("Entity not found", 404);
		}

		emitEntityChange("Removed", "Campaigns", id, id);
		return c.json({ message: "Entity deleted" });
	});
}
