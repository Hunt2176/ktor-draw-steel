import { type } from "arktype";

const RootScope = type.scope({
	HasId: {
		id: 'number',
	},
	HasName: {
		name: 'string',
	},
	BaseEntity: {
		'...': 'HasId & HasName',
	},
	CharacterConditionEndType: '"endOfTurn" | "save"',
	CharacterCondition: {
		'...': 'BaseEntity',
		character: 'number',
		endType: 'CharacterConditionEndType',
	},
	Character: {
		'...': 'BaseEntity',
		might: 'number',
		agility: 'number',
		reason: 'number',
		intuition: 'number',
		presence: 'number',
		removedHp: 'number',
		maxHp: 'number',
		temporaryHp: 'number',
		removedRecoveries: 'number',
		maxRecoveries: 'number',
		resourceName: 'string | null',
		victories: 'number',
		user: 'number',
		pictureUrl: 'string | null',
		border: 'string | null',
		campaign: 'number',
		conditions: 'CharacterCondition[]',
	},
	Campaign: {
		'...': 'BaseEntity',
		background: 'string.url | string.ip',
	},
	CampaignDetails: {
		'...': 'BaseEntity',
		campaign: 'Campaign',
		characters: 'Character[]',
	},
	Combatant: {
		'...': 'HasId',
		available: 'boolean',
		resources: 'number',
		surges: 'number',
		character: 'Character',
	},
	Combat: {
		'...': 'HasId',
		campaign: 'number',
		combatants: 'Combatant[]',
	},
});

const RootModule = RootScope.export();

export { RootModule as default };