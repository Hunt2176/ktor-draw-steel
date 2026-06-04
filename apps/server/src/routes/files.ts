import type { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import { config } from '../config.js';

/**
 * File listing / upload / static serving at `/files`, matching the original
 * Ktor handlers (uploads are stored as `<uuid>.<ext>`).
 */
export function registerFiles(app: Hono): void {
  mkdirSync(config.filesDir, { recursive: true });

  app.get('/files', (c) => {
    let files: string[] = [];
    try {
      files = readdirSync(config.filesDir);
    } catch {
      files = [];
    }
    return c.json({ files });
  });

  app.post('/files', async (c) => {
    const body = await c.req.parseBody();
    const file = body['file'];
    if (!(file instanceof File)) {
      return c.body(null, 500);
    }

    const guid = randomUUID();
    const ext = path.extname(file.name).replace(/^\./, '');
    const fileName = ext.length > 0 ? `${guid}.${ext}` : guid;

    const bytes = Buffer.from(await file.arrayBuffer());
    writeFileSync(path.join(config.filesDir, fileName), bytes);

    return c.json({ fileName });
  });

  // Serve uploaded files. Root is relative to cwd for @hono/node-server.
  const relativeFilesRoot = path.relative(process.cwd(), config.filesDir) || '.';
  app.use(
    '/files/*',
    serveStatic({
      root: relativeFilesRoot,
      rewriteRequestPath: (p) => p.replace(/^\/files/, ''),
    }),
  );
}
