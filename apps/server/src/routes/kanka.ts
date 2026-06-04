import type { Hono } from 'hono';
import { config } from '../config.js';

const KANKA_API_BASE = 'https://api.kanka.io/1.0';

interface CacheEntry {
  date: number; // epoch millis
  data: Buffer;
  contentType: string;
}

const cache = new Map<string, CacheEntry>();

/**
 * Mounts the caching Kanka proxy at `/kanka/*`, mirroring the original Ktor
 * implementation (bearer auth, per-path cache with a configurable delay, and
 * the X-Cache-* response headers).
 */
export function registerKanka(app: Hono): void {
  const { apiKey, cacheDelaySeconds } = config.kanka;

  app.get('/kanka/*', async (c) => {
    if (apiKey == null) {
      return c.text('Kanka integration is disabled', 503);
    }

    const path = new URL(c.req.url).pathname.replace(/^\/kanka/, '');
    const apiPath = `${KANKA_API_BASE}${path}`;

    c.header('X-Cache-Delay', String(cacheDelaySeconds));

    const cached = cache.get(apiPath);
    const fresh =
      cached != null &&
      cached.date + cacheDelaySeconds * 1000 >= Date.now();
    if (cached != null && fresh) {
      c.header('X-Cache-Hit', 'true');
      c.header('X-Cache-Date', new Date(cached.date).toISOString());
      return c.body(new Uint8Array(cached.data), 200, {
        'Content-Type': cached.contentType,
      });
    }

    const apiResponse = await fetch(apiPath, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const bytes = Buffer.from(await apiResponse.arrayBuffer());
    const contentType =
      apiResponse.headers.get('content-type') ?? 'application/json';

    if (apiResponse.ok) {
      cache.set(apiPath, { date: Date.now(), data: bytes, contentType });
    } else {
      cache.delete(apiPath);
    }

    c.header('X-Cache-Hit', 'false');
    apiResponse.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-')) {
        c.header(key, value);
      }
    });

    return c.body(new Uint8Array(bytes), apiResponse.status as 200, {
      'Content-Type': contentType,
    });
  });
}
