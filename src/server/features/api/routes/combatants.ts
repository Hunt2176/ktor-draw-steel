import { eq } from "drizzle-orm";
import { characters, combatants, combats, db } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { notifyCampaign } from "../../../core/socket.js";
import { combatantCreateSchema, combatantPatchSchema, combatantValueSchema } from "../schemas.js";
import { getCharacterDtoById } from "../dto.js";
import { ApiRouter } from "../router.js";

export function registerCombatantRoutes(router: ApiRouter) {
    router.route("GET", /^\/api\/combatants$/, () => {
        const rows = db.select().from(combatants).all();
        const result = rows
            .map((row) => ({
                id: row.id,
                available: row.available,
                surges: row.surges,
                resources: row.resources,
                combat: row.combat,
                character: getCharacterDtoById(row.character),
            }))
            .filter((row) => row.character != null);

        return responseJson(result);
    });

    router.route("POST", /^\/api\/combatants$/, async ({ req }) => {
        const body = await parseBody(req, combatantCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, body.combat)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, body.character)).get();
        if (!character) {
            return responseText("Character not found", 404);
        }

        const inserted = db.insert(combatants).values({
            available: body.available ?? true,
            surges: body.surges ?? 0,
            resources: body.resources ?? 0,
            combat: body.combat,
            character: body.character,
        }).returning().get();

        const dto = {
            id: inserted.id,
            available: inserted.available,
            surges: inserted.surges,
            resources: inserted.resources,
            combat: inserted.combat,
            character: getCharacterDtoById(inserted.character),
        };

        notifyCampaign(combat.campaign, "Created", "ExposedCombatant", inserted.id, dto);
        return responseJson(dto, 201);
    });

    router.route("GET", /^\/api\/combatants\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        return responseJson({
            id: row.id,
            available: row.available,
            surges: row.surges,
            resources: row.resources,
            combat: row.combat,
            character: getCharacterDtoById(row.character),
        });
    });

    router.route("PATCH", /^\/api\/combatants\/(\d+)$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const before = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!before) {
            return responseText("Entity not found", 404);
        }

        const body = await parseBody(req, combatantPatchSchema);
        if (body instanceof Response) {
            return body;
        }

        const update = compact(body);
        if (Object.keys(update).length > 0) {
            db.update(combatants).set(update).where(eq(combatants.id, id)).run();
        }

        const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const combat = db.select().from(combats).where(eq(combats.id, row.combat)).get();

        const dto = {
            id: row.id,
            available: row.available,
            surges: row.surges,
            resources: row.resources,
            combat: row.combat,
            character: getCharacterDtoById(row.character),
        };

        if (combat) {
            notifyCampaign(combat.campaign, "Updated", "ExposedCombatant", id, dto);
        }

        return responseJson(dto);
    });

    router.route("DELETE", /^\/api\/combatants\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const combat = db.select().from(combats).where(eq(combats.id, row.combat)).get();
        db.delete(combatants).where(eq(combatants.id, id)).run();

        if (combat) {
            notifyCampaign(combat.campaign, "Removed", "ExposedCombatant", id, null);
        }

        return responseText("Entity deleted", 200);
    });

    router.route("PATCH", /^\/api\/combatants\/(\d+)\/(resources|surges)$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const key = params[1];
        const body = await parseBody(req, combatantValueSchema);
        if (body instanceof Response) {
            return body;
        }

        const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!row) {
            return responseText("Combatant not found", 404);
        }

        const delta = body.type === "INCREASE" ? body.value : -body.value;
        const nextVal = Math.max(0, (key === "resources" ? row.resources : row.surges) + delta);

        if (key === "resources") {
            db.update(combatants).set({ resources: nextVal }).where(eq(combatants.id, id)).run();
        } else {
            db.update(combatants).set({ surges: nextVal }).where(eq(combatants.id, id)).run();
        }

        const updated = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!updated) {
            return responseText("Combatant not found", 404);
        }

        const combat = db.select().from(combats).where(eq(combats.id, updated.combat)).get();
        const dto = {
            id: updated.id,
            available: updated.available,
            surges: updated.surges,
            resources: updated.resources,
            combat: updated.combat,
            character: getCharacterDtoById(updated.character),
        };

        if (combat) {
            notifyCampaign(combat.campaign, "Updated", "ExposedCombatant", id, dto);
        }

        return responseJson(dto);
    });
}
