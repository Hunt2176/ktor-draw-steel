import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { db, toInsertId } from "../../db";
import { campaignIdForEntity } from "../../data/socket-data";
import { getCharacterConditionById } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { characterConditions } from "../../schema";
import { asInt, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";
import type { CharacterConditionDTO } from "../../types";

export function registerCharacterConditionRoutes(api: Hono): void {
    api.get("/characterConditions", (c) => {
        const rows = db
            .select({ id: characterConditions.id })
            .from(characterConditions)
            .orderBy(asc(characterConditions.id))
            .all();

        const data = rows
            .map((row) => getCharacterConditionById(row.id))
            .filter((item): item is CharacterConditionDTO => item != null);

        return c.json(data);
    });

    api.get("/characterConditions/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const found = getCharacterConditionById(id);
        if (found == null) {
            return c.text("Entity not found", 404);
        }

        return c.json(found);
    });

    api.post("/characterConditions", async (c) => {
        const body = parseBodyObject(await c.req.json());
        const character = asInt(body.character);
        const name = asString(body.name);
        const endType = asString(body.endType);

        if (character == null || name == null || (endType !== "endOfTurn" && endType !== "save")) {
            return c.text("character, name, and endType are required", 400);
        }

        const result = db
            .insert(characterConditions)
            .values({
                character,
                name,
                endType,
            })
            .run();

        const id = toInsertId(result);
        emitEntityChange("Created", "CharacterConditions", id);
        return c.json(getCharacterConditionById(id), 201);
    });

    api.patch("/characterConditions/:id", async (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        if (getCharacterConditionById(id) == null) {
            return c.text("Entity not found", 404);
        }

        const body = parseBodyObject(await c.req.json());
        const updates: Partial<typeof characterConditions.$inferInsert> = {};

        if (Object.prototype.hasOwnProperty.call(body, "character")) {
            const parsed = asInt(body.character);
            if (parsed != null) {
                updates.character = parsed;
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "name")) {
            const parsed = asString(body.name);
            if (parsed != null) {
                updates.name = parsed;
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "endType")) {
            const parsed = asString(body.endType);
            if (parsed === "endOfTurn" || parsed === "save") {
                updates.endType = parsed;
            }
        }

        if (Object.keys(updates).length > 0) {
            db.update(characterConditions).set(updates).where(eq(characterConditions.id, id)).run();
            emitEntityChange("Updated", "CharacterConditions", id);
        }

        return c.json(getCharacterConditionById(id));
    });

    api.delete("/characterConditions/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const campaignId = campaignIdForEntity("CharacterConditions", id);
        const deleted = db.delete(characterConditions).where(eq(characterConditions.id, id)).run();

        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        if (campaignId != null) {
            emitEntityChange("Removed", "CharacterConditions", id, campaignId);
        }

        return c.text("Entity deleted", 200);
    });
}
