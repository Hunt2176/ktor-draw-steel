import { z } from 'zod';

/**
 * Shared DTO schemas. These mirror, field-for-field, the JSON the original
 * Ktor/Exposed backend produced (the `*DTO` Kotlin data classes), so the same
 * client code keeps working unchanged.
 */

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const CharacterConditionEndType = {
  END_OF_TURN: 'endOfTurn',
  SAVE: 'save',
} as const;
export type CharacterConditionEndType =
  (typeof CharacterConditionEndType)[keyof typeof CharacterConditionEndType];

export const CharacterConditionEndTypeSchema = z.enum(['endOfTurn', 'save']);

export const CharacterConditionSchema = z.object({
  id: z.number(),
  character: z.number(),
  name: z.string(),
  endType: CharacterConditionEndTypeSchema,
});
export type CharacterCondition = z.infer<typeof CharacterConditionSchema>;

export const InventoryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  characterId: z.number(),
  quantity: z.number(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const CharacterSchema = z.object({
  id: z.number(),
  name: z.string(),
  might: z.number(),
  agility: z.number(),
  reason: z.number(),
  intuition: z.number(),
  presence: z.number(),
  removedHp: z.number(),
  maxHp: z.number(),
  temporaryHp: z.number(),
  removedRecoveries: z.number(),
  maxRecoveries: z.number(),
  temporaryRecoveries: z.number(),
  victories: z.number(),
  campaign: z.number(),
  user: z.number(),
  minions: z.number(),
  offstage: z.boolean(),
  resourceName: z.string().nullable(),
  pictureUrl: z.string().nullable(),
  border: z.string().nullable(),
  conditions: z.array(CharacterConditionSchema),
  inventory: z.array(InventoryItemSchema),
});
export type Character = z.infer<typeof CharacterSchema>;

export const DisplayEntryType = {
  PORTRAIT: 'Portrait',
  BACKGROUND: 'Background',
} as const;
export type DisplayEntryType =
  (typeof DisplayEntryType)[keyof typeof DisplayEntryType];

export const DisplayEntryTypeSchema = z.enum(['Portrait', 'Background']);

export const DisplayEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  pictureUrl: z.string().nullable(),
  type: DisplayEntryTypeSchema,
  campaign: z.number(),
});
export type DisplayEntry = z.infer<typeof DisplayEntrySchema>;

export const CampaignSchema = z.object({
  id: z.number(),
  name: z.string(),
  heroTokens: z.number(),
  background: z.string().nullable(),
  kankaApiId: z.number().nullable(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const CampaignDetailsSchema = z.object({
  campaign: CampaignSchema,
  characters: z.array(CharacterSchema),
  entries: z.array(DisplayEntrySchema),
});
export type CampaignDetails = z.infer<typeof CampaignDetailsSchema>;

export const CombatantSchema = z.object({
  id: z.number(),
  available: z.boolean(),
  surges: z.number(),
  resources: z.number(),
  combat: z.number(),
  character: CharacterSchema,
});
export type Combatant = z.infer<typeof CombatantSchema>;

export const CombatSchema = z.object({
  id: z.number(),
  round: z.number(),
  campaign: z.number(),
  combatants: z.array(CombatantSchema),
});
export type Combat = z.infer<typeof CombatSchema>;

/** Derived pool used by the character cards (HP / Recoveries gauges). */
export interface CharacterPool {
  current: number;
  max: number;
  percent: number;
  temporary: number;
}

export function getHp(char: Character): CharacterPool {
  const current = char.maxHp + char.temporaryHp - char.removedHp;
  const percent = current / char.maxHp;
  return { current, max: char.maxHp, percent, temporary: char.temporaryHp };
}

export function getRecoveries(char: Character): CharacterPool {
  const current = Math.max(
    char.maxRecoveries + char.temporaryRecoveries - char.removedRecoveries,
    0,
  );
  const percent = current / char.maxRecoveries;
  return {
    current,
    max: char.maxRecoveries,
    percent,
    temporary: char.temporaryRecoveries,
  };
}

export function emptyCharacter(): Character {
  return {
    id: -1,
    name: '',
    might: 0,
    agility: 0,
    reason: 0,
    intuition: 0,
    presence: 0,
    removedHp: 0,
    maxHp: 0,
    temporaryHp: 0,
    removedRecoveries: 0,
    temporaryRecoveries: 0,
    maxRecoveries: 0,
    resourceName: null,
    victories: 0,
    user: -1,
    campaign: -1,
    pictureUrl: null,
    border: null,
    offstage: false,
    minions: 0,
    conditions: [],
    inventory: [],
  };
}
