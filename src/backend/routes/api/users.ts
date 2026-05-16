import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, toInsertId } from "../../db";
import { getUserById, getUsers } from "../../data/readers";
import { users } from "../../schema";
import { asString, getChanges, parseBodyObject, parseIdParam } from "../../utils";

export function registerUserRoutes(api: Hono): void {
	api.get("/users", (c) => c.json(getUsers()));

	api.get("/users/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const found = getUserById(id);
		if (found == null) {
			return c.text("Entity not found", 404);
		}

		return c.json(found);
	});

	api.post("/users", async (c) => {
		const body = parseBodyObject(await c.req.json());
		const name = asString(body.name);

		if (name == null || name.trim() === "") {
			return c.text("Name is required", 400);
		}

		const result = db.insert(users).values({ name }).run();
		const id = toInsertId(result);
		return c.json(getUserById(id), 201);
	});

	api.patch("/users/:id", async (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		if (getUserById(id) == null) {
			return c.text("Entity not found", 404);
		}

		const body = parseBodyObject(await c.req.json());
		const name = asString(body.name);

		if (name != null) {
			db.update(users).set({ name }).where(eq(users.id, id)).run();
		}

		return c.json(getUserById(id));
	});

	api.delete("/users/:id", (c) => {
		const id = parseIdParam(c);
		if (id == null) {
			return c.text("Invalid ID", 400);
		}

		const deleted = db.delete(users).where(eq(users.id, id)).run();
		if (getChanges(deleted) === 0) {
			return c.text("Entity not found", 404);
		}

		return c.json({ message: "Entity deleted" });
	});
}
