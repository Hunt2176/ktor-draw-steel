import { Hono } from "hono";
import { allRows, firstRow, runStatement, toInsertId, transaction, type SQLQueryBindings } from "../../db";
import { getCampaignDtoById, getCombatById, getAllCombats } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { asBool, asInt, asNullableString, asString, parseBodyObject, parseIdParam } from "../../utils";

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
        const result = runStatement("INSERT INTO Combats (round, campaign) VALUES (?, ?)", round, campaign);
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

        transaction(() => {
            for (const characterId of characterIds) {
                const row = firstRow<{ id: number }>(
                    "SELECT id FROM Characters WHERE id = ? AND campaign = ?",
                    characterId,
                    campaignId,
                );
                if (row == null) {
                    throw new Error(`Character ${characterId} belonging to ${campaignId} not found`);
                }
            }

            const createdCombat = runStatement("INSERT INTO Combats (campaign) VALUES (?)", campaignId);
            combatId = toInsertId(createdCombat);

            for (const characterId of characterIds) {
                const combatant = runStatement(
                    "INSERT INTO Combatants (character, combat, available, surges, resources) VALUES (?, ?, 1, 0, 0)",
                    characterId,
                    combatId,
                );
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

        transaction(() => {
            runStatement("UPDATE Combats SET round = round + 1 WHERE id = ?", id);

            if (reset) {
                runStatement("UPDATE Combatants SET available = 1 WHERE combat = ?", id);
            }

            if (updateConditions) {
                const conditions = allRows<{ id: number; campaignId: number }>(
                    "SELECT cc.id AS id, ch.campaign AS campaignId FROM CharacterConditions cc JOIN Characters ch ON ch.id = cc.character JOIN Combatants cb ON cb.character = ch.id WHERE cb.combat = ? AND cc.end_type = 'endOfTurn'",
                    id,
                );

                for (const condition of conditions) {
                    runStatement("DELETE FROM CharacterConditions WHERE id = ?", condition.id);
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

        const character = firstRow<{ id: number }>(
            "SELECT id FROM Characters WHERE id = ? AND campaign = ?",
            characterId,
            combat.campaign,
        );

        if (character == null) {
            return c.text(`Character ${characterId} belonging to ${combat.campaign} not found`, 404);
        }

        const result = runStatement(
            "INSERT INTO Combatants (character, combat, available, surges, resources) VALUES (?, ?, 1, 0, 0)",
            characterId,
            combatId,
        );

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

        const deleted = runStatement(
            "DELETE FROM Combatants WHERE id = ? AND combat = ?",
            combatantId,
            combatId,
        );

        if ((deleted as { changes?: number }).changes !== 1) {
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

        transaction(() => {
            const createdCharacter = runStatement(
                "INSERT INTO Characters (name, might, agility, reason, intuition, presence, removed_hp, max_hp, temporary_hp, removed_recoveries, max_recoveries, temporary_recoveries, victories, minions, offstage, resource_name, picture_url, border, campaign, user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                name,
                asInt(character.might) ?? 0,
                asInt(character.agility) ?? 0,
                asInt(character.reason) ?? 0,
                asInt(character.intuition) ?? 0,
                asInt(character.presence) ?? 0,
                asInt(character.removedHp) ?? 0,
                asInt(character.maxHp) ?? 0,
                asInt(character.temporaryHp) ?? 0,
                asInt(character.removedRecoveries) ?? 0,
                asInt(character.maxRecoveries) ?? 0,
                asInt(character.temporaryRecoveries) ?? 0,
                asInt(character.victories) ?? 0,
                Math.max(0, asInt(character.minions) ?? 0),
                (asBool(character.offstage) ?? false) ? 1 : 0,
                asNullableString(character.resourceName) ?? null,
                asNullableString(character.pictureUrl) ?? null,
                asNullableString(character.border) ?? null,
                combat.campaign,
                user,
            );

            characterId = toInsertId(createdCharacter);

            const createdCombatant = runStatement(
                "INSERT INTO Combatants (character, combat, available, surges, resources) VALUES (?, ?, 1, 0, 0)",
                characterId,
                combatId,
            );
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

        transaction(() => {
            for (const raw of addList) {
                const characterId = asInt(raw);
                if (characterId == null) {
                    continue;
                }

                const character = firstRow<{ id: number }>(
                    "SELECT id FROM Characters WHERE id = ? AND campaign = ?",
                    characterId,
                    combat.campaign,
                );

                if (character == null) {
                    throw new Error(`Character ${characterId} belonging to ${combat.campaign} not found`);
                }

                const created = runStatement(
                    "INSERT INTO Combatants (character, combat, available, surges, resources) VALUES (?, ?, 1, 0, 0)",
                    characterId,
                    combatId,
                );
                createdCombatants.push(toInsertId(created));
            }

            for (const raw of removeList) {
                const characterId = asInt(raw);
                if (characterId == null) {
                    continue;
                }

                const combatant = firstRow<{ id: number }>(
                    "SELECT id FROM Combatants WHERE character = ? AND combat = ?",
                    characterId,
                    combatId,
                );

                if (combatant == null) {
                    throw new Error(`Combatant ${characterId} not found in ${combatId}`);
                }

                runStatement("DELETE FROM Combatants WHERE id = ?", combatant.id);
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
        const updates: string[] = [];
        const values: SQLQueryBindings[] = [];

        if (Object.prototype.hasOwnProperty.call(body, "round")) {
            const round = asInt(body.round);
            if (round != null) {
                updates.push("round = ?");
                values.push(Math.max(1, round));
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "campaign")) {
            const campaign = asInt(body.campaign);
            if (campaign != null) {
                updates.push("campaign = ?");
                values.push(campaign);
            }
        }

        if (updates.length > 0) {
            runStatement(`UPDATE Combats SET ${updates.join(", ")} WHERE id = ?`, ...values, id);
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

        runStatement("DELETE FROM Combats WHERE id = ?", id);
        emitEntityChange("Removed", "Combats", id, combat.campaign);
        return c.text("Entity deleted", 200);
    });
}
