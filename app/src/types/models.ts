export type HasId = { id: number };
export type HasName = { name: string };

export type User = HasId;

export interface Campaign extends HasId, HasName {}
export interface CampaignDetails {
	campaign: Campaign;
	characters: Character[];
}

export type CharacterConditionEndType = 'endOfTurn' | 'save';
export type CharacterCondition = HasId & HasName & {
	character: number;
	endType: CharacterConditionEndType;
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
	recoveries: number;
	maxRecoveries: number;
	resources: number;
	surges: number;
	victories: number;
	user: number;
	pictureUrl: string | undefined;
	border: string | undefined;
	
	campaign: number;
	conditions: CharacterCondition[];
}

export interface CharacterPool {
	current: number;
	max: number;
	percent: number;
}

export class Character {
	static getHp(char: Character): CharacterPool {
		const current = char.maxHp + char.temporaryHp - char.removedHp;
		const percent = current / char.maxHp;
		return { current, max: char.maxHp, percent };
	}
	
	static getRecoveries(char: Character): CharacterPool {
		const percent = char.recoveries / char.maxRecoveries;
		return { current: char.recoveries, max: char.maxRecoveries, percent };
	}
	
	static new() {
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
			recoveries: 0,
			maxRecoveries: 0,
			resources: 0,
			surges: 0,
			victories: 0,
			user: -1,
			campaign: -1,
			pictureUrl: undefined,
			border: undefined,
			conditions: [],
		} as Character;
	}
	
	private constructor() {}
}

export type Combatant = HasId & {
	available: boolean;
	character: number;
}

export type Combat = HasId & {
	round: number;
	campaign: number;
	combatants: Combatant[];
}