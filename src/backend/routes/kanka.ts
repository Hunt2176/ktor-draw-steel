import { Hono } from "hono";
import { KANKA_API_BASE } from "../constants";
import type { AppConfig } from "../types";

const kankaCache = new Map<
    string,
    {
        date: number;
        status: number;
        contentType: string | null;
        xHeaders: Array<[string, string]>;
        data: Uint8Array;
    }
>();

export function registerKankaRoutes(app: Hono, config: AppConfig): void {
    app.get("/kanka/*", async (c) => {
        if (config.kankaApiKey == null) {
            return c.text("Kanka integration is disabled", 503);
        }

        const incoming = new URL(c.req.url);
        const requestedPath = incoming.pathname.replace(/^\/kanka/, "") + incoming.search;
        const upstreamUrl = `${KANKA_API_BASE}${requestedPath}`;

        c.header("X-Cache-Delay", String(config.kankaCacheDelaySec));

        const cacheEntry = kankaCache.get(upstreamUrl);
        const now = Date.now();
        const expiryMs = config.kankaCacheDelaySec * 1000;

        if (cacheEntry != null && cacheEntry.date + expiryMs >= now) {
            const headers = new Headers();
            headers.set("X-Cache-Hit", "true");
            headers.set("X-Cache-Date", new Date(cacheEntry.date).toISOString());
            headers.set("X-Cache-Delay", String(config.kankaCacheDelaySec));

            if (cacheEntry.contentType != null) {
                headers.set("Content-Type", cacheEntry.contentType);
            }

            for (const [key, value] of cacheEntry.xHeaders) {
                headers.append(key, value);
            }

            return new Response(cacheEntry.data.slice(0), {
                status: cacheEntry.status,
                headers,
            });
        }

        const upstreamResponse = await fetch(upstreamUrl, {
            headers: {
                Authorization: `Bearer ${config.kankaApiKey}`,
                "Content-Type": "application/json",
            },
        });

        const rawData = new Uint8Array(await upstreamResponse.arrayBuffer());
        const xHeaders: Array<[string, string]> = [];

        for (const [key, value] of upstreamResponse.headers.entries()) {
            if (key.toLowerCase().startsWith("x-")) {
                xHeaders.push([key, value]);
            }
        }

        if (upstreamResponse.ok) {
            kankaCache.set(upstreamUrl, {
                date: now,
                status: upstreamResponse.status,
                contentType: upstreamResponse.headers.get("content-type"),
                xHeaders,
                data: rawData,
            });
        } else {
            kankaCache.delete(upstreamUrl);
        }

        const headers = new Headers();
        headers.set("X-Cache-Hit", "false");
        headers.set("X-Cache-Delay", String(config.kankaCacheDelaySec));

        const contentType = upstreamResponse.headers.get("content-type");
        if (contentType != null) {
            headers.set("Content-Type", contentType);
        }

        for (const [key, value] of xHeaders) {
            headers.append(key, value);
        }

        return new Response(rawData, {
            status: upstreamResponse.status,
            headers,
        });
    });
}
