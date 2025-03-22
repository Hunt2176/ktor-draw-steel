import { type } from "arktype";

const RootScope = type.scope({
	'string.relativeUrl': /^(?![a-zA-Z][a-zA-Z0-9+\-.]*:).+/,
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
		offstage: 'boolean',
	},
	Campaign: {
		'...': 'BaseEntity',
		background: 'string.url | string.relativeUrl',
	},
	CampaignDetails: {
		campaign: 'Campaign',
		characters: 'Character[]',
		entries: 'DisplayEntry[]',
	},
	Combatant: {
		'...': 'HasId',
		available: 'boolean',
		resources: 'number',
		surges: 'number',
		character: 'Character',
		combat: 'number'
	},
	Combat: {
		'...': 'HasId',
		campaign: 'number',
		combatants: 'Combatant[]',
	},
	DisplayEntry: {
		'...': 'HasId',
		title: 'string',
		description: 'string | null',
		pictureUrl: 'string.url | string.relativeUrl | null',
		type: '"Background" | "Portrait"',
		campaign: 'number',
	},
	EntityType: '"ExposedDisplayEntry" | "ExposedCampaign" | "ExposedCharacter" | "ExposedCombat" | "ExposedCombatant" | "ExposedCondition" | "ExposedCharacterCondition"',
	SocketEvent: {
		campaignId: 'number',
		changeType: '"Updated" | "Created" | "Removed"',
		entityType: 'EntityType | null',
		dataId: 'number | null',
		data: 'Campaign | Character | Combat | Combatant | CharacterCondition | DisplayEntry | null',
	}
});

const RootModule = RootScope.export();

export { RootModule as default, RootScope };