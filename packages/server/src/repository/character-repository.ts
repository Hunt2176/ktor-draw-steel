import type { Context, Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  CharacterHealthModifierSchema,
  CharacterRecoveriesModifierSchema,
  type Character,
  type EntityType,
} from '@draw-steel/shared';
import { db } from '../db/client.js';
import { characters, type CharacterRow } from '../db/schema.js';
import { toCharacterDTO } from '../mapper.js';
import { BaseRepository, atLeastZero, parseId } from './base-repository.js';
import { mapCharacterBody } from './character-body.js';

/** Characters (player heroes and NPCs) with HP and recovery pools. */
export class CharacterRepository extends BaseRepository<CharacterRow, Character> {
  protected readonly table = characters;
  protected readonly idColumn = characters.id;
  readonly routeName = 'characters';
  protected readonly entityType: EntityType = 'ExposedCharacter';

  toDTO(row: CharacterRow): Character {
    return toCharacterDTO(row);
  }

  protected mapBody(json: Record<string, unknown>): Record<string, unknown> {
    return mapCharacterBody(json);
  }

  protected resolveCampaignId(row: CharacterRow): number | null {
    return row.campaign;
  }

  protected override additionalRoutes(router: Hono, base: string): void {
    router.patch(`${base}/:id/modify/health`, (c) => this.modifyHealth(c));
    router.patch(`${base}/:id/modify/recoveries`, (c) => this.modifyRecoveries(c));
  }

  private async modifyHealth(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) return c.text('Invalid ID', 400);
    const row = this.fetchById(id);
    if (!row) return c.text('Character not found', 404);
    const update = CharacterHealthModifierSchema.parse(await c.req.json());

    const removed = atLeastZero(row.removedHp);
    let newTemp = row.temporaryHp;
    let newRemoved = removed;

    if (update.type === 'HEAL') {
      newRemoved = removed - update.mod;
    } else {
      // DAMAGE — temporary HP soaks first, overflow carries to removed HP.
      if (row.temporaryHp > 0) {
        const tempAfter = row.temporaryHp - update.mod;
        newTemp = atLeastZero(tempAfter);
        if (tempAfter >= 0) {
          const saved = db
            .update(characters)
            .set({ temporaryHp: newTemp })
            .where(eq(characters.id, id))
            .returning()
            .get() as CharacterRow;
          this.broadcast(saved, 'Updated');
          return c.json(this.toDTO(saved));
        }
        newRemoved = removed + atLeastZero(-tempAfter);
      } else {
        newRemoved = removed + update.mod;
      }
    }

    const saved = db
      .update(characters)
      .set({ removedHp: atLeastZero(newRemoved), temporaryHp: newTemp })
      .where(eq(characters.id, id))
      .returning()
      .get() as CharacterRow;
    this.broadcast(saved, 'Updated');
    return c.json(this.toDTO(saved));
  }

  private async modifyRecoveries(c: Context): Promise<Response> {
    const id = parseId(c);
    if (id == null) return c.text('Invalid ID', 400);
    const row = this.fetchById(id);
    if (!row) return c.text('Character not found', 404);
    const update = CharacterRecoveriesModifierSchema.parse(await c.req.json());

    const removed = atLeastZero(row.removedRecoveries);
    let newTemp = row.temporaryRecoveries;
    let newRemoved = removed;

    if (update.type === 'INCREASE') {
      newRemoved = removed - update.mod;
    } else {
      if (row.temporaryRecoveries > 0) {
        const tempAfter = row.temporaryRecoveries - update.mod;
        newTemp = atLeastZero(tempAfter);
        if (tempAfter >= 0) {
          const saved = db
            .update(characters)
            .set({ temporaryRecoveries: newTemp })
            .where(eq(characters.id, id))
            .returning()
            .get() as CharacterRow;
          this.broadcast(saved, 'Updated');
          return c.json(this.toDTO(saved));
        }
        newRemoved = removed + atLeastZero(-tempAfter);
      } else {
        newRemoved = removed + update.mod;
      }
    }

    const saved = db
      .update(characters)
      .set({ removedRecoveries: atLeastZero(newRemoved), temporaryRecoveries: newTemp })
      .where(eq(characters.id, id))
      .returning()
      .get() as CharacterRow;
    this.broadcast(saved, 'Updated');
    return c.json(this.toDTO(saved));
  }
}
