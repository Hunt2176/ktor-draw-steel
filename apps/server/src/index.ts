import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createNodeWebSocket } from '@hono/node-ws';
import { compress } from 'hono/compress';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ZodError } from 'zod';

import { config } from './config.js';
import { db, initDatabase } from './db/index.js';
import { campaigns } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { HttpError } from './lib/errors.js';
import { socketService } from './lib/socket.js';

import { campaignsRoutes } from './routes/campaigns.js';
import { charactersRoutes } from './routes/characters.js';
import { combatsRoutes } from './routes/combats.js';
import { combatantsRoutes } from './routes/combatants.js';
import { inventoryRoutes } from './routes/inventory.js';
import { usersRoutes } from './routes/users.js';
import { characterConditionsRoutes } from './routes/character-conditions.js';
import { displayEntryRoutes } from './routes/display-entry.js';
import { registerKanka } from './routes/kanka.js';
import { registerFiles } from './routes/files.js';

initDatabase();

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use('*', compress());
app.use('*', async (c, next) => {
  c.header('X-Engine', 'Hono');
  await next();
});

/* ---------------------------------------------------------------- REST API */
const api = new Hono();
api.route('/campaigns', campaignsRoutes);
api.route('/characters', charactersRoutes);
api.route('/combats', combatsRoutes);
api.route('/combatants', combatantsRoutes);
api.route('/inventoryItem', inventoryRoutes);
api.route('/users', usersRoutes);
api.route('/characterConditions', characterConditionsRoutes);
api.route('/displayEntry', displayEntryRoutes);
app.route('/api', api);

/* ------------------------------------------------------- WebSocket: /watch */
app.get(
  '/watch/:id',
  upgradeWebSocket((c) => {
    const id = Number.parseInt(c.req.param('id') ?? '', 10);
    let campaignId: number | null = null;
    return {
      onOpen: (_event, ws) => {
        if (Number.isNaN(id)) {
          ws.close(1003, 'The id of the entity is invalid');
          return;
        }
        const campaign = db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, id))
          .get();
        if (!campaign) {
          ws.close(1008, `Campaign ${id} not found.`);
          return;
        }
        campaignId = id;
        socketService.add(campaignId, ws);
      },
      onClose: (_event, ws) => {
        if (campaignId != null) {
          socketService.remove(campaignId, ws);
        }
      },
    };
  }),
);

/* ------------------------------------------------------- Kanka + file APIs */
registerKanka(app);
registerFiles(app);

/* ---------------------------------------------------------- static content */
const staticRel = path.relative(process.cwd(), config.staticDir) || '.';
app.use(
  '/static/*',
  serveStatic({
    root: staticRel,
    rewriteRequestPath: (p) => p.replace(/^\/static/, ''),
  }),
);

/* ------------------------------------------ single-page application (web) */
const webRel = path.relative(process.cwd(), config.staticAppDir) || '.';
app.use('/*', serveStatic({ root: webRel }));
app.get('*', (c) => {
  const indexPath = path.join(config.staticAppDir, 'index.html');
  if (existsSync(indexPath)) {
    return c.html(readFileSync(indexPath, 'utf8'));
  }
  return c.text(
    'Frontend not built yet. Run `pnpm --filter @draw-steel/web build`.',
    200,
  );
});

/* ----------------------------------------------------------- error mapping */
app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status);
  }
  if (err instanceof ZodError) {
    return c.json({ error: err.message }, 400);
  }
  return c.json({ error: `500: ${err}` }, 500);
});

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`Draw Steel server responding at http://0.0.0.0:${info.port}`);
});
injectWebSocket(server);
