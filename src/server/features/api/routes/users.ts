import { eq } from "drizzle-orm";
import { db, users } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { userCreateSchema, userPatchSchema } from "../schemas.js";
import type { RequestRouter } from "../../../core/router.js";

export function registerUserRoutes(router: RequestRouter) {
    router.route("/api/users", {
        GET: () => {
            const rows = db.select().from(users).all();
            return responseJson(rows);
        },
        POST: async ({ req }) => {
            const body = await parseBody(req, userCreateSchema);
            if (body instanceof Response) {
                return body;
            }

            const inserted = db.insert(users).values(body).returning().get();
            return responseJson(inserted, 201);
        },
    });

    router.route("/api/users/:id", {
        GET: ({ params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const row = db.select().from(users).where(eq(users.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            return responseJson(row);
        },
        PATCH: async ({ req, params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const body = await parseBody(req, userPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(users).set(update).where(eq(users.id, id)).run();
            }

            const row = db.select().from(users).where(eq(users.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            return responseJson(row);
        },
        DELETE: ({ params }) => {
            const id = parseId(params[0]);
            if (id instanceof Response) {
                return id;
            }

            const row = db.select().from(users).where(eq(users.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            db.delete(users).where(eq(users.id, id)).run();
            return responseText("Entity deleted", 200);
        },
    });
}
