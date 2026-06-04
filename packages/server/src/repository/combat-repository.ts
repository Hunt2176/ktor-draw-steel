import type { Context, Hono } from 'hono';
import { and, eq, inArray } from 'drizzle-orm';
import {
  CombatantModificationRequestSchema,
  CombatantQuickAddRequestSchema,
  CombatantRequestSchema,
  CreateCombatRequestSchema,
  NextRoundRequestSchema,
  type Combat,
  type EntityType,
} from '@draw-steel/shared';
import { db } from '../db/client.js';
import {
  campaigns,
  characterConditions,
  characters,
  combatants,
  combats,
  type CombatRow,
} from '../db/schema.js';
import { toCombatDTO } from '../mapper.js';
import { BaseRepository, parseId } from './base-repository.js';
import { mapCharacterBody } from './character-body.js';
import { pickInt } from './field-mappers.js';

/** Combats — a round-based encounter scoped to a campaign. */
export class CombatRepository extends BaseRepository<CombatRow, Combat> {
  protected readonly table = combats;
  protected readonly idColumn = combats.id;
  readonly routeName = 'combats';
  protected readonly entityType: EntityType = 'ExposedCombat';

  toDTO(row: CombatRow): Combat {
    return toCombatDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    pickInt(json, 'round', out);
    pickInt(json, 'campaign', out);
    return out;
  }

  protected resolveCampaignId(row: CombatRow): number | null {
    return row.campaign;
  }

  protected override additionalRoutes(router: Hono, base: string): void {
    router.post(`${base}/create`, (c) => this.create(c));
    router.patch(`${base}/:id/nextRound`, (c) => this.nextRound(c));
    router.patch(`${base}/:id/add`, (c) => this.addCombatant(c));
    router.patch(`${base}/:id/remove`, (c) => this.removeCombatant(c));
    router.patch(`${base}/:id/quickAdd`, (c) => this.quickAdd(c));
    router.patch(`${base}/:id/modify`, (c) => this.modify(c));
  }

  private loadOrThrow(id: number): CombatRow {
    const combat = this.fetchById(id);
    if (!combat) throw new Error('Combat not found');
    return combat;
  }

  private requireCharacterInCampaign(characterId: number, campaignId: number): void {
    const found = db
      .select({ id: characters.id })
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.campaign, campaignId)))
      .get();
    if (!found) {
      throw new Error(`Character ${characterId} belonging to ${campaignId} not found`);
    }
  }

  private respondCombat(c: Context, combat: CombatRow, status: 200 | 201 = 200): Response {
    this.broadcast(combat, status === 201 ? 'Created' : 'Updated');
    return c.json(this.toDTO(combat), status);
  }

  private async create(c: Context): Promise<Response> {
    const body = CreateCombatRequestSchema.parse(await c.req.json());

    const campaign = db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.id, body.campaign))
      .get();
    if (!campaign) throw new Error('Campaign not found');

    const combat = db.transaction((tx) => {
      const created = tx.insert(combats).values({ campaign: body.campaign }).returning().get();
      for (const charId of new Set(body.characters)) {
        this.requireCharacterInCampaign(charId, body.campaign);
        tx.insert(combatants).values({ combat: created.id, character: charId }).run();
      }
      return created;
    });

    return this.respondCombat(c, combat, 201);
  }

  private async nextRound(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) throw new Error('Invalid ID');
    const body = NextRoundRequestSchema.parse(await c.req.json());

    const combat = this.loadOrThrow(id);
    if (combat.round !== body.fromRound) throw new Error('Combat round has changed');

    const updated = db.transaction((tx) => {
      const next = tx
        .update(combats)
        .set({ round: combat.round + 1 })
        .where(eq(combats.id, id))
        .returning()
        .get();

      const members = tx.select().from(combatants).where(eq(combatants.combat, id)).all();

      if (body.reset) {
        tx.update(combatants).set({ available: true }).where(eq(combatants.combat, id)).run();
      }

      if (body.updateConditions) {
        const characterIds = members.map((m) => m.character);
        if (characterIds.length > 0) {
          tx.delete(characterConditions)
            .where(
              and(
                inArray(characterConditions.character, characterIds),
                eq(characterConditions.endType, 'endOfTurn'),
              ),
            )
            .run();
        }
      }
      return next;
    });

    return this.respondCombat(c, updated);
  }

  private async addCombatant(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) throw new Error('Invalid ID');
    const body = CombatantRequestSchema.parse(await c.req.json());
    const combat = this.loadOrThrow(id);
    this.requireCharacterInCampaign(body.character, combat.campaign);
    db.insert(combatants).values({ combat: id, character: body.character }).run();
    return this.respondCombat(c, combat);
  }

  private async removeCombatant(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) throw new Error('Invalid ID');
    const body = CombatantRequestSchema.parse(await c.req.json());
    const combat = this.loadOrThrow(id);
    // Faithful to the original: /remove matches the combatant by its own id.
    const combatant = db
      .select()
      .from(combatants)
      .where(and(eq(combatants.id, body.character), eq(combatants.combat, id)))
      .get();
    if (!combatant) throw new Error(`Combatant ${body.character} not found in ${id}`);
    db.delete(combatants).where(eq(combatants.id, combatant.id)).run();
    return this.respondCombat(c, combat);
  }

  private async quickAdd(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) throw new Error('Invalid ID');
    const body = CombatantQuickAddRequestSchema.parse(await c.req.json());
    const combat = this.loadOrThrow(id);

    db.transaction((tx) => {
      const values = mapCharacterBody(body.character as Record<string, unknown>);
      values.campaign = combat.campaign;
      const character = tx
        .insert(characters)
        .values(values as typeof characters.$inferInsert)
        .returning()
        .get();
      tx.insert(combatants).values({ combat: id, character: character.id }).run();
    });

    return this.respondCombat(c, combat);
  }

  private async modify(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) throw new Error('Invalid ID');
    const body = CombatantModificationRequestSchema.parse(await c.req.json());
    const combat = this.loadOrThrow(id);

    db.transaction((tx) => {
      for (const charId of body.add ?? []) {
        this.requireCharacterInCampaign(charId, combat.campaign);
        tx.insert(combatants).values({ combat: id, character: charId }).run();
      }
      for (const charId of body.remove ?? []) {
        const combatant = tx
          .select()
          .from(combatants)
          .where(and(eq(combatants.character, charId), eq(combatants.combat, id)))
          .get();
        if (!combatant) throw new Error(`Combatant ${charId} not found in ${id}`);
        tx.delete(combatants).where(eq(combatants.id, combatant.id)).run();
      }
    });

    return this.respondCombat(c, combat);
  }
}
