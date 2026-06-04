import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { CampaignRepository } from './repository/campaign-repository.js';
import { CharacterRepository } from './repository/character-repository.js';
import { CharacterConditionRepository } from './repository/character-condition-repository.js';
import { CombatRepository } from './repository/combat-repository.js';
import { CombatantRepository } from './repository/combatant-repository.js';
import { DisplayEntryRepository } from './repository/display-entry-repository.js';
import { InventoryItemRepository } from './repository/inventory-repository.js';
import { UserRepository } from './repository/user-repository.js';
import { registerFileRoutes } from './routes/files.js';
import { registerKankaRoutes } from './routes/kanka.js';

/**
 * Build the Hono app with all HTTP routes (everything except the WebSocket
 * endpoint and the static SPA fallback, which are wired up in index.ts where the
 * Node server is available).
 */
export function createBaseApp(): Hono {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', async (c, next) => {
    await next();
    c.header('X-Engine', 'Hono');
  });

  // Matches the original StatusPages: any uncaught error → "500: <cause>".
  app.onError((err, c) => c.text(`500: ${err instanceof Error ? err.message : String(err)}`, 500));

  // Generic CRUD + custom routes for every entity, mounted under /api.
  const api = new Hono();
  const repositories = [
    new CampaignRepository(),
    new CharacterRepository(),
    new CombatRepository(),
    new CombatantRepository(),
    new InventoryItemRepository(),
    new UserRepository(),
    new CharacterConditionRepository(),
    new DisplayEntryRepository(),
  ];
  for (const repository of repositories) {
    repository.registerRoutes(api);
  }
  app.route('/api', api);

  registerFileRoutes(app);
  registerKankaRoutes(app);

  return app;
}
