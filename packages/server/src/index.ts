import { relative } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createNodeWebSocket } from '@hono/node-ws';
import { config } from './config.js';
import { ensureSchema } from './db/client.js';
import { createBaseApp } from './app.js';
import { socketService } from './services/socket-service.js';

ensureSchema();

const app = createBaseApp();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// Campaign live-update socket: /watch/{campaignId}
app.get(
  '/watch/:id',
  upgradeWebSocket((c) => {
    const id = Number.parseInt(c.req.param('id') ?? '', 10);
    let registered = false;
    return {
      onOpen(_event, ws) {
        if (Number.isNaN(id)) {
          ws.close(1003, 'The id of the entity is invalid');
          return;
        }
        registered = socketService.addConnection(id, ws);
        if (!registered) {
          ws.close(1008, `Campaign ${id} not found.`);
        }
      },
      onClose(_event, ws) {
        if (registered) socketService.removeConnection(id, ws);
      },
    };
  }),
);

// Static SPA (built Angular app), served at / with a client-routing fallback.
const staticRoot = relative(process.cwd(), config.staticDir) || '.';
app.use('/*', serveStatic({ root: staticRoot }));
app.get('*', serveStatic({ path: `${staticRoot}/index.html` }));

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Responding at http://0.0.0.0:${info.port}`);
});
injectWebSocket(server);
