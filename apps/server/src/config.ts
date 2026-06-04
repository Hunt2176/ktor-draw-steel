import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runtime configuration. The original read these from `application.yaml`
 * (kanka.api_key / kanka.cache_delay) and the Ktor deployment port; here they
 * come from environment variables.
 */
export const config = {
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? 'draw_steel.sqlite',
  /** Directory uploaded files are written to and served from at `/files`. */
  filesDir: process.env.FILES_DIR ?? path.resolve(process.cwd(), 'files'),
  /** Built Angular app (served as the SPA at `/`). */
  staticAppDir:
    process.env.STATIC_APP_DIR ??
    path.resolve(__dirname, '../../web/dist/web/browser'),
  /** Extra static assets, served at `/static`. */
  staticDir: process.env.STATIC_DIR ?? path.resolve(__dirname, '../static'),
  kanka: {
    apiKey: process.env.KANKA_API_KEY ?? null,
    cacheDelaySeconds: Number(process.env.KANKA_CACHE_DELAY ?? 60),
  },
} as const;
