import { eq } from "drizzle-orm";
import { characters, db, inventoryItems } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { notifyCampaign } from "../../../core/socket.js";
import { inventoryCreateSchema, inventoryPatchSchema, modifyValueSchema } from "../schemas.js";
import { inventoryRowToDto } from "../dto.js";
import { ApiRouter } from "../router.js";

export function registerInventoryRoutes(router: ApiRouter) {
    router.route("GET", /^\/api\/inventoryItem$/, () => {
        const rows = db.select().from(inventoryItems).all();
        return responseJson(rows.map(inventoryRowToDto));
    });

    router.route("POST", /^\/api\/inventoryItem$/, async ({ req }) => {
        const body = await parseBody(req, inventoryCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const character = db.select().from(characters).where(eq(characters.id, body.character)).get();
        if (!character) {
            return responseText("Character not found", 404);
        }

        const inserted = db.insert(inventoryItems).values(body).returning().get();
        const dto = inventoryRowToDto(inserted);
        notifyCampaign(character.campaign, "Created", "ExposedInventoryItem", inserted.id, dto);
        return responseJson(dto, 201);
    });

    router.route("GET", /^\/api\/inventoryItem\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        return responseJson(inventoryRowToDto(row));
    });

    router.route("PATCH", /^\/api\/inventoryItem\/(\d+)$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const before = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!before) {
            return responseText("Entity not found", 404);
        }

        const body = await parseBody(req, inventoryPatchSchema);
        if (body instanceof Response) {
            return body;
        }

        const update = compact(body);
        if (Object.keys(update).length > 0) {
            db.update(inventoryItems).set(update).where(eq(inventoryItems.id, id)).run();
        }

        const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
        if (character) {
            notifyCampaign(character.campaign, "Updated", "ExposedInventoryItem", id, inventoryRowToDto(row));
        }

        return responseJson(inventoryRowToDto(row));
    });

    router.route("DELETE", /^\/api\/inventoryItem\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
        db.delete(inventoryItems).where(eq(inventoryItems.id, id)).run();

        if (character) {
            notifyCampaign(character.campaign, "Removed", "ExposedInventoryItem", id, null);
        }

        return responseText("Entity deleted", 200);
    });

    router.route("PATCH", /^\/api\/inventoryItem\/(\d+)\/modify\/quantity$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, modifyValueSchema);
        if (body instanceof Response) {
            return body;
        }

        const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const quantity = Math.max(0, row.quantity + (body.type === "INCREASE" ? body.modifyBy : -body.modifyBy));
        db.update(inventoryItems).set({ quantity }).where(eq(inventoryItems.id, id)).run();

        const updated = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!updated) {
            return responseText("Entity not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, updated.character)).get();
        if (character) {
            notifyCampaign(character.campaign, "Updated", "ExposedInventoryItem", id, inventoryRowToDto(updated));
        }

        return responseJson(inventoryRowToDto(updated));
    });
}
