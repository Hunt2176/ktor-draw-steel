import type { Context, Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  CombatantValueModificationRequestSchema,
  type Combatant,
  type EntityType,
} from '@draw-steel/shared';
import { db } from '../db/client.js';
import { combatants, type CombatantRow } from '../db/schema.js';
import { campaignIdForCombatId, toCombatantDTO } from '../mapper.js';
import { BaseRepository, atLeastZero, parseId } from './base-repository.js';
import { pickBool, pickInt } from './field-mappers.js';

/** Combatants — a character's participation in a specific combat. */
export class CombatantRepository extends BaseRepository<CombatantRow, Combatant> {
  protected readonly table = combatants;
  protected readonly idColumn = combatants.id;
  readonly routeName = 'combatants';
  protected readonly entityType: EntityType = 'ExposedCombatant';

  toDTO(row: CombatantRow): Combatant {
    return toCombatantDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    pickBool(json, 'available', out);
    pickInt(json, 'surges', out);
    pickInt(json, 'resources', out);
    pickInt(json, 'combat', out);
    pickInt(json, 'character', out);
    return out;
  }

  protected resolveCampaignId(row: CombatantRow): number | null {
    return campaignIdForCombatId(row.combat);
  }

  protected override additionalRoutes(router: Hono, base: string): void {
    router.patch(`${base}/:id/resources`, (c) => this.modify(c, 'resources'));
    router.patch(`${base}/:id/surges`, (c) => this.modify(c, 'surges'));
  }

  private async modify(c: Context, field: 'resources' | 'surges'): Promise<Response> {
    const id = parseId(c);
    if (id == null) return c.text('Invalid ID', 400);
    const row = this.fetchById(id);
    if (!row) return c.text('Combatant not found', 404);
    const request = CombatantValueModificationRequestSchema.parse(await c.req.json());
    const delta = request.type === 'INCREASE' ? request.value : -request.value;
    const next = atLeastZero(row[field] + delta);
    const saved = db
      .update(combatants)
      .set({ [field]: next })
      .where(eq(combatants.id, id))
      .returning()
      .get() as CombatantRow;
    this.broadcast(saved, 'Updated');
    return c.json(this.toDTO(saved));
  }
}
