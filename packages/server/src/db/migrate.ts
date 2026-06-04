import { ensureSchema, sqlite } from './client.js';

/**
 * Standalone schema bootstrap (`pnpm db:migrate`). Idempotent — safe to run
 * repeatedly; only creates tables/indexes that are missing.
 */
ensureSchema();
sqlite.close();
console.log('Schema ensured.');
