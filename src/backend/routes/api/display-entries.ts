import { Hono } from "hono";
import { allRows, runStatement, toInsertId, type SQLQueryBindings } from "../../db";
import { campaignIdForEntity } from "../../data/socket-data";
import { getDisplayEntryById } from "../../data/readers";
import { emitEntityChange } from "../../socket-hub";
import { asInt, asNullableString, asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";
import type { DisplayEntryDTO } from "../../types";

export function registerDisplayEntryRoutes(api: Hono): void {
    api.get("/displayEntry", (c) => {
        const rows = allRows<{ id: number }>("SELECT id FROM DisplayEntry ORDER BY id");
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

        const result = runStatement(
            "INSERT INTO DisplayEntry (title, description, picture_url, type, campaign) VALUES (?, ?, ?, ?, ?)",
            title,
            asNullableString(body.description) ?? null,
            asNullableString(body.pictureUrl) ?? null,
            type,
            campaign,
        );

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
        const updates: string[] = [];
        const values: SQLQueryBindings[] = [];

        if (Object.prototype.hasOwnProperty.call(body, "title")) {
            const parsed = asString(body.title);
            if (parsed != null) {
                updates.push("title = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "description")) {
            const parsed = asNullableString(body.description);
            if (parsed !== undefined) {
                updates.push("description = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "pictureUrl")) {
            const parsed = asNullableString(body.pictureUrl);
            if (parsed !== undefined) {
                updates.push("picture_url = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "type")) {
            const parsed = asString(body.type);
            if (parsed === "Portrait" || parsed === "Background") {
                updates.push("type = ?");
                values.push(parsed);
            }
        }

        if (Object.prototype.hasOwnProperty.call(body, "campaign")) {
            const parsed = asInt(body.campaign);
            if (parsed != null) {
                updates.push("campaign = ?");
                values.push(parsed);
            }
        }

        if (updates.length > 0) {
            runStatement(`UPDATE DisplayEntry SET ${updates.join(", ")} WHERE id = ?`, ...values, id);
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
        const deleted = runStatement("DELETE FROM DisplayEntry WHERE id = ?", id);

        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        if (campaignId != null) {
            emitEntityChange("Removed", "DisplayEntry", id, campaignId);
        }

        return c.text("Entity deleted", 200);
    });
}
