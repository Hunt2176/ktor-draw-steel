import { z } from 'zod';
import {
  CampaignSchema,
  CharacterSchema,
  CharacterConditionSchema,
  CombatSchema,
  CombatantSchema,
  DisplayEntrySchema,
  InventoryItemSchema,
} from './models.js';

/**
 * Entity-class names broadcast by the original server (Exposed entity simple
 * names). Kept identical so existing socket consumers compare equal.
 */
export const EntityType = {
  INVENTORY_ITEM: 'ExposedInventoryItem',
  DISPLAY_ENTRY: 'ExposedDisplayEntry',
  CAMPAIGN: 'ExposedCampaign',
  CHARACTER: 'ExposedCharacter',
  COMBAT: 'ExposedCombat',
  COMBATANT: 'ExposedCombatant',
  CONDITION: 'ExposedCondition',
  CHARACTER_CONDITION: 'ExposedCharacterCondition',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const EntityTypeSchema = z.enum([
  'ExposedInventoryItem',
  'ExposedDisplayEntry',
  'ExposedCampaign',
  'ExposedCharacter',
  'ExposedCombat',
  'ExposedCombatant',
  'ExposedCondition',
  'ExposedCharacterCondition',
]);

export const ChangeType = {
  UPDATED: 'Updated',
  CREATED: 'Created',
  REMOVED: 'Removed',
} as const;
export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType];

export const ChangeTypeSchema = z.enum(['Updated', 'Created', 'Removed']);

export const SocketEventDataSchema = z.union([
  InventoryItemSchema,
  CampaignSchema,
  CharacterSchema,
  CombatSchema,
  CombatantSchema,
  CharacterConditionSchema,
  DisplayEntrySchema,
]);

export const SocketEventSchema = z.object({
  campaignId: z.number(),
  changeType: ChangeTypeSchema,
  entityType: EntityTypeSchema.nullable(),
  dataId: z.number().nullable(),
  data: SocketEventDataSchema.nullable(),
});
export type SocketEvent = z.infer<typeof SocketEventSchema>;
