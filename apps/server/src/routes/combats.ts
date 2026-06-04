import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  characterConditions,
  characters,
  combatants,
  combats,
} from '../db/schema.js';
import { toCombatDTO, type CombatWithRelations } from '../lib/dto.js';
import { fail, notFound, parseId } from '../lib/errors.js';
import { emit } from '../lib/socket.js';
import { getCombatWithRelations } from '../lib/queries.js';
import { pickCharacterFields } from './characters.js';
import {
  EntityType,
  ChangeType,
  CreateCombatRequestSchema,
  NextRoundRequestSchema,
  CombatantRequestSchema,
  CombatantModificationRequestSchema,
  CombatantQuickAddRequestSchema,
} from '@draw-steel/shared';

/** `/api/combats` */
export const combatsRoutes = new Hono();

function combatDto(id: number): CombatWithRelations {
  const row = getCombatWithRelations(id);
  if (!row) throw fail('Combat not found');
  return row;
}

function emitCombat(
  row: CombatWithRelations,
  changeType: (typeof ChangeType)[keyof typeof ChangeType],
) {
  emit(row.campaign, changeType, EntityType.COMBAT, row.id, toCombatDTO(row));
}

function requireCharacterInCampaign(charId: number, campaign: number) {
  const char = db
    .select()
    .from(characters)
    .where(and(eq(characters.id, charId), eq(characters.campaign, campaign)))
    .get();
  if (!char) {
    throw fail(`Character ${charId} belonging to ${campaign} not found`);
  }
  return char;
}

/* ----------------------------------------------------------- custom routes */

combatsRoutes.post('/create', async (c) => {
  const body = CreateCombatRequestSchema.parse(await c.req.json());
  const campaign = body.campaign;
  // validate characters belong to the campaign before creating anything
  for (const charId of new Set(body.characters)) {
    requireCharacterInCampaign(charId, campaign);
  }
  const combat = db.insert(combats).values({ campaign }).returning().get();
  for (const charId of new Set(body.characters)) {
    db.insert(combatants)
      .values({ combat: combat.id, character: charId })
      .run();
  }
  const row = combatDto(combat.id);
  emitCombat(row, ChangeType.CREATED);
  return c.json(toCombatDTO(row), 201);
});

combatsRoutes.patch('/:id/nextRound', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = NextRoundRequestSchema.parse(await c.req.json());

  db.transaction((tx) => {
    const combat = tx.select().from(combats).where(eq(combats.id, id)).get();
    if (!combat) throw fail('Combat not found');
    if (combat.round !== body.fromRound) throw fail('Combat round has changed');

    tx.update(combats)
      .set({ round: combat.round + 1 })
      .where(eq(combats.id, id))
      .run();

    if (body.reset) {
      tx.update(combatants)
        .set({ available: true })
        .where(eq(combatants.combat, id))
        .run();
    }

    if (body.updateConditions) {
      const members = tx
        .select({ character: combatants.character })
        .from(combatants)
        .where(eq(combatants.combat, id))
        .all();
      for (const m of members) {
        tx.delete(characterConditions)
          .where(
            and(
              eq(characterConditions.character, m.character),
              eq(characterConditions.endType, 'endOfTurn'),
            ),
          )
          .run();
      }
    }
  });

  const row = combatDto(id);
  emitCombat(row, ChangeType.UPDATED);
  return c.json(toCombatDTO(row));
});

combatsRoutes.patch('/:id/add', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = CombatantRequestSchema.parse(await c.req.json());
  const combat = db.select().from(combats).where(eq(combats.id, id)).get();
  if (!combat) throw fail('Combat not found');
  requireCharacterInCampaign(body.character, combat.campaign);
  db.insert(combatants)
    .values({ combat: id, character: body.character })
    .run();
  const row = combatDto(id);
  emitCombat(row, ChangeType.UPDATED);
  return c.json(toCombatDTO(row));
});

combatsRoutes.patch('/:id/remove', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = CombatantRequestSchema.parse(await c.req.json());
  const combat = db.select().from(combats).where(eq(combats.id, id)).get();
  if (!combat) throw fail('Combat not found');
  // Faithful to the original: matches the combatant by its own id.
  const combatant = db
    .select()
    .from(combatants)
    .where(and(eq(combatants.id, body.character), eq(combatants.combat, id)))
    .get();
  if (!combatant) {
    throw fail(`Combatant ${body.character} not found in ${id}`);
  }
  db.delete(combatants).where(eq(combatants.id, combatant.id)).run();
  const row = combatDto(id);
  emitCombat(row, ChangeType.UPDATED);
  return c.json(toCombatDTO(row));
});

combatsRoutes.patch('/:id/quickAdd', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = CombatantQuickAddRequestSchema.parse(await c.req.json());
  const combat = db.select().from(combats).where(eq(combats.id, id)).get();
  if (!combat) throw fail('Combat not found');

  const fields = pickCharacterFields(body.character);
  const character = db
    .insert(characters)
    .values({
      name: '',
      ...fields,
      campaign: combat.campaign,
      user: fields.user as number,
    })
    .returning()
    .get();
  db.insert(combatants)
    .values({ combat: id, character: character.id })
    .run();

  const row = combatDto(id);
  emitCombat(row, ChangeType.UPDATED);
  return c.json(toCombatDTO(row));
});

combatsRoutes.patch('/:id/modify', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = CombatantModificationRequestSchema.parse(await c.req.json());
  const combat = db.select().from(combats).where(eq(combats.id, id)).get();
  if (!combat) throw fail('Combat not found');

  for (const charId of body.add ?? []) {
    requireCharacterInCampaign(charId, combat.campaign);
    db.insert(combatants).values({ combat: id, character: charId }).run();
  }
  for (const charId of body.remove ?? []) {
    const combatant = db
      .select()
      .from(combatants)
      .where(and(eq(combatants.character, charId), eq(combatants.combat, id)))
      .get();
    if (!combatant) throw fail(`Combatant ${charId} not found in ${id}`);
    db.delete(combatants).where(eq(combatants.id, combatant.id)).run();
  }

  const row = combatDto(id);
  emitCombat(row, ChangeType.UPDATED);
  return c.json(toCombatDTO(row));
});

/* --------------------------------------------------------- generic routes */

combatsRoutes.get('/', (c) => {
  const rows = db.query.combats
    .findMany({
      with: {
        combatants: {
          with: { character: { with: { conditions: true, inventory: true } } },
        },
      },
    })
    .sync() as unknown as CombatWithRelations[];
  return c.json(rows.map(toCombatDTO));
});

combatsRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  return c.json(toCombatDTO(combatDto(id)));
});

combatsRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as { round?: number; campaign?: number };
  const combat = db
    .insert(combats)
    .values({
      campaign: body.campaign as number,
      ...(body.round !== undefined ? { round: body.round } : {}),
    })
    .returning()
    .get();
  const row = combatDto(combat.id);
  emitCombat(row, ChangeType.CREATED);
  return c.json(toCombatDTO(row), 201);
});

combatsRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as { round?: number; campaign?: number };
  const update: Partial<typeof combats.$inferInsert> = {};
  if (body.round !== undefined) update.round = body.round;
  if (body.campaign !== undefined) update.campaign = body.campaign;
  const existing = db.select().from(combats).where(eq(combats.id, id)).get();
  if (!existing) throw notFound();
  db.update(combats).set(update).where(eq(combats.id, id)).run();
  const row = combatDto(id);
  emitCombat(row, ChangeType.UPDATED);
  return c.json(toCombatDTO(row));
});

combatsRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = getCombatWithRelations(id);
  if (!row) throw notFound();
  db.delete(combats).where(eq(combats.id, id)).run();
  emit(row.campaign, ChangeType.REMOVED, EntityType.COMBAT, id, null);
  return c.json({ message: 'Entity deleted' });
});
