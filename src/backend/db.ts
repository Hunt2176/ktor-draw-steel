import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { DB_PATH } from "./constants";
import * as schema from "./schema";

export const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });

sqlite.pragma("foreign_keys = ON");

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
