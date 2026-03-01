import { z } from "zod";

const createIdSchema = z.coerce.number().int().positive();

export function responseJson(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            ...extraHeaders,
        },
    });
}

export function responseText(message: string, status = 400): Response {
    return new Response(message, { status });
}

export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T | Response> {
    let data: unknown;
    try {
        data = await req.json();
    } catch {
        return responseJson({ error: "Invalid JSON body" }, 400);
    }

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        return responseJson({ error: "Validation failed", issues: parsed.error.flatten() }, 400);
    }

    return parsed.data;
}

export function parseId(value: string | undefined): number | Response {
    const parsed = createIdSchema.safeParse(value);
    if (!parsed.success) {
        return responseJson({ error: "Invalid ID" }, 400);
    }
    return parsed.data;
}

export function compact<T extends object>(value: T): Partial<T> {
    const out = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined),
    );

    return out as Partial<T>;
}
