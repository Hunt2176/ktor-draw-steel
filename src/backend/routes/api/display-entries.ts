import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { db, toInsertId } from "../../db";
import { campaignIdForEntity } from "../../data/socket-data";
import { getDisplayEntryById } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { displayEntries } from "../../schema";
import { asInt, asNullableString, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";
import type { DisplayEntryDTO } from "../../types";

export function registerDisplayEntryRoutes(api: Hono): void {
    api.get("/displayEntry", (c) => {
        const rows = db
            .select({ id: displayEntries.id })
            .from(displayEntries)
            .orderBy(asc(displayEntries.id))
            .all();

        const data = rows
            .map((row) => getDisplayEntryById(row.id))
            .filter((item): item is DisplayEntryDTO => item != null);

        return c.json(data);
    });

    api.get("/displayEntry/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const found = getDisplayEntryById(id);
        if (found == null) {
            return c.text("Entity not found", 404);
        }

        return c.json(found);
    });

    api.post("/displayEntry", async (c) => {
        const body = parseBodyObject(await c.req.json());
        const title = asString(body.title);
        const campaign = asInt(body.campaign);
        const type = asString(body.type);

        if (title == null || campaign == null || (type !== "Portrait" && type !== "Background")) {
            return c.text("title, campaign, and valid type are required", 400);
        }

        const result = db
            .insert(displayEntries)
            .values({
                title,
                description: asNullableString(body.description) ?? null,
                pictureUrl: asNullableString(body.pictureUrl) ?? null,
                type,
                campaign,
            })
            .run();

        const id = toInsertId(result);
        emitEntityChange("Created", "DisplayEntry", id);
        return c.json(getDisplayEntryById(id), 201);
    });

    api.patch("/displayEntry/:id", async (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        if (getDisplayEntryById(id) == null) {
            return c.text("Entity not found", 404);
        }

        const body = parseBodyObject(await c.req.json());
        const updates: Partial<typeof displayEntries.$inferInsert> = {};

        if (Object.prototype.hasOwnProperty.call(body, "title")) {
            const parsed = asString(body.title);
            if (parsed != null) {
                updates.title = parsed;
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "description")) {
            const parsed = asNullableString(body.description);
            if (parsed !== undefined) {
                updates.description = parsed;
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "pictureUrl")) {
            const parsed = asNullableString(body.pictureUrl);
            if (parsed !== undefined) {
                updates.pictureUrl = parsed;
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "type")) {
            const parsed = asString(body.type);
            if (parsed === "Portrait" || parsed === "Background") {
                updates.type = parsed;
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "campaign")) {
            const parsed = asInt(body.campaign);
            if (parsed != null) {
                updates.campaign = parsed;
            }
        }

        if (Object.keys(updates).length > 0) {
            db.update(displayEntries).set(updates).where(eq(displayEntries.id, id)).run();
            emitEntityChange("Updated", "DisplayEntry", id);
        }

        return c.json(getDisplayEntryById(id));
    });

    api.delete("/displayEntry/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const campaignId = campaignIdForEntity("DisplayEntry", id);
        const deleted = db.delete(displayEntries).where(eq(displayEntries.id, id)).run();

        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        if (campaignId != null) {
            emitEntityChange("Removed", "DisplayEntry", id, campaignId);
        }

        return c.text("Entity deleted", 200);
    });
}
