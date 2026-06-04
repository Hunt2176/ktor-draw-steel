import { db } from '../db/index.js';
import type {
  CharacterWithRelations,
  CombatWithRelations,
} from './dto.js';

/** Fetch a character with its conditions + inventory loaded (for DTO mapping). */
export function getCharacterWithRelations(
  id: number,
): CharacterWithRelations | undefined {
  return db.query.characters
    .findFirst({
      where: (c, { eq: equal }) => equal(c.id, id),
      with: { conditions: true, inventory: true },
    })
    .sync() as CharacterWithRelations | undefined;
}

/** Fetch a combat with combatants → character → conditions/inventory loaded. */
export function getCombatWithRelations(
  id: number,
): CombatWithRelations | undefined {
  return db.query.combats
    .findFirst({
      where: (c, { eq: equal }) => equal(c.id, id),
      with: {
        combatants: {
          with: {
            character: { with: { conditions: true, inventory: true } },
          },
        },
      },
    })
    .sync() as unknown as CombatWithRelations | undefined;
}

/** Resolve the campaign id owning a combat (for socket scoping). */
export function campaignIdForCombat(combatId: number): number | undefined {
  const row = db.query.combats
    .findFirst({
      where: (c, { eq: equal }) => equal(c.id, combatId),
      columns: { campaign: true },
    })
    .sync();
  return row?.campaign;
}

/** Resolve the campaign id owning a character (for socket scoping). */
export function campaignIdForCharacter(characterId: number): number | undefined {
  const row = db.query.characters
    .findFirst({
      where: (c, { eq: equal }) => equal(c.id, characterId),
      columns: { campaign: true },
    })
    .sync();
  return row?.campaign;
}
