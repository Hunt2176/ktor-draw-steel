import { Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { campaigns, displayEntry } from '../db/schema.js';
import {
  toCampaignDTO,
  toCharacterDTO,
  toCombatDTO,
  toDisplayEntryDTO,
  type CharacterWithRelations,
  type CombatWithRelations,
} from '../lib/dto.js';
import { notFound, parseId } from '../lib/errors.js';
import { emit } from '../lib/socket.js';
import {
  EntityType,
  ChangeType,
  ValueModificationRequestSchema,
  type CampaignDetails,
} from '@draw-steel/shared';

/** `/api/campaigns` */
export const campaignsRoutes = new Hono();

type CampaignBody = {
  name?: string;
  background?: string | null;
  heroTokens?: number;
  kankaApiId?: number | null;
};

/**
 * Reproduces the original `getCampaignDetails`: when `ids` is null every campaign
 * is returned, each paired with the *global* character/entry lists; when ids are
 * given the lists are scoped to those campaigns.
 */
function getCampaignDetails(ids: number[] | null): CampaignDetails[] {
  const campaignRows =
    ids === null
      ? db.select().from(campaigns).all()
      : db.select().from(campaigns).where(inArray(campaigns.id, ids)).all();

  const campaignIds = campaignRows.map((c) => c.id);
  if (campaignIds.length === 0) return [];

  const characterRows = db.query.characters
    .findMany({
      where: (ch, { inArray: within }) => within(ch.campaign, campaignIds),
      with: { conditions: true, inventory: true },
    })
    .sync() as unknown as CharacterWithRelations[];

  const entryRows = db
    .select()
    .from(displayEntry)
    .where(inArray(displayEntry.campaign, campaignIds))
    .all();

  // Group DTOs by their owning campaign id. We key off each raw row's
  // `campaign` FK (guaranteed present on the DB row) zipped with its mapped
  // DTO, rather than trusting a campaign field on the DTO shape.
  const charactersByCampaign = new Map<number, ReturnType<typeof toCharacterDTO>[]>();
  for (const row of characterRows) {
    const list = charactersByCampaign.get(row.campaign);
    if (list) list.push(toCharacterDTO(row));
    else charactersByCampaign.set(row.campaign, [toCharacterDTO(row)]);
  }

  const entriesByCampaign = new Map<number, ReturnType<typeof toDisplayEntryDTO>[]>();
  for (const row of entryRows) {
    const list = entriesByCampaign.get(row.campaign);
    if (list) list.push(toDisplayEntryDTO(row));
    else entriesByCampaign.set(row.campaign, [toDisplayEntryDTO(row)]);
  }

  return campaignRows.map((c) => ({
    campaign: toCampaignDTO(c),
    characters: charactersByCampaign.get(c.id) ?? [],
    entries: entriesByCampaign.get(c.id) ?? [],
  }));
}

campaignsRoutes.get('/', (c) => {
  return c.json(getCampaignDetails(null));
});

campaignsRoutes.get('/:id/combats', (c) => {
  const id = parseId(c.req.param('id'));
  const campaign = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  if (!campaign) throw notFound('Campaign not found');
  const rows = db.query.combats
    .findMany({
      where: (t, { eq: equal }) => equal(t.campaign, id),
      with: {
        combatants: {
          with: { character: { with: { conditions: true, inventory: true } } },
        },
      },
    })
    .sync() as unknown as CombatWithRelations[];
  return c.json(rows.map(toCombatDTO));
});

campaignsRoutes.get('/:id/characters', (c) => {
  const id = parseId(c.req.param('id'));
  const campaign = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  if (!campaign) throw notFound('Campaign not found');
  const rows = db.query.characters
    .findMany({
      where: (t, { eq: equal }) => equal(t.campaign, id),
      with: { conditions: true, inventory: true },
    })
    .sync() as unknown as CharacterWithRelations[];
  return c.json(rows.map(toCharacterDTO));
});

campaignsRoutes.get('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const details = getCampaignDetails([id]);
  if (details.length === 0) throw notFound('Campaign not found');
  return c.json(details[0]);
});

campaignsRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as CampaignBody;
  const row = db
    .insert(campaigns)
    .values({
      name: body.name ?? '',
      background: body.background ?? null,
      heroTokens: body.heroTokens ?? 0,
      kankaApiId: body.kankaApiId ?? null,
    })
    .returning()
    .get();
  emit(row.id, ChangeType.CREATED, EntityType.CAMPAIGN, row.id, toCampaignDTO(row));
  return c.json(toCampaignDTO(row), 201);
});

campaignsRoutes.patch('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = (await c.req.json()) as CampaignBody;
  const update: Partial<typeof campaigns.$inferInsert> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.background !== undefined) update.background = body.background;
  if (body.heroTokens !== undefined) update.heroTokens = body.heroTokens;
  if (body.kankaApiId !== undefined) update.kankaApiId = body.kankaApiId;
  const row = db
    .update(campaigns)
    .set(update)
    .where(eq(campaigns.id, id))
    .returning()
    .get();
  if (!row) throw notFound();
  emit(row.id, ChangeType.UPDATED, EntityType.CAMPAIGN, row.id, toCampaignDTO(row));
  return c.json(toCampaignDTO(row));
});

campaignsRoutes.patch('/:id/modify/heroTokens', async (c) => {
  const id = parseId(c.req.param('id'));
  const req = ValueModificationRequestSchema.parse(await c.req.json());
  const existing = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  if (!existing) throw notFound('Entity not found');
  const delta = req.type === 'INCREASE' ? req.modifyBy : -req.modifyBy;
  const heroTokens = Math.max(0, existing.heroTokens + delta);
  const row = db
    .update(campaigns)
    .set({ heroTokens })
    .where(eq(campaigns.id, id))
    .returning()
    .get();
  emit(row.id, ChangeType.UPDATED, EntityType.CAMPAIGN, row.id, toCampaignDTO(row));
  return c.json(toCampaignDTO(row));
});

campaignsRoutes.delete('/:id', (c) => {
  const id = parseId(c.req.param('id'));
  const row = db.delete(campaigns).where(eq(campaigns.id, id)).returning().get();
  if (!row) throw notFound();
  emit(row.id, ChangeType.REMOVED, EntityType.CAMPAIGN, id, null);
  return c.json({ message: 'Entity deleted' });
});
