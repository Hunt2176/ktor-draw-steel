import { eq } from "drizzle-orm";
import { campaigns, db, displayEntries } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { notifyCampaign } from "../../../core/socket.js";
import { displayEntryCreateSchema, displayEntryPatchSchema } from "../schemas.js";
import { displayEntryRowToDto } from "../dto.js";
import { ApiRouter } from "../router.js";

export function registerDisplayEntryRoutes(router: ApiRouter) {
    router.route("GET", "/api/displayEntry", () => {
        const rows = db.select().from(displayEntries).all();
        return responseJson(rows.map(displayEntryRowToDto));
    });

    router.route("POST", "/api/displayEntry", async ({ req }) => {
        const body = await parseBody(req, displayEntryCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const campaign = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
        if (!campaign) {
            return responseText("Campaign not found", 404);
        }

        const inserted = db.insert(displayEntries).values(body).returning().get();
        const dto = displayEntryRowToDto(inserted);
        notifyCampaign(campaign.id, "Created", "ExposedDisplayEntry", inserted.id, dto);
        return responseJson(dto, 201);
    });

    router.route("GET", "/api/displayEntry/:id", ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        return responseJson(displayEntryRowToDto(row));
    });

    router.route("PATCH", "/api/displayEntry/:id", async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const before = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
        if (!before) {
            return responseText("Entity not found", 404);
        }

        const body = await parseBody(req, displayEntryPatchSchema);
        if (body instanceof Response) {
            return body;
        }

        const update = compact(body);
        if (Object.keys(update).length > 0) {
            db.update(displayEntries).set(update).where(eq(displayEntries.id, id)).run();
        }

        const row = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        notifyCampaign(row.campaign, "Updated", "ExposedDisplayEntry", id, displayEntryRowToDto(row));
        return responseJson(displayEntryRowToDto(row));
    });

    router.route("DELETE", "/api/displayEntry/:id", ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const row = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        db.delete(displayEntries).where(eq(displayEntries.id, id)).run();
        notifyCampaign(row.campaign, "Removed", "ExposedDisplayEntry", id, null);
        return responseText("Entity deleted", 200);
    });
}
