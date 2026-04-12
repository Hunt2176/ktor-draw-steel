import type { Context } from "hono";
import type { JsonRecord } from "./types";

export function asObject(value: unknown): JsonRecord {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
        return {};
    }
    return value as JsonRecord;
}

export function asInt(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

export function asString(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}

export function asNullableString(value: unknown): string | null | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return typeof value === "string" ? value : null;
}

export function asBool(value: unknown): boolean | null {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return null;
}

export function parseIdParam(c: Context, key = "id"): number | null {
    const raw = c.req.param(key) ?? "";
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export function parseBodyObject(body: unknown): JsonRecord {
    return asObject(body);
}

export function getChanges(result: unknown): number {
    const changes = asObject(result).changes;
    return typeof changes === "number" ? changes : 0;
}
