import { z } from "zod";

export const modifyValueSchema = z.object({
    modifyBy: z.number().int().nonnegative(),
    type: z.enum(["INCREASE", "DECREASE"]),
});

export const campaignCreateSchema = z.object({
    name: z.string().min(1),
    background: z.string().nullable().optional(),
    heroTokens: z.number().int().nonnegative().optional(),
    kankaApiId: z.number().int().nullable().optional(),
});

export const campaignPatchSchema = campaignCreateSchema.partial();

export const characterCreateSchema = z.object({
    name: z.string().min(1),
    might: z.number().int().optional(),
    agility: z.number().int().optional(),
    reason: z.number().int().optional(),
    intuition: z.number().int().optional(),
    presence: z.number().int().optional(),
    removedHp: z.number().int().nonnegative().optional(),
    maxHp: z.number().int().optional(),
    temporaryHp: z.number().int().nonnegative().optional(),
    removedRecoveries: z.number().int().nonnegative().optional(),
    maxRecoveries: z.number().int().optional(),
    temporaryRecoveries: z.number().int().nonnegative().optional(),
    victories: z.number().int().optional(),
    minions: z.number().int().nonnegative().optional(),
    offstage: z.boolean().optional(),
    resourceName: z.string().nullable().optional(),
    pictureUrl: z.string().nullable().optional(),
    border: z.string().nullable().optional(),
    campaign: z.number().int().positive(),
    user: z.number().int().positive(),
});

export const characterPatchSchema = characterCreateSchema.partial();

export const characterHealthSchema = z.object({
    mod: z.number().int().nonnegative(),
    type: z.enum(["HEAL", "DAMAGE"]),
});

export const characterRecoveriesSchema = z.object({
    mod: z.number().int().nonnegative(),
    type: z.enum(["INCREASE", "DECREASE"]),
});

export const characterConditionCreateSchema = z.object({
    character: z.number().int().positive(),
    name: z.string().min(1),
    endType: z.enum(["endOfTurn", "save"]),
});

export const characterConditionPatchSchema = characterConditionCreateSchema.partial();

export const inventoryCreateSchema = z.object({
    name: z.string().min(1),
    character: z.number().int().positive(),
    quantity: z.number().int().nonnegative(),
});

export const inventoryPatchSchema = inventoryCreateSchema.partial();

export const displayEntryCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string().nullable(),
    pictureUrl: z.string().nullable(),
    type: z.enum(["Portrait", "Background"]),
    campaign: z.number().int().positive(),
});

export const displayEntryPatchSchema = displayEntryCreateSchema.partial();

export const combatCreateSchema = z.object({
    campaign: z.number().int().positive(),
    characters: z.array(z.number().int().positive()),
});

export const combatPatchSchema = z
    .object({
        round: z.number().int().positive().optional(),
        campaign: z.number().int().positive().optional(),
    })
    .partial();

export const combatRoundSchema = z.object({
    fromRound: z.number().int().positive(),
    reset: z.boolean(),
    updateConditions: z.boolean(),
});

export const combatantRequestSchema = z.object({
    character: z.number().int().positive(),
});

export const combatModifySchema = z.object({
    add: z.array(z.number().int().positive()).optional(),
    remove: z.array(z.number().int().positive()).optional(),
});

export const combatQuickAddSchema = z.object({
    character: characterCreateSchema.omit({ campaign: true }).partial().extend({
        name: z.string().min(1),
        user: z.number().int().positive(),
        maxHp: z.number().int(),
        offstage: z.boolean(),
    }),
});

export const combatantCreateSchema = z.object({
    available: z.boolean().optional(),
    surges: z.number().int().nonnegative().optional(),
    resources: z.number().int().nonnegative().optional(),
    combat: z.number().int().positive(),
    character: z.number().int().positive(),
});

export const combatantPatchSchema = combatantCreateSchema.partial();

export const combatantValueSchema = z.object({
    value: z.number().int().nonnegative(),
    type: z.enum(["INCREASE", "DECREASE"]),
});

export const userCreateSchema = z.object({ name: z.string().min(1) });
export const userPatchSchema = userCreateSchema.partial();
