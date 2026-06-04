import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { combatants } from '../db/schema.js';
import { toCombatantDTO, type CombatantWithRelations } from '../lib/dto.js';
import { notFound, parseId } from '../lib/errors.js';
import { emit } from '../lib/socket.js';
import { campaignIdForCombat } from '../lib/queries.js';
import {
  EntityType,
  ChangeType,
  CombatantValueModificationRequestSchema,
} from '@draw-steel/shared';

/** `/api/combatants` */
export const combatantsRoutes = new Hono();

function getCombatant(id: number): CombatantWithRelations | undefined {
  return db.query.combatants
    .findFirst({
      where: (t, { eq: equal }) => equal(t.id, id),
      with: { character: { with: { conditions: true, inventory: true } } },
    })
    .sync() as unknown as CombatantWithRelations | undefined;
}

function emitCombatant(
  row: CombatantWithRelations,
  changeType: (typeof ChangeType)[keyof typeof ChangeType],
) {
  const campaignId = campaignIdForCombat(row.combat);
  if (campaignId != null) {
    emit(
      campaignId,
      changeType,
      EntityType.COMBATANT,
      row.id,
      toCombatantDTO(row),
    );
  }
}

combatantsRoutes.get('/', (c) => {
  const rows = db.query.combatants
    .findMany({
      with: { character: { with: { conditions: true, inventory: true } } },
    })
    .sync() as unknown as CombatantWithRelations[];
  return c.json(rows.map(toCombatantDTO));
});

combatantsRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = getCombatant(id);
  if (!row) throw notFound();
  return c.json(toCombatantDTO(row));
});

type CombatantBody = {
  available?: boolean;
  surges?: number;
  resources?: number;
  combat?: number;
  character?: number;
};

combatantsRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as CombatantBody;
  const update: Partial<typeof combatants.$inferInsert> = {};
  if (body.available !== undefined) update.available = body.available;
  if (body.surges !== undefined) update.surges = body.surges;
  if (body.resources !== undefined) update.resources = body.resources;
  if (body.combat !== undefined) update.combat = body.combat;
  if (body.character !== undefined) update.character = body.character;

  const existing = db.select().from(combatants).where(eq(combatants.id, id)).get();
  if (!existing) throw notFound();
  db.update(combatants).set(update).where(eq(combatants.id, id)).run();

  const row = getCombatant(id)!;
  emitCombatant(row, ChangeType.UPDATED);
  return c.json(toCombatantDTO(row));
});

combatantsRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = getCombatant(id);
  if (!row) throw notFound();
  db.delete(combatants).where(eq(combatants.id, id)).run();
  emitCombatant(row, ChangeType.REMOVED);
  return c.json({ message: 'Entity deleted' });
});

function consumeModification(field: 'resources' | 'surges') {
  return async (c: import('hono').Context) => {
    const id = parseId(c.req.param('id'));
    const req = CombatantValueModificationRequestSchema.parse(await c.req.json());
    const modifyBy = req.type === 'INCREASE' ? req.value : -req.value;

    const existing = db
      .select()
      .from(combatants)
      .where(eq(combatants.id, id))
      .get();
    if (!existing) throw notFound('Combatant not found');

    const next = Math.max(0, existing[field] + modifyBy);
    db.update(combatants)
      .set({ [field]: next })
      .where(eq(combatants.id, id))
      .run();

    const row = getCombatant(id)!;
    emitCombatant(row, ChangeType.UPDATED);
    return c.json(toCombatantDTO(row));
  };
}

combatantsRoutes.patch('/:id/resources', consumeModification('resources'));
combatantsRoutes.patch('/:id/surges', consumeModification('surges'));
