import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Hono } from 'hono';
import { config } from '../config.js';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/**
 * File listing, multipart upload, and static serving of uploaded files. Mirrors
 * the original Ktor `setupFileHandling` + `staticFiles("/files", …)`.
 */
export function registerFileRoutes(app: Hono): void {
  app.get('/files', async (c) => {
    if (!existsSync(config.filesDir)) return c.json({ files: [] });
    const files = await readdir(config.filesDir);
    return c.json({ files });
  });

  app.post('/files', async (c) => {
    const body = await c.req.parseBody();
    const file = body['file'];
    if (!(file instanceof File)) return c.body(null, 500);

    const guid = randomUUID();
    const ext = extname(file.name).replace(/^\./, '');
    const fileName = ext ? `${guid}.${ext}` : guid;

    await mkdir(config.filesDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(config.filesDir, fileName), buffer);

    return c.json({ fileName });
  });

  // Static serving of an individual uploaded file.
  app.get('/files/:name', async (c) => {
    const name = c.req.param('name');
    // Guard against path traversal.
    if (name.includes('/') || name.includes('..')) return c.notFound();
    const path = join(config.filesDir, name);
    if (!existsSync(path)) return c.notFound();
    const buffer = await readFile(path);
    const type = CONTENT_TYPES[extname(name).toLowerCase()] ?? 'application/octet-stream';
    return c.body(buffer, 200, { 'Content-Type': type });
  });
}
