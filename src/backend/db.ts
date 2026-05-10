import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { DB_PATH } from "./constants";
import * as schema from "./schema";

export const sqlite = new Database(DB_PATH, { create: true });
export const db = drizzle(sqlite, { schema });

sqlite.exec("PRAGMA foreign_keys = ON;");

export function toInsertId(result: unknown): number {
    if (typeof result !== "object" || result == null) {
        throw new Error("Could not read insert id");
    }

    const raw = (result as { lastInsertRowid?: unknown }).lastInsertRowid;
    if (typeof raw === "bigint") {
        return Number(raw);
    }

    if (typeof raw === "number") {
        return raw;
    }

    throw new Error("Could not read insert id");
}
