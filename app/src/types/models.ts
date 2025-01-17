export type HasId = { id: number };
export type HasName = { name: string };

export type User = HasId;

export type Campaign = HasId & HasName;

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

interface CharacterPool {
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