import { Hono } from "hono";
import { allRows, runStatement, toInsertId, type SQLQueryBindings } from "../../db";
import { campaignIdForEntity } from "../../data/socket-data";
import { getCharacterConditionById } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { asInt, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";
import type { CharacterConditionDTO } from "../../types";

export function registerCharacterConditionRoutes(api: Hono): void {
    api.get("/characterConditions", (c) => {
        const rows = allRows<{ id: number }>("SELECT id FROM CharacterConditions ORDER BY id");
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

        const result = runStatement(
            "INSERT INTO CharacterConditions (character, name, end_type) VALUES (?, ?, ?)",
            character,
            name,
            endType,
        );

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
        const updates: string[] = [];
        const values: SQLQueryBindings[] = [];

        if (Object.prototype.hasOwnProperty.call(body, "character")) {
            const parsed = asInt(body.character);
            if (parsed != null) {
                updates.push("character = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "name")) {
            const parsed = asString(body.name);
            if (parsed != null) {
                updates.push("name = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "endType")) {
            const parsed = asString(body.endType);
            if (parsed === "endOfTurn" || parsed === "save") {
                updates.push("end_type = ?");
                values.push(parsed);
            }
        }

        if (updates.length > 0) {
            runStatement(`UPDATE CharacterConditions SET ${updates.join(", ")} WHERE id = ?`, ...values, id);
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
        const deleted = runStatement("DELETE FROM CharacterConditions WHERE id = ?", id);

        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        if (campaignId != null) {
            emitEntityChange("Removed", "CharacterConditions", id, campaignId);
        }

        return c.text("Entity deleted", 200);
    });
}
