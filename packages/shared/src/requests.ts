import { z } from 'zod';

/** Request body schemas for the REST API, mirroring the original Ktor routes. */

export const ValueModificationRequestSchema = z.object({
  modifyBy: z.number().int(),
  type: z.enum(['INCREASE', 'DECREASE']),
});
export type ValueModificationRequest = z.infer<typeof ValueModificationRequestSchema>;

export const CharacterHealthModifierSchema = z.object({
  mod: z.number().int(),
  type: z.enum(['HEAL', 'DAMAGE']),
});
export type CharacterHealthModifier = z.infer<typeof CharacterHealthModifierSchema>;

export const CharacterRecoveriesModifierSchema = z.object({
  mod: z.number().int(),
  type: z.enum(['INCREASE', 'DECREASE']),
});
export type CharacterRecoveriesModifier = z.infer<
  typeof CharacterRecoveriesModifierSchema
>;

export const CombatantValueModificationRequestSchema = z.object({
  value: z.number().int(),
  type: z.enum(['INCREASE', 'DECREASE']),
});
export type CombatantValueModificationRequest = z.infer<
  typeof CombatantValueModificationRequestSchema
>;

export const CreateCombatRequestSchema = z.object({
  campaign: z.number().int(),
  characters: z.array(z.number().int()),
});
export type CreateCombatRequest = z.infer<typeof CreateCombatRequestSchema>;

export const NextRoundRequestSchema = z.object({
  fromRound: z.number().int(),
  reset: z.boolean(),
  updateConditions: z.boolean(),
});
export type NextRoundRequest = z.infer<typeof NextRoundRequestSchema>;

export const CombatantRequestSchema = z.object({
  character: z.number().int(),
});
export type CombatantRequest = z.infer<typeof CombatantRequestSchema>;

export const CombatantModificationRequestSchema = z.object({
  add: z.array(z.number().int()).optional(),
  remove: z.array(z.number().int()).optional(),
});
export type CombatantModificationRequest = z.infer<
  typeof CombatantModificationRequestSchema
>;

export const CombatantQuickAddRequestSchema = z.object({
  character: z.record(z.string(), z.unknown()),
});
export type CombatantQuickAddRequest = z.infer<typeof CombatantQuickAddRequestSchema>;
