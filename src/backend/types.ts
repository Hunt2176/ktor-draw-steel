export type JsonRecord = Record<string, unknown>;

export type ChangeType = "Created" | "Updated" | "Removed";
export type EntityType =
    | "ExposedInventoryItem"
    | "ExposedDisplayEntry"
    | "ExposedCampaign"
    | "ExposedCharacter"
    | "ExposedCombat"
    | "ExposedCombatant"
    | "ExposedCharacterCondition";

export interface CampaignDTO {
    id: number;
    name: string;
    heroTokens: number;
    background: string | null;
    kankaApiId: number | null;
}

export interface CharacterConditionDTO {
    id: number;
    character: number;
    name: string;
    endType: "endOfTurn" | "save";
}

export interface InventoryItemDTO {
    id: number;
    name: string;
    characterId: number;
    quantity: number;
}

export interface CharacterDTO {
    id: number;
    name: string;
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
    victories: number;
    campaign: number;
    user: number;
    minions: number;
    offstage: boolean;
    resourceName: string | null;
    pictureUrl: string | null;
    border: string | null;
    conditions: CharacterConditionDTO[];
    inventory: InventoryItemDTO[];
}

export interface CombatantDTO {
    id: number;
    available: boolean;
    surges: number;
    resources: number;
    combat: number;
    character: CharacterDTO;
}

export interface CombatDTO {
    id: number;
    round: number;
    campaign: number;
    combatants: CombatantDTO[];
}

export interface DisplayEntryDTO {
    id: number;
    title: string;
    description: string | null;
    pictureUrl: string | null;
    type: "Portrait" | "Background";
    campaign: number;
}

export interface CampaignDetailsDTO {
    campaign: CampaignDTO;
    characters: CharacterDTO[];
    entries: DisplayEntryDTO[];
}

export interface UserDTO {
    id: number;
    name: string;
}

export interface SocketUpdate {
    changeType: ChangeType;
    campaignId: number;
    entityType: EntityType | null;
    dataId: number | null;
    data: unknown | null;
}

export interface AppConfig {
    port: number;
    kankaApiKey: string | null;
    kankaCacheDelaySec: number;
}
