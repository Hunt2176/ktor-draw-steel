import { and, eq, inArray } from "drizzle-orm";
import { campaigns, characterConditions, characters, combatants, combats, db, users } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { notifyCampaign } from "../../../core/socket.js";
import {
    combatCreateSchema,
    combatModifySchema,
    combatPatchSchema,
    combatQuickAddSchema,
    combatRoundSchema,
    combatantRequestSchema,
} from "../schemas.js";
import { getCharacterDtoById, getCombatDtoById } from "../dto.js";
import { ApiRouter } from "../router.js";

export function registerCombatRoutes(router: ApiRouter) {
    router.route("GET", /^\/api\/combats$/, () => {
        const rows = db.select().from(combats).all();
        return responseJson(rows.map((row) => getCombatDtoById(row.id)).filter((row) => row != null));
    });

    router.route("POST", /^\/api\/combats$/, async ({ req }) => {
        const body = await parseBody(req, combatPatchSchema.extend({ campaign: combatCreateSchema.shape.campaign }));
        if (body instanceof Response) {
            return body;
        }

        const inserted = db.insert(combats).values({
            campaign: body.campaign,
            round: body.round ?? 1,
        }).returning().get();

        const dto = getCombatDtoById(inserted.id);
        notifyCampaign(inserted.campaign, "Created", "ExposedCombat", inserted.id, dto);
        return responseJson(dto, 201);
    });

    router.route("POST", /^\/api\/combats\/create$/, async ({ req }) => {
        const body = await parseBody(req, combatCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const campaign = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
        if (!campaign) {
            return responseText("Campaign not found", 404);
        }

        const existingCharacters = body.characters.length > 0
            ? db.select().from(characters).where(and(eq(characters.campaign, body.campaign), inArray(characters.id, body.characters))).all()
            : [];

        if (existingCharacters.length !== body.characters.length) {
            return responseText("One or more characters not found for campaign", 404);
        }

        const combatId = db.transaction((tx) => {
            const inserted = tx.insert(combats).values({ campaign: body.campaign, round: 1 }).returning().get();
            for (const charId of body.characters) {
                tx.insert(combatants).values({ combat: inserted.id, character: charId }).run();
            }
            return inserted.id;
        });

        const dto = getCombatDtoById(combatId);
        notifyCampaign(body.campaign, "Created", "ExposedCombat", combatId, dto);
        return responseJson(dto, 201);
    });

    router.route("GET", /^\/api\/combats\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const dto = getCombatDtoById(id);
        if (!dto) {
            return responseText("Combat not found", 404);
        }

        return responseJson(dto);
    });

    router.route("PATCH", /^\/api\/combats\/(\d+)$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const before = db.select().from(combats).where(eq(combats.id, id)).get();
        if (!before) {
            return responseText("Combat not found", 404);
        }

        const body = await parseBody(req, combatPatchSchema);
        if (body instanceof Response) {
            return body;
        }

        const update = compact(body);
        if (Object.keys(update).length > 0) {
            db.update(combats).set(update).where(eq(combats.id, id)).run();
        }

        const dto = getCombatDtoById(id);
        if (!dto) {
            return responseText("Combat not found", 404);
        }

        notifyCampaign(dto.campaign, "Updated", "ExposedCombat", id, dto);
        return responseJson(dto);
    });

    router.route("DELETE", /^\/api\/combats\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const before = db.select().from(combats).where(eq(combats.id, id)).get();
        if (!before) {
            return responseText("Combat not found", 404);
        }

        db.delete(combats).where(eq(combats.id, id)).run();
        notifyCampaign(before.campaign, "Removed", "ExposedCombat", id, null);
        return responseText("Entity deleted", 200);
    });

    router.route("PATCH", /^\/api\/combats\/(\d+)\/nextRound$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, combatRoundSchema);
        if (body instanceof Response) {
            return body;
        }

        const updatedCombatId = db.transaction((tx) => {
            const combat = tx.select().from(combats).where(eq(combats.id, id)).get();
            if (!combat) {
                throw new Error("Combat not found");
            }

            if (combat.round !== body.fromRound) {
                throw new Error("Combat round has changed");
            }

            tx.update(combats).set({ round: combat.round + 1 }).where(eq(combats.id, id)).run();

            if (body.reset) {
                tx.update(combatants).set({ available: true }).where(eq(combatants.combat, id)).run();
            }

            if (body.updateConditions) {
                const cbs = tx.select().from(combatants).where(eq(combatants.combat, id)).all();
                const charIds = cbs.map((row) => row.character);
                if (charIds.length > 0) {
                    tx.delete(characterConditions)
                        .where(and(inArray(characterConditions.character, charIds), eq(characterConditions.endType, "endOfTurn")))
                        .run();
                }
            }

            return id;
        });

        const dto = getCombatDtoById(updatedCombatId);
        if (!dto) {
            return responseText("Combat not found", 404);
        }

        notifyCampaign(dto.campaign, "Updated", "ExposedCombat", id, dto);
        return responseJson(dto);
    });

    router.route("PATCH", /^\/api\/combats\/(\d+)\/(add|remove)$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const mode = params[1];
        const body = await parseBody(req, combatantRequestSchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, id)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        if (mode === "add") {
            const character = db
                .select()
                .from(characters)
                .where(and(eq(characters.id, body.character), eq(characters.campaign, combat.campaign)))
                .get();

            if (!character) {
                return responseText("Character not found in campaign", 404);
            }

            db.insert(combatants).values({ combat: id, character: body.character }).run();
        } else {
            const existing = db
                .select()
                .from(combatants)
                .where(and(eq(combatants.combat, id), eq(combatants.id, body.character)))
                .get();

            if (!existing) {
                return responseText("Combatant not found in combat", 404);
            }

            db.delete(combatants).where(eq(combatants.id, existing.id)).run();
            notifyCampaign(combat.campaign, "Removed", "ExposedCombatant", existing.id, null);
        }

        const dto = getCombatDtoById(id);
        if (!dto) {
            return responseText("Combat not found", 404);
        }

        notifyCampaign(combat.campaign, "Updated", "ExposedCombat", id, dto);
        return responseJson(dto);
    });

    router.route("PATCH", /^\/api\/combats\/(\d+)\/quickAdd$/, async ({ req, params }) => {
        const combatId = parseId(params[0]);
        if (combatId instanceof Response) {
            return combatId;
        }

        const body = await parseBody(req, combatQuickAddSchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, combatId)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        const userExists = db.select().from(users).where(eq(users.id, body.character.user)).get();
        if (!userExists) {
            return responseText("User not found", 404);
        }

        const newCharacterId = db.transaction((tx) => {
            const insertedCharacter = tx.insert(characters).values({
                name: body.character.name,
                might: body.character.might ?? 0,
                agility: body.character.agility ?? 0,
                reason: body.character.reason ?? 0,
                intuition: body.character.intuition ?? 0,
                presence: body.character.presence ?? 0,
                removedHp: body.character.removedHp ?? 0,
                maxHp: body.character.maxHp ?? 0,
                temporaryHp: body.character.temporaryHp ?? 0,
                removedRecoveries: body.character.removedRecoveries ?? 0,
                maxRecoveries: body.character.maxRecoveries ?? 0,
                temporaryRecoveries: body.character.temporaryRecoveries ?? 0,
                victories: body.character.victories ?? 0,
                minions: body.character.minions ?? 0,
                offstage: body.character.offstage ?? false,
                resourceName: body.character.resourceName ?? null,
                pictureUrl: body.character.pictureUrl ?? null,
                border: body.character.border ?? null,
                campaign: combat.campaign,
                user: body.character.user,
            }).returning().get();

            tx.insert(combatants).values({
                combat: combatId,
                character: insertedCharacter.id,
            }).run();

            return insertedCharacter.id;
        });

        const dto = getCombatDtoById(combatId);
        notifyCampaign(combat.campaign, "Created", "ExposedCharacter", newCharacterId, getCharacterDtoById(newCharacterId));
        notifyCampaign(combat.campaign, "Updated", "ExposedCombat", combatId, dto);
        return responseJson(dto);
    });

    router.route("PATCH", /^\/api\/combats\/(\d+)\/modify$/, async ({ req, params }) => {
        const combatId = parseId(params[0]);
        if (combatId instanceof Response) {
            return combatId;
        }

        const body = await parseBody(req, combatModifySchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, combatId)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        db.transaction((tx) => {
            for (const charId of body.add ?? []) {
                const character = tx
                    .select()
                    .from(characters)
                    .where(and(eq(characters.id, charId), eq(characters.campaign, combat.campaign)))
                    .get();
                if (!character) {
                    throw new Error(`Character ${charId} not found in campaign`);
                }
                tx.insert(combatants).values({ combat: combatId, character: charId }).run();
            }

            for (const charId of body.remove ?? []) {
                const combatant = tx
                    .select()
                    .from(combatants)
                    .where(and(eq(combatants.combat, combatId), eq(combatants.character, charId)))
                    .get();
                if (!combatant) {
                    throw new Error(`Combatant ${charId} not found in combat`);
                }
                tx.delete(combatants).where(eq(combatants.id, combatant.id)).run();
            }
        });

        const dto = getCombatDtoById(combatId);
        notifyCampaign(combat.campaign, "Updated", "ExposedCombat", combatId, dto);
        return responseJson(dto);
    });
}
