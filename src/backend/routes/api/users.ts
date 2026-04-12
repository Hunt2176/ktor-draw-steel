import { Hono } from "hono";
import { runStatement, toInsertId } from "../../db";
import { getUserById, getUsers } from "../../data/readers";
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

        const result = runStatement("INSERT INTO Users (name) VALUES (?)", name);
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
            runStatement("UPDATE Users SET name = ? WHERE id = ?", name, id);
        }

        return c.json(getUserById(id));
    });

    api.delete("/users/:id", (c) => {
        const id = parseIdParam(c);
        if (id == null) {
            return c.text("Invalid ID", 400);
        }

        const deleted = runStatement("DELETE FROM Users WHERE id = ?", id);
        if (getChanges(deleted) === 0) {
            return c.text("Entity not found", 404);
        }

        return c.text("Entity deleted", 200);
    });
}
