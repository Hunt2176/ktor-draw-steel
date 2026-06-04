import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { inventoryItem } from '../db/schema.js';
import { toInventoryItemDTO } from '../lib/dto.js';
import { notFound, parseId } from '../lib/errors.js';
import { emit } from '../lib/socket.js';
import { campaignIdForCharacter } from '../lib/queries.js';
import {
  EntityType,
  ChangeType,
  ValueModificationRequestSchema,
} from '@draw-steel/shared';

/** `/api/inventoryItem` */
export const inventoryRoutes = new Hono();

type InventoryBody = {
  name?: string;
  character?: number;
  quantity?: number;
};

function notify(
  row: typeof inventoryItem.$inferSelect,
  changeType: (typeof ChangeType)[keyof typeof ChangeType],
): void {
  const campaignId = campaignIdForCharacter(row.character);
  if (campaignId != null) {
    emit(
      campaignId,
      changeType,
      EntityType.INVENTORY_ITEM,
      row.id,
      toInventoryItemDTO(row),
    );
  }
}

inventoryRoutes.get('/', (c) => {
  const rows = db.select().from(inventoryItem).all();
  return c.json(rows.map(toInventoryItemDTO));
});

inventoryRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db.select().from(inventoryItem).where(eq(inventoryItem.id, id)).get();
  if (!row) throw notFound();
  return c.json(toInventoryItemDTO(row));
});

inventoryRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as InventoryBody;
  const row = db
    .insert(inventoryItem)
    .values({
      name: body.name ?? '',
      character: body.character as number,
      quantity: Math.max(0, body.quantity ?? 0),
    })
    .returning()
    .get();
  notify(row, ChangeType.CREATED);
  return c.json(toInventoryItemDTO(row), 201);
});

inventoryRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as InventoryBody;
  const update: Partial<typeof inventoryItem.$inferInsert> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.character !== undefined) update.character = body.character;
  if (body.quantity !== undefined) update.quantity = Math.max(0, body.quantity);
  const row = db
    .update(inventoryItem)
    .set(update)
    .where(eq(inventoryItem.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  notify(row, ChangeType.UPDATED);
  return c.json(toInventoryItemDTO(row));
});

// PATCH /:id/modify/quantity  — value modification (increase/decrease, clamped ≥ 0)
inventoryRoutes.patch('/:id/modify/quantity', async (c) => {
  const id = parseId(c.req.param('id'));
  const req = ValueModificationRequestSchema.parse(await c.req.json());
  const existing = db
    .select()
    .from(inventoryItem)
    .where(eq(inventoryItem.id, id))
    .get();
  if (!existing) throw notFound();

  const delta = req.type === 'INCREASE' ? req.modifyBy : -req.modifyBy;
  const quantity = Math.max(0, existing.quantity + delta);
  const row = db
    .update(inventoryItem)
    .set({ quantity })
    .where(eq(inventoryItem.id, id))
    .returning()
    .get();
  notify(row, ChangeType.UPDATED);
  return c.json(toInventoryItemDTO(row));
});

inventoryRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db
    .delete(inventoryItem)
    .where(eq(inventoryItem.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  notify(row, ChangeType.REMOVED);
  return c.json({ message: 'Entity deleted' });
});
