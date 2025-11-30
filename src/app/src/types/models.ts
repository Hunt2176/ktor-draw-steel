export type HasId = { id: number };
export type HasName = { name: string };

export type User = HasId;

export interface Campaign extends HasId, HasName {
	background?: string;
	heroTokens: number;
	kankaApiId?: string;
}

export const DisplayEntryType = Object.freeze({
	BACKGROUND: 'Background',
	PORTRAIT: 'Portrait',
} as const);

export type DisplayEntryType = typeof DisplayEntryType[keyof typeof DisplayEntryType];

export interface DisplayEntry extends HasId {
	title: string,
	description: string | null,
	pictureUrl: string | null,
	type: DisplayEntryType,
	campaign: number,
}

export interface CampaignDetails {
	campaign: Campaign,
	characters: Character[],
	entries: DisplayEntry[],
}

export const CharacterConditionEndType = Object.freeze({
	END_OF_TURN: 'endOfTurn',
	SAVE: 'save'
});

export type CharacterConditionEndType = typeof CharacterConditionEndType[keyof typeof CharacterConditionEndType];

export interface CharacterCondition extends HasId, HasName {
	character: number;
	endType: CharacterConditionEndType;
}

export interface InventoryItem extends HasId, HasName {
	characterId: number;
	quantity: number;
}

export interface Character extends HasId, HasName {
	might: number;
	agility: number;
	reason: number;
	intuition: number;
	presence: number;
	removedHp: number;
	maxHp: number;
	temporaryHp: number;
	removedRecoveries: number;
	maxRecoveries: number;
	temporaryRecoveries: number;
	resourceName: string | null;
	victories: number;
	user: number;
	pictureUrl: string | null;
	border: string | null;
	offstage: boolean;
	minions: number;
	inventory: InventoryItem[];
	
	campaign: number;
	conditions: CharacterCondition[];
}

export interface CharacterPool {
	current: number;
	max: number;
	percent: number;
	temporary: number
}

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
	
	export function empty() {
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
			inventory: []
		} as Character;
	}
}

export type Combatant = HasId & {
	available: boolean;
	resources: number;
	surges: number;
	character: Character;
}

export type Combat = HasId & {
	round: number;
	campaign: number;
	combatants: Combatant[];
}

export const KtorEntityType = Object.freeze({
	DISPLAY_ENTRY: 'ExposedDisplayEntry',
	CAMPAIGN: 'ExposedCampaign',
	CHARACTER: 'ExposedCharacter',
	COMBAT: 'ExposedCombat',
	COMBATANT: 'ExposedCombatant',
	CONDITION: 'ExposedCondition',
	CHARACTER_CONDITION: 'ExposedCharacterCondition',
} as const);

export type KtorEntityType = typeof KtorEntityType[keyof typeof KtorEntityType];

export const ChangeType = Object.freeze({
	UPDATED: 'Updated',
	CREATED: 'Created',
	REMOVED: 'Removed',
} as const);

export type ChangeType = typeof ChangeType[keyof typeof ChangeType];

export interface SocketEvent {
	campaignId: number;
	changeType: ChangeType;
	entityType: KtorEntityType | null;
	dataId: number | null;
	data: Campaign | Character | Combat | Combatant | CharacterCondition | DisplayEntry | null;
}