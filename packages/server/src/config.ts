import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Directory of this module at runtime (packages/server/dist), so paths resolve
// the same way regardless of the process working directory.
const moduleDir = dirname(fileURLToPath(import.meta.url));

/**
 * Runtime configuration. Mirrors the original Ktor application-base.yaml plus
 * the Kanka block; everything is overridable via environment variables.
 */
export const config = {
  /** HTTP port — the original served on 8080. */
  port: Number(process.env.PORT ?? 8080),

  /** SQLite database file (created on first run). */
  databaseUrl: process.env.DATABASE_URL ?? resolve(process.cwd(), 'draw_steel.sqlite'),

  /** Directory uploaded files are written to and served from at /files. */
  filesDir: resolve(process.cwd(), process.env.FILES_DIR ?? 'files'),

  /** Directory of the built Angular SPA, served at /. Resolved relative to this
   * module (packages/server/dist) so it works from any working directory. */
  staticDir: process.env.STATIC_DIR
    ? resolve(process.cwd(), process.env.STATIC_DIR)
    : resolve(moduleDir, '../../web/dist/web/browser'),

  kanka: {
    /** Bearer token; when absent the /kanka proxy returns 503 (disabled). */
    apiKey: process.env.KANKA_API_KEY ?? null,
    /** Cache TTL in seconds for proxied Kanka responses. */
    cacheDelay: Number(process.env.KANKA_CACHE_DELAY ?? 60),
  },
} as const;

export const KANKA_API_BASE = 'https://api.kanka.io/1.0';
