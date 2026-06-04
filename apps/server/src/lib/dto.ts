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
import type { InferSelectModel } from 'drizzle-orm';
import type * as schema from '../db/schema.js';

type UserRow = InferSelectModel<typeof schema.users>;
type CampaignRow = InferSelectModel<typeof schema.campaigns>;
type CharacterRow = InferSelectModel<typeof schema.characters>;
type CharacterConditionRow = InferSelectModel<typeof schema.characterConditions>;
type InventoryRow = InferSelectModel<typeof schema.inventoryItem>;
type CombatRow = InferSelectModel<typeof schema.combats>;
type CombatantRow = InferSelectModel<typeof schema.combatants>;
type DisplayEntryRow = InferSelectModel<typeof schema.displayEntry>;

export type CharacterWithRelations = CharacterRow & {
  conditions: CharacterConditionRow[];
  inventory: InventoryRow[];
};

// `character` is both a scalar FK column and a relation name, so omit the scalar.
export type CombatantWithRelations = Omit<CombatantRow, 'character'> & {
  character: CharacterWithRelations;
};

export type CombatWithRelations = CombatRow & {
  combatants: CombatantWithRelations[];
};

export function toUserDTO(row: UserRow): User {
  return { id: row.id, name: row.name };
}

export function toCampaignDTO(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    heroTokens: row.heroTokens,
    background: row.background,
    kankaApiId: row.kankaApiId,
  };
}

export function toCharacterConditionDTO(
  row: CharacterConditionRow,
): CharacterCondition {
  return {
    id: row.id,
    character: row.character,
    name: row.name,
    endType: row.endType,
  };
}

export function toInventoryItemDTO(row: InventoryRow): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    characterId: row.character,
    quantity: row.quantity,
  };
}

export function toCharacterDTO(row: CharacterWithRelations): Character {
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
    resourceName: row.resourceName,
    pictureUrl: row.pictureUrl,
    border: row.border,
    conditions: row.conditions.map(toCharacterConditionDTO),
    inventory: row.inventory.map(toInventoryItemDTO),
  };
}

export function toCombatantDTO(row: CombatantWithRelations): Combatant {
  return {
    id: row.id,
    available: row.available,
    surges: row.surges,
    resources: row.resources,
    combat: row.combat,
    character: toCharacterDTO(row.character),
  };
}

export function toCombatDTO(row: CombatWithRelations): Combat {
  return {
    id: row.id,
    round: row.round,
    campaign: row.campaign,
    combatants: row.combatants.map(toCombatantDTO),
  };
}

export function toDisplayEntryDTO(row: DisplayEntryRow): DisplayEntry {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    pictureUrl: row.pictureUrl,
    type: row.type,
    campaign: row.campaign,
  };
}
