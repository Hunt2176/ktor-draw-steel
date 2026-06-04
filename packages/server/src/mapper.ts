import { eq } from 'drizzle-orm';
import type {
  Campaign,
  Character,
  CharacterCondition,
  Combat,
  Combatant,
  DisplayEntry,
  InventoryItem,
  User,
} from '@draw-steel/shared';
import { db } from './db/client.js';
import {
  campaigns,
  characterConditions,
  characters,
  combatants,
  combats,
  displayEntry,
  inventoryItem,
  users,
  type CampaignRow,
  type CharacterConditionRow,
  type CharacterRow,
  type CombatRow,
  type CombatantRow,
  type DisplayEntryRow,
  type InventoryItemRow,
  type UserRow,
} from './db/schema.js';

/**
 * Row → DTO mapping, including the nested relations the original `*DTO.fromEntity`
 * factories assembled (character conditions/inventory, combat combatants, etc.).
 */

export const toUserDTO = (row: UserRow): User => ({ id: row.id, name: row.name });

export const toCampaignDTO = (row: CampaignRow): Campaign => ({
  id: row.id,
  name: row.name,
  heroTokens: row.heroTokens,
  background: row.background ?? null,
  kankaApiId: row.kankaApiId ?? null,
});

export const toConditionDTO = (row: CharacterConditionRow): CharacterCondition => ({
  id: row.id,
  character: row.character,
  name: row.name,
  endType: row.endType,
});

export const toInventoryItemDTO = (row: InventoryItemRow): InventoryItem => ({
  id: row.id,
  name: row.name,
  characterId: row.character,
  quantity: row.quantity,
});

export const toDisplayEntryDTO = (row: DisplayEntryRow): DisplayEntry => ({
  id: row.id,
  title: row.title,
  description: row.description ?? null,
  pictureUrl: row.pictureUrl ?? null,
  type: row.type,
  campaign: row.campaign,
});

export function toCharacterDTO(row: CharacterRow): Character {
  const conditions = db
    .select()
    .from(characterConditions)
    .where(eq(characterConditions.character, row.id))
    .all()
    .map(toConditionDTO);

  const inventory = db
    .select()
    .from(inventoryItem)
    .where(eq(inventoryItem.character, row.id))
    .all()
    .map(toInventoryItemDTO);

  return {
    id: row.id,
    name: row.name,
    might: row.might,
    agility: row.agility,
    reason: row.reason,
    intuition: row.intuition,
    presence: row.presence,
    removedHp: row.removedHp,
    maxHp: row.maxHp,
    temporaryHp: row.temporaryHp,
    removedRecoveries: row.removedRecoveries,
    maxRecoveries: row.maxRecoveries,
    temporaryRecoveries: row.temporaryRecoveries,
    victories: row.victories,
    campaign: row.campaign,
    user: row.user,
    minions: row.minions,
    offstage: row.offstage,
    resourceName: row.resourceName ?? null,
    pictureUrl: row.pictureUrl ?? null,
    border: row.border ?? null,
    conditions,
    inventory,
  };
}

export function toCombatantDTO(row: CombatantRow): Combatant {
  const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
  if (!character) throw new Error('Character not found');
  return {
    id: row.id,
    available: row.available,
    surges: row.surges,
    resources: row.resources,
    combat: row.combat,
    character: toCharacterDTO(character),
  };
}

export function toCombatDTO(row: CombatRow): Combat {
  const members = db.select().from(combatants).where(eq(combatants.combat, row.id)).all();
  return {
    id: row.id,
    round: row.round,
    campaign: row.campaign,
    combatants: members.map(toCombatantDTO),
  };
}

// ── campaign-id resolution (for change broadcasting) ─────────────────────────

export const campaignIdForCharacter = (row: CharacterRow): number => row.campaign;

export function campaignIdForCharacterId(characterId: number): number | null {
  const row = db
    .select({ campaign: characters.campaign })
    .from(characters)
    .where(eq(characters.id, characterId))
    .get();
  return row?.campaign ?? null;
}

export function campaignIdForCombatId(combatId: number): number | null {
  const row = db
    .select({ campaign: combats.campaign })
    .from(combats)
    .where(eq(combats.id, combatId))
    .get();
  return row?.campaign ?? null;
}

export { campaigns, characters, combats, combatants, characterConditions, inventoryItem, displayEntry, users };
