import type { Hono } from 'hono';
import { KANKA_API_BASE, config } from '../config.js';

interface CacheEntry {
  date: number;
  data: Uint8Array;
  contentType: string;
}

const cache = new Map<string, CacheEntry>();

/**
 * Caching proxy for the Kanka worldbuilding API. Mirrors the original
 * `setupKankaRouting`: bearer-authenticated pass-through with an in-memory TTL
 * cache, returning 503 when no API key is configured.
 */
export function registerKankaRoutes(app: Hono): void {
  app.get('/kanka/*', async (c) => {
    const apiKey = config.kanka.apiKey;
    if (!apiKey) {
      return c.text('Kanka integration is disabled', 503);
    }

    const cacheDelay = config.kanka.cacheDelay;
    const url = new URL(c.req.url);
    const path = url.pathname.replace(/^\/kanka/, '') + url.search;
    const apiPath = `${KANKA_API_BASE}${path}`;

    c.header('X-Cache-Delay', String(cacheDelay));

    const cached = cache.get(apiPath);
    const fresh = cached != null && cached.date + cacheDelay * 1000 >= Date.now();
    if (fresh && cached) {
      c.header('X-Cache-Hit', 'true');
      c.header('X-Cache-Date', new Date(cached.date).toISOString());
      return c.body(cached.data, 200, { 'Content-Type': cached.contentType });
    }

    const apiResponse = await fetch(apiPath, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const bytes = new Uint8Array(await apiResponse.arrayBuffer());
    const contentType = apiResponse.headers.get('content-type') ?? 'application/json';

    if (apiResponse.ok) {
      cache.set(apiPath, { date: Date.now(), data: bytes, contentType });
    } else {
      cache.delete(apiPath);
    }

    c.header('X-Cache-Hit', 'false');
    for (const [key, value] of apiResponse.headers) {
      if (key.toLowerCase().startsWith('x-')) c.header(key, value);
    }

    return c.body(bytes, apiResponse.status as 200, { 'Content-Type': contentType });
  });
}
