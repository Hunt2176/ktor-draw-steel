import { responseText } from "../core/http.js";

const kankaCache = new Map<string, {
    at: number;
    status: number;
    contentType: string | null;
    data: Uint8Array;
    headers: Record<string, string>;
}>();

const KANKA_API_BASE = "https://api.kanka.io/1.0";

export async function handleKanka(req: Request, pathname: string, search: string): Promise<Response | null> {
    if (!pathname.startsWith("/kanka/")) {
        return null;
    }

    if (req.method !== "GET") {
        return responseText("Method not allowed", 405);
    }

    const apiKey = Bun.env.KANKA_API_KEY;
    if (!apiKey) {
        return responseText("Kanka integration is disabled", 503);
    }

    const cacheDelaySeconds = Number.parseInt(Bun.env.KANKA_CACHE_DELAY ?? "60", 10);
    const cacheDelay = Number.isFinite(cacheDelaySeconds) ? cacheDelaySeconds : 60;

    const upstreamPath = pathname.replace("/kanka", "") + search;
    const upstreamUrl = `${KANKA_API_BASE}${upstreamPath}`;

    const cached = kankaCache.get(upstreamUrl);
    const now = Date.now();
    if (cached && now - cached.at < cacheDelay * 1000) {
        return new Response(cached.data, {
            status: cached.status,
            headers: {
                "content-type": cached.contentType ?? "application/json",
                "X-Cache-Hit": "true",
                "X-Cache-Delay": String(cacheDelay),
                ...cached.headers,
            },
        });
    }

    const upstream = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
        },
    });

    const buffer = new Uint8Array(await upstream.arrayBuffer());
    const xHeaders: Record<string, string> = {};
    for (const [key, value] of upstream.headers.entries()) {
        if (key.toLowerCase().startsWith("x-")) {
            xHeaders[key] = value;
        }
    }

    if (upstream.ok) {
        kankaCache.set(upstreamUrl, {
            at: now,
            status: upstream.status,
            contentType: upstream.headers.get("content-type"),
            data: buffer,
            headers: xHeaders,
        });
    } else {
        kankaCache.delete(upstreamUrl);
    }

    return new Response(buffer, {
        status: upstream.status,
        headers: {
            "content-type": upstream.headers.get("content-type") ?? "application/json",
            "X-Cache-Hit": "false",
            "X-Cache-Delay": String(cacheDelay),
            ...xHeaders,
        },
    });
}
