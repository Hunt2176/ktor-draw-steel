import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { characters } from '../db/schema.js';
import { toCharacterDTO } from '../lib/dto.js';
import { badRequest, fail, notFound, parseId } from '../lib/errors.js';
import { emit } from '../lib/socket.js';
import { getCharacterWithRelations } from '../lib/queries.js';
import {
  EntityType,
  ChangeType,
  CharacterHealthModifierSchema,
  CharacterRecoveriesModifierSchema,
} from '@draw-steel/shared';

/** `/api/characters` */
export const charactersRoutes = new Hono();

type CharacterBody = Record<string, unknown>;
type CharacterInsert = typeof characters.$inferInsert;

const NUMERIC_FIELDS = [
  'might',
  'agility',
  'reason',
  'intuition',
  'presence',
  'removedHp',
  'maxHp',
  'temporaryHp',
  'removedRecoveries',
  'maxRecoveries',
  'temporaryRecoveries',
  'minions',
  'victories',
  'campaign',
  'user',
] as const;

/** Translate a JSON body into a set of character columns (mirrors customizeFromJson). */
export function pickCharacterFields(body: CharacterBody): Partial<CharacterInsert> {
  const out: Partial<CharacterInsert> = {};
  if (typeof body['name'] === 'string') out.name = body['name'];
  for (const key of NUMERIC_FIELDS) {
    const v = body[key];
    if (typeof v === 'number' && !Number.isNaN(v)) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  if (typeof body['offstage'] === 'boolean') out.offstage = body['offstage'];
  if ('resourceName' in body) {
    const v = body['resourceName'];
    out.resourceName = typeof v === 'string' ? v : null;
  }
  if ('pictureUrl' in body) {
    const v = body['pictureUrl'];
    out.pictureUrl = typeof v === 'string' ? v : null;
  }
  if ('border' in body) {
    const v = body['border'];
    out.border = typeof v === 'string' ? v : null;
  }
  return out;
}

function emitCharacter(
  id: number,
  changeType: (typeof ChangeType)[keyof typeof ChangeType],
) {
  const row = getCharacterWithRelations(id);
  if (row) {
    emit(row.campaign, changeType, EntityType.CHARACTER, id, toCharacterDTO(row));
  }
}

function respondCharacter(id: number) {
  const row = getCharacterWithRelations(id);
  if (!row) throw notFound('Character not found');
  return toCharacterDTO(row);
}

charactersRoutes.get('/', (c) => {
  const rows = db.select().from(characters).all();
  return c.json(
    rows.map((r) =>
      toCharacterDTO({ ...r, conditions: [], inventory: [] }),
    ),
  );
});

charactersRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  return c.json(respondCharacter(id));
});

charactersRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as CharacterBody;
  const fields = pickCharacterFields(body);
  if (fields.campaign == null || fields.user == null) {
    throw badRequest('campaign and user are required');
  }
  const inserted = db
    .insert(characters)
    .values({ name: '', ...fields } as CharacterInsert)
    .returning()
    .get();
  emitCharacter(inserted.id, ChangeType.CREATED);
  return c.json(respondCharacter(inserted.id), 201);
});

charactersRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as CharacterBody;
  const fields = pickCharacterFields(body);
  const row = db
    .update(characters)
    .set(fields)
    .where(eq(characters.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  emitCharacter(id, ChangeType.UPDATED);
  return c.json(respondCharacter(id));
});

charactersRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const existing = db.select().from(characters).where(eq(characters.id, id)).get();
  if (!existing) throw notFound();
  db.delete(characters).where(eq(characters.id, id)).run();
  emit(existing.campaign, ChangeType.REMOVED, EntityType.CHARACTER, id, null);
  return c.json({ message: 'Entity deleted' });
});

// PATCH /:id/modify/health  — HP damage/heal with temporary-HP absorption.
charactersRoutes.patch('/:id/modify/health', async (c) => {
  const id = parseId(c.req.param('id'));
  const update = CharacterHealthModifierSchema.parse(await c.req.json());

  db.transaction((tx) => {
    const char = tx.select().from(characters).where(eq(characters.id, id)).get();
    if (!char) throw fail('Character not found');

    const removed = Math.max(char.removedHp, 0);

    if (update.type === 'HEAL') {
      const newRemoved = removed - update.mod;
      tx.update(characters)
        .set({ removedHp: Math.max(newRemoved, 0) })
        .where(eq(characters.id, id))
        .run();
      return;
    }

    // DAMAGE
    if (char.temporaryHp > 0) {
      const tempAfter = char.temporaryHp - update.mod;
      tx.update(characters)
        .set({ temporaryHp: Math.max(tempAfter, 0) })
        .where(eq(characters.id, id))
        .run();
      if (tempAfter >= 0) {
        return; // fully absorbed; removed HP unchanged
      }
      const newRemoved = removed + Math.max(-tempAfter, 0);
      tx.update(characters)
        .set({ removedHp: Math.max(newRemoved, 0) })
        .where(eq(characters.id, id))
        .run();
      return;
    }

    const newRemoved = removed + update.mod;
    tx.update(characters)
      .set({ removedHp: Math.max(newRemoved, 0) })
      .where(eq(characters.id, id))
      .run();
  });

  emitCharacter(id, ChangeType.UPDATED);
  return c.json(respondCharacter(id));
});

// PATCH /:id/modify/recoveries  — recoveries spend/restore with temp absorption.
charactersRoutes.patch('/:id/modify/recoveries', async (c) => {
  const id = parseId(c.req.param('id'));
  const update = CharacterRecoveriesModifierSchema.parse(await c.req.json());

  db.transaction((tx) => {
    const char = tx.select().from(characters).where(eq(characters.id, id)).get();
    if (!char) throw fail('Character not found');

    const removed = Math.max(char.removedRecoveries, 0);

    if (update.type === 'INCREASE') {
      const newRemoved = removed - update.mod;
      tx.update(characters)
        .set({ removedRecoveries: Math.max(newRemoved, 0) })
        .where(eq(characters.id, id))
        .run();
      return;
    }

    // DECREASE
    if (char.temporaryRecoveries > 0) {
      const tempAfter = char.temporaryRecoveries - update.mod;
      tx.update(characters)
        .set({ temporaryRecoveries: Math.max(tempAfter, 0) })
        .where(eq(characters.id, id))
        .run();
      if (tempAfter >= 0) {
        return;
      }
      const newRemoved = removed + Math.max(-tempAfter, 0);
      tx.update(characters)
        .set({ removedRecoveries: Math.max(newRemoved, 0) })
        .where(eq(characters.id, id))
        .run();
      return;
    }

    const newRemoved = removed + update.mod;
    tx.update(characters)
      .set({ removedRecoveries: Math.max(newRemoved, 0) })
      .where(eq(characters.id, id))
      .run();
  });

  emitCharacter(id, ChangeType.UPDATED);
  return c.json(respondCharacter(id));
});
