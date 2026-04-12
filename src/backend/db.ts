import { Database, type SQLQueryBindings } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { DB_PATH } from "./constants";
import * as schema from "./schema";

export { type SQLQueryBindings };

export const sqlite = new Database(DB_PATH, { create: true });
export const db = drizzle(sqlite, { schema });

sqlite.exec("PRAGMA foreign_keys = ON;");

export function allRows<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
    return sqlite.query(sql).all(...params) as T[];
}

export function firstRow<T>(sql: string, ...params: SQLQueryBindings[]): T | null {
    const row = sqlite.query(sql).get(...params) as T | null;
    return row ?? null;
}

export function runStatement(sql: string, ...params: SQLQueryBindings[]) {
    return sqlite.query(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
    return sqlite.transaction(fn)();
}

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
