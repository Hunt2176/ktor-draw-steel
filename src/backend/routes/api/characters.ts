import { Hono } from "hono";
import { runStatement, toInsertId, type SQLQueryBindings } from "../../db";
import { getCharacterById, getAllCharacters } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
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

        const result = runStatement(
            "INSERT INTO Characters (name, might, agility, reason, intuition, presence, removed_hp, max_hp, temporary_hp, removed_recoveries, max_recoveries, temporary_recoveries, victories, minions, offstage, resource_name, picture_url, border, campaign, user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            name,
            asInt(body.might) ?? 0,
            asInt(body.agility) ?? 0,
            asInt(body.reason) ?? 0,
            asInt(body.intuition) ?? 0,
            asInt(body.presence) ?? 0,
            asInt(body.removedHp) ?? 0,
            asInt(body.maxHp) ?? 0,
            asInt(body.temporaryHp) ?? 0,
            asInt(body.removedRecoveries) ?? 0,
            asInt(body.maxRecoveries) ?? 0,
            asInt(body.temporaryRecoveries) ?? 0,
            asInt(body.victories) ?? 0,
            Math.max(0, asInt(body.minions) ?? 0),
            (asBool(body.offstage) ?? false) ? 1 : 0,
            asNullableString(body.resourceName) ?? null,
            asNullableString(body.pictureUrl) ?? null,
            asNullableString(body.border) ?? null,
            campaign,
            user,
        );

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

        runStatement(
            "UPDATE Characters SET temporary_hp = ?, removed_hp = ? WHERE id = ?",
            temporaryHp,
            Math.max(0, removedHp),
            id,
        );

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

        runStatement(
            "UPDATE Characters SET temporary_recoveries = ?, removed_recoveries = ? WHERE id = ?",
            temporaryRecoveries,
            Math.max(0, removedRecoveries),
            id,
        );

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
        const updates: string[] = [];
        const values: SQLQueryBindings[] = [];

        const assignInt = (jsonKey: string, column: string) => {
            if (Object.prototype.hasOwnProperty.call(body, jsonKey)) {
                const parsed = asInt(body[jsonKey]);
                if (parsed != null) {
                    updates.push(`${column} = ?`);
                    values.push(parsed);
                }
            }
        };

        const assignText = (jsonKey: string, column: string, nullable = false) => {
            if (!Object.prototype.hasOwnProperty.call(body, jsonKey)) {
                return;
            }

            const parsed = nullable ? asNullableString(body[jsonKey]) : asString(body[jsonKey]);
            if (parsed !== undefined && (nullable || parsed != null)) {
                updates.push(`${column} = ?`);
                values.push(parsed);
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
                updates.push("minions = ?");
                values.push(Math.max(0, parsed));
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "offstage")) {
            const parsed = asBool(body.offstage);
            if (parsed != null) {
                updates.push("offstage = ?");
                values.push(parsed ? 1 : 0);
            }
        }

        assignText("resourceName", "resource_name", true);
        assignText("pictureUrl", "picture_url", true);
        assignText("border", "border", true);

        if (Object.prototype.hasOwnProperty.call(body, "campaign")) {
            const parsed = asInt(body.campaign);
            if (parsed != null) {
                updates.push("campaign = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "user")) {
            const parsed = asInt(body.user);
            if (parsed != null) {
                updates.push("user = ?");
                values.push(parsed);
            }
        }

        if (updates.length > 0) {
            runStatement(`UPDATE Characters SET ${updates.join(", ")} WHERE id = ?`, ...values, id);
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

        runStatement("DELETE FROM Characters WHERE id = ?", id);
        emitEntityChange("Removed", "Characters", id, character.campaign);
        return c.text("Entity deleted", 200);
    });
}
