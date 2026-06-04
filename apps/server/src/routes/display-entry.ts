import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { displayEntry } from '../db/schema.js';
import { toDisplayEntryDTO } from '../lib/dto.js';
import { notFound, parseId } from '../lib/errors.js';
import { emit } from '../lib/socket.js';
import { EntityType, ChangeType } from '@draw-steel/shared';

/** `/api/displayEntry` */
export const displayEntryRoutes = new Hono();

type DisplayEntryBody = {
  title?: string;
  description?: string | null;
  pictureUrl?: string | null;
  type?: 'Portrait' | 'Background';
  campaign?: number;
};

function notify(
  row: typeof displayEntry.$inferSelect,
  changeType: (typeof ChangeType)[keyof typeof ChangeType],
): void {
  emit(
    row.campaign,
    changeType,
    EntityType.DISPLAY_ENTRY,
    row.id,
    toDisplayEntryDTO(row),
  );
}

displayEntryRoutes.get('/', (c) => {
  const rows = db.select().from(displayEntry).all();
  return c.json(rows.map(toDisplayEntryDTO));
});

displayEntryRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db.select().from(displayEntry).where(eq(displayEntry.id, id)).get();
  if (!row) throw notFound();
  return c.json(toDisplayEntryDTO(row));
});

displayEntryRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as DisplayEntryBody;
  const row = db
    .insert(displayEntry)
    .values({
      title: body.title ?? '',
      description: body.description ?? null,
      pictureUrl: body.pictureUrl ?? null,
      type: body.type ?? 'Portrait',
      campaign: body.campaign as number,
    })
    .returning()
    .get();
  notify(row, ChangeType.CREATED);
  return c.json(toDisplayEntryDTO(row), 201);
});

displayEntryRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as DisplayEntryBody;
  const update: Partial<typeof displayEntry.$inferInsert> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.pictureUrl !== undefined) update.pictureUrl = body.pictureUrl;
  if (body.type !== undefined) update.type = body.type;
  if (body.campaign !== undefined) update.campaign = body.campaign;
  const row = db
    .update(displayEntry)
    .set(update)
    .where(eq(displayEntry.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  notify(row, ChangeType.UPDATED);
  return c.json(toDisplayEntryDTO(row));
});

displayEntryRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db
    .delete(displayEntry)
    .where(eq(displayEntry.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  notify(row, ChangeType.REMOVED);
  return c.json({ message: 'Entity deleted' });
});
