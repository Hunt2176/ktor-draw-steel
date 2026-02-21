import { eq } from "drizzle-orm";
import { campaigns, characters, db, users } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { notifyCampaign } from "../../../core/socket.js";
import {
    characterCreateSchema,
    characterHealthSchema,
    characterPatchSchema,
    characterRecoveriesSchema,
} from "../schemas.js";
import { buildCharacterDtos, getCharacterDtoById } from "../dto.js";
import type { RequestRouter } from "../../../core/router.js";

export function registerCharacterRoutes(router: RequestRouter) {
    router.route("/api/characters", {
        GET: () => {
            const rows = db.select().from(characters).all();
            return responseJson(buildCharacterDtos(rows));
        },
        POST: async ({ req }) => {
            const body = await parseBody(req, characterCreateSchema);
            if (body instanceof Response) {
                return body;
            }

            const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
            if (!campaignExists) {
                return responseText("Campaign not found", 404);
            }

            const userExists = db.select().from(users).where(eq(users.id, body.user)).get();
            if (!userExists) {
                return responseText("User not found", 404);
            }

            const inserted = db.insert(characters).values({
                name: body.name,
                might: body.might ?? 0,
                agility: body.agility ?? 0,
                reason: body.reason ?? 0,
                intuition: body.intuition ?? 0,
                presence: body.presence ?? 0,
                removedHp: body.removedHp ?? 0,
                maxHp: body.maxHp ?? 0,
                temporaryHp: body.temporaryHp ?? 0,
                removedRecoveries: body.removedRecoveries ?? 0,
                maxRecoveries: body.maxRecoveries ?? 0,
                temporaryRecoveries: body.temporaryRecoveries ?? 0,
                victories: body.victories ?? 0,
                minions: body.minions ?? 0,
                offstage: body.offstage ?? false,
                resourceName: body.resourceName ?? null,
                pictureUrl: body.pictureUrl ?? null,
                border: body.border ?? null,
                campaign: body.campaign,
                user: body.user,
            }).returning().get();

            const dto = getCharacterDtoById(inserted.id);
            notifyCampaign(body.campaign, "Created", "ExposedCharacter", inserted.id, dto);
            return responseJson(dto, 201);
        },
    });

    router.route("/api/characters/:id", {
        GET: ({ params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }

            return responseJson(dto);
        },
        PATCH: async ({ req, params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const before = db.select().from(characters).where(eq(characters.id, id)).get();
            if (!before) {
                return responseText("Character not found", 404);
            }

            const body = await parseBody(req, characterPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            if (body.campaign != null) {
                const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
                if (!campaignExists) {
                    return responseText("Campaign not found", 404);
                }
            }

            if (body.user != null) {
                const userExists = db.select().from(users).where(eq(users.id, body.user)).get();
                if (!userExists) {
                    return responseText("User not found", 404);
                }
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(characters).set(update).where(eq(characters.id, id)).run();
            }

            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }

            notifyCampaign(dto.campaign, "Updated", "ExposedCharacter", id, dto);
            return responseJson(dto);
        },
        DELETE: ({ params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }

            db.delete(characters).where(eq(characters.id, id)).run();
            notifyCampaign(dto.campaign, "Removed", "ExposedCharacter", id, null);
            return responseText("Entity deleted", 200);
        },
    });

    router.route("/api/characters/:id/modify/health", {
        PATCH: async ({ req, params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const body = await parseBody(req, characterHealthSchema);
            if (body instanceof Response) {
                return body;
            }

            const row = db.select().from(characters).where(eq(characters.id, id)).get();
            if (!row) {
                return responseText("Character not found", 404);
            }

            let removedHp = Math.max(row.removedHp, 0);
            let temporaryHp = Math.max(row.temporaryHp, 0);

            if (body.type === "HEAL") {
                removedHp = Math.max(0, removedHp - body.mod);
            } else if (temporaryHp > 0) {
                const after = temporaryHp - body.mod;
                temporaryHp = Math.max(0, after);
                if (after < 0) {
                    removedHp += Math.max(0, -after);
                }
            } else {
                removedHp += body.mod;
            }

            db.update(characters).set({ removedHp, temporaryHp }).where(eq(characters.id, id)).run();

            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }

            notifyCampaign(dto.campaign, "Updated", "ExposedCharacter", id, dto);
            return responseJson(dto);
        },
    });

    router.route("/api/characters/:id/modify/recoveries", {
        PATCH: async ({ req, params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const body = await parseBody(req, characterRecoveriesSchema);
            if (body instanceof Response) {
                return body;
            }

            const row = db.select().from(characters).where(eq(characters.id, id)).get();
            if (!row) {
                return responseText("Character not found", 404);
            }

            let removedRecoveries = Math.max(row.removedRecoveries, 0);
            let temporaryRecoveries = Math.max(row.temporaryRecoveries, 0);

            if (body.type === "INCREASE") {
                removedRecoveries = Math.max(0, removedRecoveries - body.mod);
            } else if (temporaryRecoveries > 0) {
                const after = temporaryRecoveries - body.mod;
                temporaryRecoveries = Math.max(0, after);
                if (after < 0) {
                    removedRecoveries += Math.max(0, -after);
                }
            } else {
                removedRecoveries += body.mod;
            }

            db.update(characters).set({ removedRecoveries, temporaryRecoveries }).where(eq(characters.id, id)).run();

            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }

            notifyCampaign(dto.campaign, "Updated", "ExposedCharacter", id, dto);
            return responseJson(dto);
        },
    });
}
