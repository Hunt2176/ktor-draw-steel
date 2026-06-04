import type { Context, Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import type { Campaign, CampaignDetails, EntityType } from '@draw-steel/shared';
import { db } from '../db/client.js';
import { campaigns, characters, combats, displayEntry, type CampaignRow } from '../db/schema.js';
import { toCampaignDTO, toCharacterDTO, toCombatDTO, toDisplayEntryDTO } from '../mapper.js';
import { BaseRepository, parseId } from './base-repository.js';
import { pickInt, pickNullableString, pickString } from './field-mappers.js';

/**
 * Campaigns. Unlike the other repositories, the list/detail endpoints return a
 * `CampaignDetails` aggregate (campaign + its characters + display entries),
 * matching the original `getCampaignDetails`.
 */
export class CampaignRepository extends BaseRepository<CampaignRow, Campaign> {
  protected readonly table = campaigns;
  protected readonly idColumn = campaigns.id;
  readonly routeName = 'campaigns';
  protected readonly entityType: EntityType = 'ExposedCampaign';

  toDTO(row: CampaignRow): Campaign {
    return toCampaignDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    pickString(json, 'name', out);
    pickNullableString(json, 'background', out);
    pickInt(json, 'heroTokens', out);
    pickInt(json, 'kankaApiId', out);
    return out;
  }

  protected resolveCampaignId(row: CampaignRow): number {
    return row.id;
  }

  /** campaign + characters + entries aggregate, for one or all campaigns. */
  private getCampaignDetails(ids: number[] | null): CampaignDetails[] {
    const campaignRows =
      ids == null
        ? db.select().from(campaigns).all()
        : db.select().from(campaigns).where(inArray(campaigns.id, ids)).all();

    const campaignIds = campaignRows.map((c) => c.id);
    const characterRows =
      campaignIds.length > 0
        ? db.select().from(characters).where(inArray(characters.campaign, campaignIds)).all()
        : [];
    const entryRows =
      campaignIds.length > 0
        ? db.select().from(displayEntry).where(inArray(displayEntry.campaign, campaignIds)).all()
        : [];

    const characterDTOs = characterRows.map(toCharacterDTO);
    const entryDTOs = entryRows.map(toDisplayEntryDTO);

    return campaignRows.map((row) => ({
      campaign: toCampaignDTO(row),
      characters: characterDTOs,
      entries: entryDTOs,
    }));
  }

  protected override handleGetAll(c: Context): Response {
    return c.json(this.getCampaignDetails(null));
  }

  protected override handleGetById(c: Context): Response {
    const id = parseId(c);
    if (id == null) return c.text('Invalid ID', 400);
    const details = this.getCampaignDetails([id]);
    if (details.length === 0) return c.text('Campaign not found', 404);
    return c.json(details[0]);
  }

  protected override additionalRoutes(router: Hono, base: string): void {
    this.registerValueModification(router, base, 'heroTokens', 'heroTokens');

    router.get(`${base}/:id/combats`, (c) => {
      const id = parseId(c);
      if (id == null) return c.text('Invalid ID', 400);
      if (!this.fetchById(id)) return c.text('Campaign not found', 404);
      const rows = db.select().from(combats).where(eq(combats.campaign, id)).all();
      return c.json(rows.map(toCombatDTO));
    });

    router.get(`${base}/:id/characters`, (c) => {
      const id = parseId(c);
      if (id == null) return c.text('Invalid ID', 400);
      if (!this.fetchById(id)) return c.text('Campaign not found', 404);
      const rows = db.select().from(characters).where(eq(characters.campaign, id)).all();
      return c.json(rows.map(toCharacterDTO));
    });
  }
}
