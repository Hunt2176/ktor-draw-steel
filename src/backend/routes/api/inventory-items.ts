import { Hono } from "hono";
import { allRows, runStatement, toInsertId, type SQLQueryBindings } from "../../db";
import { campaignIdForEntity } from "../../data/socket-data";
import { getInventoryItemById } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { asInt, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";
import type { InventoryItemDTO } from "../../types";

export function registerInventoryItemRoutes(api: Hono): void {
    api.get("/inventoryItem", (c) => {
        const rows = allRows<{ id: number }>("SELECT id FROM InventoryItem ORDER BY id");
        const data = rows
            .map((row) => getInventoryItemById(row.id))
            .filter((item): item is InventoryItemDTO => item != null);

        return c.json(data);
    });

    api.get("/inventoryItem/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const found = getInventoryItemById(id);
        if (found == null) {
            return c.text("Entity not found", 404);
        }

        return c.json(found);
    });

    api.post("/inventoryItem", async (c) => {
        const body = parseBodyObject(await c.req.json());
        const name = asString(body.name);
        const character = asInt(body.character);
        const quantity = asInt(body.quantity);

        if (name == null || character == null || quantity == null) {
            return c.text("name, character, and quantity are required", 400);
        }

        const result = runStatement(
            "INSERT INTO InventoryItem (name, character, quantity) VALUES (?, ?, ?)",
            name,
            character,
            Math.max(0, quantity),
        );

        const id = toInsertId(result);
        emitEntityChange("Created", "InventoryItem", id);
        return c.json(getInventoryItemById(id), 201);
    });

    api.patch("/inventoryItem/:id/modify/quantity", async (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const body = parseBodyObject(await c.req.json());
        const modifyBy = Math.max(0, asInt(body.modifyBy) ?? 0);
        const type = asString(body.type);

        const existing = getInventoryItemById(id);
        if (existing == null) {
            return c.text("Entity not found", 404);
        }

        const nextValue =
            type === "DECREASE"
                ? Math.max(0, existing.quantity - modifyBy)
                : Math.max(0, existing.quantity + modifyBy);

        runStatement("UPDATE InventoryItem SET quantity = ? WHERE id = ?", nextValue, id);
        emitEntityChange("Updated", "InventoryItem", id);

        return c.json(getInventoryItemById(id));
    });

    api.patch("/inventoryItem/:id", async (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        if (getInventoryItemById(id) == null) {
            return c.text("Entity not found", 404);
        }

        const body = parseBodyObject(await c.req.json());
        const updates: string[] = [];
        const values: SQLQueryBindings[] = [];

        if (Object.prototype.hasOwnProperty.call(body, "name")) {
            const parsed = asString(body.name);
            if (parsed != null) {
                updates.push("name = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "character")) {
            const parsed = asInt(body.character);
            if (parsed != null) {
                updates.push("character = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "quantity")) {
            const parsed = asInt(body.quantity);
            if (parsed != null) {
                updates.push("quantity = ?");
                values.push(Math.max(0, parsed));
            }
        }

        if (updates.length > 0) {
            runStatement(`UPDATE InventoryItem SET ${updates.join(", ")} WHERE id = ?`, ...values, id);
            emitEntityChange("Updated", "InventoryItem", id);
        }

        return c.json(getInventoryItemById(id));
    });

    api.delete("/inventoryItem/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const campaignId = campaignIdForEntity("InventoryItem", id);
        const deleted = runStatement("DELETE FROM InventoryItem WHERE id = ?", id);

        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        if (campaignId != null) {
            emitEntityChange("Removed", "InventoryItem", id, campaignId);
        }

        return c.text("Entity deleted", 200);
    });
}
