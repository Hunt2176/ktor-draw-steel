import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { toUserDTO } from '../lib/dto.js';
import { notFound, parseId } from '../lib/errors.js';

/** `/api/users` — plain CRUD (no campaign scope, so no socket events). */
export const usersRoutes = new Hono();

usersRoutes.get('/', (c) => {
  const rows = db.select().from(users).all();
  return c.json(rows.map(toUserDTO));
});

usersRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db.select().from(users).where(eq(users.id, id)).get();
  if (!row) throw notFound();
  return c.json(toUserDTO(row));
});

usersRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as { name?: string };
  const row = db
    .insert(users)
    .values({ name: body.name ?? '' })
    .returning()
    .get();
  return c.json(toUserDTO(row), 201);
});

usersRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as { name?: string };
  const update: Partial<typeof users.$inferInsert> = {};
  if (body.name !== undefined) update.name = body.name;
  const row = db
    .update(users)
    .set(update)
    .where(eq(users.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  return c.json(toUserDTO(row));
});

usersRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db.delete(users).where(eq(users.id, id)).returning().get();
  if (!row) throw notFound();
  return c.json({ message: 'Entity deleted' });
});
