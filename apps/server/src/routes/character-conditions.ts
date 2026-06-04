import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { characterConditions } from '../db/schema.js';
import { toCharacterConditionDTO } from '../lib/dto.js';
import { notFound, parseId } from '../lib/errors.js';
import { emit } from '../lib/socket.js';
import { campaignIdForCharacter } from '../lib/queries.js';
import { EntityType, ChangeType } from '@draw-steel/shared';

/** `/api/characterConditions` */
export const characterConditionsRoutes = new Hono();

type ConditionBody = {
  name?: string;
  character?: number;
  endType?: 'endOfTurn' | 'save';
};

function notify(
  characterId: number,
  changeType: (typeof ChangeType)[keyof typeof ChangeType],
  row: typeof characterConditions.$inferSelect,
): void {
  const campaignId = campaignIdForCharacter(characterId);
  if (campaignId != null) {
    emit(
      campaignId,
      changeType,
      EntityType.CHARACTER_CONDITION,
      row.id,
      toCharacterConditionDTO(row),
    );
  }
}

characterConditionsRoutes.get('/', (c) => {
  const rows = db.select().from(characterConditions).all();
  return c.json(rows.map(toCharacterConditionDTO));
});

characterConditionsRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db
    .select()
    .from(characterConditions)
    .where(eq(characterConditions.id, id))
    .get();
  if (!row) throw notFound();
  return c.json(toCharacterConditionDTO(row));
});

characterConditionsRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as ConditionBody;
  const row = db
    .insert(characterConditions)
    .values({
      name: body.name ?? '',
      character: body.character as number,
      endType: body.endType ?? 'save',
    })
    .returning()
    .get();
  notify(row.character, ChangeType.CREATED, row);
  return c.json(toCharacterConditionDTO(row), 201);
});

characterConditionsRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as ConditionBody;
  const update: Partial<typeof characterConditions.$inferInsert> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.endType !== undefined) update.endType = body.endType;
  if (body.character !== undefined) update.character = body.character;
  const row = db
    .update(characterConditions)
    .set(update)
    .where(eq(characterConditions.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  notify(row.character, ChangeType.UPDATED, row);
  return c.json(toCharacterConditionDTO(row));
});

characterConditionsRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db
    .delete(characterConditions)
    .where(eq(characterConditions.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  notify(row.character, ChangeType.REMOVED, row);
  return c.json({ message: 'Entity deleted' });
});
