import { eq } from "drizzle-orm";
import { characterConditions, characters, db } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { notifyCampaign } from "../../../core/socket.js";
import { characterConditionCreateSchema, characterConditionPatchSchema } from "../schemas.js";
import { characterConditionRowToDto } from "../dto.js";
import { ApiRouter } from "../router.js";

export function registerCharacterConditionRoutes(router: ApiRouter) {
    router.route("GET", "/api/characterConditions", () => {
        const rows = db.select().from(characterConditions).all();
        return responseJson(rows.map(characterConditionRowToDto));
    });

    router.route("POST", "/api/characterConditions", async ({ req }) => {
        const body = await parseBody(req, characterConditionCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const character = db.select().from(characters).where(eq(characters.id, body.character)).get();
        if (!character) {
            return responseText("Character not found", 404);
        }

        const inserted = db.insert(characterConditions).values(body).returning().get();
        const dto = characterConditionRowToDto(inserted);

        notifyCampaign(character.campaign, "Created", "ExposedCharacterCondition", inserted.id, dto);
        return responseJson(dto, 201);
    });

    router.route("GET", "/api/characterConditions/:id", ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        return responseJson(characterConditionRowToDto(row));
    });

    router.route("PATCH", "/api/characterConditions/:id", async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const before = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
        if (!before) {
            return responseText("Entity not found", 404);
        }

        const body = await parseBody(req, characterConditionPatchSchema);
        if (body instanceof Response) {
            return body;
        }

        const update = compact(body);
        if (Object.keys(update).length > 0) {
            db.update(characterConditions).set(update).where(eq(characterConditions.id, id)).run();
        }

        const row = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
        if (character) {
            notifyCampaign(character.campaign, "Updated", "ExposedCharacterCondition", id, characterConditionRowToDto(row));
        }

        return responseJson(characterConditionRowToDto(row));
    });

    router.route("DELETE", "/api/characterConditions/:id", ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
        db.delete(characterConditions).where(eq(characterConditions.id, id)).run();

        if (character) {
            notifyCampaign(character.campaign, "Removed", "ExposedCharacterCondition", id, null);
        }

        return responseText("Entity deleted", 200);
    });
}
