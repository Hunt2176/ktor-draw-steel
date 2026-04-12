import { Hono } from "hono";
import { runStatement, toInsertId, type SQLQueryBindings } from "../../db";
import { emitEntityChange } from "../../socket-hub";
import {
    getCampaignDetails,
    getCampaignDtoById,
    getCharactersByCampaignId,
    getCombatsByCampaignId,
} from "../../data/readers";
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

        const result = runStatement(
            "INSERT INTO Campaigns (name, background, hero_tokens, kanka_api_id) VALUES (?, ?, ?, ?)",
            name,
            background,
            heroTokens,
            kankaApiId,
        );

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

        runStatement("UPDATE Campaigns SET hero_tokens = ? WHERE id = ?", nextValue, id);
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
        const updates: string[] = [];
        const values: SQLQueryBindings[] = [];

        const name = asString(body.name);
        if (name != null) {
            updates.push("name = ?");
            values.push(name);
        }

        const background = asNullableString(body.background);
        if (background !== undefined) {
            updates.push("background = ?");
            values.push(background);
        }

        const heroTokens = asInt(body.heroTokens);
        if (heroTokens != null) {
            updates.push("hero_tokens = ?");
            values.push(Math.max(0, heroTokens));
        }

        if (Object.prototype.hasOwnProperty.call(body, "kankaApiId")) {
            const kankaApiId = body.kankaApiId == null ? null : asInt(body.kankaApiId);
            updates.push("kanka_api_id = ?");
            values.push(kankaApiId);
        }

        if (updates.length > 0) {
            runStatement(`UPDATE Campaigns SET ${updates.join(", ")} WHERE id = ?`, ...values, id);
            emitEntityChange("Updated", "Campaigns", id, id);
        }

        return c.json(getCampaignDtoById(id));
    });

    api.delete("/campaigns/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const deleted = runStatement("DELETE FROM Campaigns WHERE id = ?", id);
        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        emitEntityChange("Removed", "Campaigns", id, id);
        return c.text("Entity deleted", 200);
    });
}
