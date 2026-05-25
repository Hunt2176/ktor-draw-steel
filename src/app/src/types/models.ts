import { z } from "zod";

// Partial of type T but with Key still originally required
export type PartialOmit<T, Key extends keyof T> = Partial<Omit<T, Key>> & Pick<T, Key>;

export type Comparer<T> = (a: T, b: T) => boolean;

const relativeUrlSchema = z.string().regex(/^(?![a-zA-Z][a-zA-Z0-9+\-.]*:).+$/);

export const hasIdSchema = z.object({
	id: z.number(),
});

export const hasNameSchema = z.object({
	name: z.string(),
});

export const userSchema = hasIdSchema.merge(hasNameSchema);

const baseEntitySchema = hasIdSchema.merge(hasNameSchema);

export const characterConditionEndTypeSchema = z.enum(["endOfTurn", "save"]);

export const characterConditionSchema = baseEntitySchema.extend({
	character: z.number(),
	endType: characterConditionEndTypeSchema,
});

export const inventoryItemSchema = baseEntitySchema.extend({
	characterId: z.number(),
	quantity: z.number(),
});

export const characterSchema = baseEntitySchema.extend({
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
	resourceName: z.string().nullable(),
	victories: z.number(),
	user: z.number(),
	pictureUrl: z.string().nullable(),
	border: z.string().nullable(),
	offstage: z.boolean(),
	minions: z.number(),
	inventory: z.array(inventoryItemSchema),
	campaign: z.number(),
	conditions: z.array(characterConditionSchema),
});

export const campaignSchema = baseEntitySchema.extend({
	background: z.union([z.string().url(), relativeUrlSchema]).nullable(),
	heroTokens: z.number(),
	kankaApiId: z.number().nullable(),
});

const displayEntryTypeSchema = z.enum(["Background", "Portrait"]);
export const displayEntrySchema = hasIdSchema.extend({
	title: z.string(),
	description: z.string().nullable(),
	pictureUrl: z.union([z.string().url(), relativeUrlSchema]).nullable(),
	type: displayEntryTypeSchema,
	campaign: z.number(),
});

export const campaignDetailsSchema = z.object({
	campaign: campaignSchema,
	characters: z.array(characterSchema),
	entries: z.array(displayEntrySchema),
});

export const combatantSchema = hasIdSchema.extend({
	available: z.boolean(),
	resources: z.number(),
	surges: z.number(),
	character: characterSchema,
	combat: z.number(),
});

export const combatSchema = hasIdSchema.extend({
	round: z.number(),
	campaign: z.number(),
	combatants: z.array(combatantSchema),
});

const ktorEntityTypeSchema = z.enum([
	"ExposedInventoryItem",
	"ExposedDisplayEntry",
	"ExposedCampaign",
	"ExposedCharacter",
	"ExposedCombat",
	"ExposedCombatant",
	"ExposedCharacterCondition",
]);

const changeTypeSchema = z.enum(["Updated", "Created", "Removed"]);

export const socketEventSchema = z.object({
	campaignId: z.number(),
	changeType: changeTypeSchema,
	entityType: ktorEntityTypeSchema.nullable(),
	dataId: z.number().nullable(),
	data: z
		.union([
			inventoryItemSchema,
			campaignSchema,
			characterSchema,
			combatSchema,
			combatantSchema,
			characterConditionSchema,
			displayEntrySchema,
		])
		.nullable(),
});

export const DisplayEntryType = Object.freeze({
	BACKGROUND: "Background",
	PORTRAIT: "Portrait",
} as const);

export const CharacterConditionEndType = Object.freeze({
	END_OF_TURN: "endOfTurn",
	SAVE: "save",
} as const);

export const KtorEntityType = Object.freeze({
	DISPLAY_ENTRY: "ExposedDisplayEntry",
	CAMPAIGN: "ExposedCampaign",
	CHARACTER: "ExposedCharacter",
	COMBAT: "ExposedCombat",
	COMBATANT: "ExposedCombatant",
	CHARACTER_CONDITION: "ExposedCharacterCondition",
	INVENTORY_ITEM: "ExposedInventoryItem",
} as const);

export const ChangeType = Object.freeze({
	UPDATED: "Updated",
	CREATED: "Created",
	REMOVED: "Removed",
} as const);

export type HasId = z.infer<typeof hasIdSchema>;
export type HasName = z.infer<typeof hasNameSchema>;
export type User = z.infer<typeof userSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type DisplayEntryType = z.infer<typeof displayEntryTypeSchema>;
export type DisplayEntry = z.infer<typeof displayEntrySchema>;
export type CampaignDetails = z.infer<typeof campaignDetailsSchema>;
export type CharacterConditionEndType = z.infer<typeof characterConditionEndTypeSchema>;
export type CharacterCondition = z.infer<typeof characterConditionSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Character = z.infer<typeof characterSchema>;

export type CharacterPool = {
	current: number;
	max: number;
	percent: number;
	temporary: number;
};

export namespace Character {
	export function getHp(char: Character): CharacterPool {
		const current = char.maxHp + char.temporaryHp - char.removedHp;
		const percent = current / char.maxHp;
		return { current, max: char.maxHp, percent, temporary: char.temporaryHp };
	}
	
	export function getRecoveries(char: Character): CharacterPool {
		const current = Math.max(char.maxRecoveries + char.temporaryRecoveries - char.removedRecoveries, 0);
		const percent = current / char.maxRecoveries;
		return { current, max: char.maxRecoveries, percent, temporary: char.temporaryRecoveries };
	}
	
	export function empty(): Character {
		return {
			id: -1,
			name: "",
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
}

export type Combatant = z.infer<typeof combatantSchema>;
export type Combat = z.infer<typeof combatSchema>;
export type KtorEntityType = z.infer<typeof ktorEntityTypeSchema>;
export type ChangeType = z.infer<typeof changeTypeSchema>;
export type SocketEvent = z.infer<typeof socketEventSchema>;