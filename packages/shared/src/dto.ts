import { z } from 'zod';

/**
 * Entity DTO schemas — the JSON shapes the API emits. These mirror the original
 * Kotlin `*DTO` data classes 1:1 so the contract is byte-compatible with the
 * legacy Ktor backend and the existing client expectations.
 */

export const UserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const CharacterConditionEndType = z.enum(['endOfTurn', 'save']);
export type CharacterConditionEndType = z.infer<typeof CharacterConditionEndType>;

export const CharacterConditionSchema = z.object({
  id: z.number().int(),
  character: z.number().int(),
  name: z.string(),
  endType: CharacterConditionEndType,
});
export type CharacterCondition = z.infer<typeof CharacterConditionSchema>;

export const InventoryItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  characterId: z.number().int(),
  quantity: z.number().int(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const CharacterSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  might: z.number().int(),
  agility: z.number().int(),
  reason: z.number().int(),
  intuition: z.number().int(),
  presence: z.number().int(),
  removedHp: z.number().int(),
  maxHp: z.number().int(),
  temporaryHp: z.number().int(),
  removedRecoveries: z.number().int(),
  maxRecoveries: z.number().int(),
  temporaryRecoveries: z.number().int(),
  victories: z.number().int(),
  campaign: z.number().int(),
  user: z.number().int(),
  minions: z.number().int(),
  offstage: z.boolean(),
  resourceName: z.string().nullable(),
  pictureUrl: z.string().nullable(),
  border: z.string().nullable(),
  conditions: z.array(CharacterConditionSchema),
  inventory: z.array(InventoryItemSchema),
});
export type Character = z.infer<typeof CharacterSchema>;

export const CampaignSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  heroTokens: z.number().int(),
  background: z.string().nullable(),
  kankaApiId: z.number().int().nullable(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const DisplayEntryType = z.enum(['Portrait', 'Background']);
export type DisplayEntryType = z.infer<typeof DisplayEntryType>;

export const DisplayEntrySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  pictureUrl: z.string().nullable(),
  type: DisplayEntryType,
  campaign: z.number().int(),
});
export type DisplayEntry = z.infer<typeof DisplayEntrySchema>;

export const CampaignDetailsSchema = z.object({
  campaign: CampaignSchema,
  characters: z.array(CharacterSchema),
  entries: z.array(DisplayEntrySchema),
});
export type CampaignDetails = z.infer<typeof CampaignDetailsSchema>;

export const CombatantSchema = z.object({
  id: z.number().int(),
  available: z.boolean(),
  surges: z.number().int(),
  resources: z.number().int(),
  combat: z.number().int(),
  character: CharacterSchema,
});
export type Combatant = z.infer<typeof CombatantSchema>;

export const CombatSchema = z.object({
  id: z.number().int(),
  round: z.number().int(),
  campaign: z.number().int(),
  combatants: z.array(CombatantSchema),
});
export type Combat = z.infer<typeof CombatSchema>;
