import { Hono } from "hono";
import { allRows, runStatement, toInsertId, type SQLQueryBindings } from "../../db";
import { campaignIdForEntity } from "../../data/socket-data";
import { getCombatantById } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { asBool, asInt, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";
import type { CombatantDTO } from "../../types";

export function registerCombatantRoutes(api: Hono): void {
    api.get("/combatants", (c) => {
        const rows = allRows<{ id: number }>("SELECT id FROM Combatants ORDER BY id");
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

        const result = runStatement(
            "INSERT INTO Combatants (available, surges, resources, combat, character) VALUES (?, ?, ?, ?, ?)",
            available ? 1 : 0,
            surges,
            resources,
            combat,
            character,
        );

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

        runStatement("UPDATE Combatants SET resources = ? WHERE id = ?", updated, id);
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

        runStatement("UPDATE Combatants SET surges = ? WHERE id = ?", updated, id);
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
        const updates: string[] = [];
        const values: SQLQueryBindings[] = [];

        if (Object.prototype.hasOwnProperty.call(body, "available")) {
            const parsed = asBool(body.available);
            if (parsed != null) {
                updates.push("available = ?");
                values.push(parsed ? 1 : 0);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "surges")) {
            const parsed = asInt(body.surges);
            if (parsed != null) {
                updates.push("surges = ?");
                values.push(Math.max(0, parsed));
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "resources")) {
            const parsed = asInt(body.resources);
            if (parsed != null) {
                updates.push("resources = ?");
                values.push(Math.max(0, parsed));
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "combat")) {
            const parsed = asInt(body.combat);
            if (parsed != null) {
                updates.push("combat = ?");
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

        if (updates.length > 0) {
            runStatement(`UPDATE Combatants SET ${updates.join(", ")} WHERE id = ?`, ...values, id);
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
        const deleted = runStatement("DELETE FROM Combatants WHERE id = ?", id);

        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        if (campaignId != null) {
            emitEntityChange("Removed", "Combatants", id, campaignId);
        }

        return c.text("Entity deleted", 200);
    });
}
