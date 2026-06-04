import { z } from 'zod';
import {
  CampaignSchema,
  CharacterSchema,
  CharacterConditionSchema,
  CombatSchema,
  CombatantSchema,
  DisplayEntrySchema,
  InventoryItemSchema,
} from './dto.js';

/**
 * Live-update event broadcast over the campaign WebSocket. Mirrors the Kotlin
 * `CampaignSocketUpdate`. `entityType` carries the original `Exposed*` class
 * names so existing client switch logic keeps working.
 */

export const ChangeType = z.enum(['Created', 'Updated', 'Removed']);
export type ChangeType = z.infer<typeof ChangeType>;

export const EntityType = z.enum([
  'ExposedInventoryItem',
  'ExposedDisplayEntry',
  'ExposedCampaign',
  'ExposedCharacter',
  'ExposedCombat',
  'ExposedCombatant',
  'ExposedCondition',
  'ExposedCharacterCondition',
]);
export type EntityType = z.infer<typeof EntityType>;

export const SocketEventSchema = z.object({
  campaignId: z.number().int(),
  changeType: ChangeType,
  entityType: EntityType.nullable(),
  dataId: z.number().int().nullable(),
  data: z
    .union([
      InventoryItemSchema,
      CampaignSchema,
      CharacterSchema,
      CombatSchema,
      CombatantSchema,
      CharacterConditionSchema,
      DisplayEntrySchema,
    ])
    .nullable(),
});
export type SocketEvent = z.infer<typeof SocketEventSchema>;
