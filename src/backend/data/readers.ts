import { allRows, firstRow } from "../db";
import type {
    CampaignDTO,
    CampaignDetailsDTO,
    CharacterConditionDTO,
    CharacterDTO,
    CombatantDTO,
    CombatDTO,
    DisplayEntryDTO,
    UserDTO,
} from "../types";

export function readCampaignRow(id: number): {
    id: number;
    name: string;
    background: string | null;
    hero_tokens: number;
    kanka_api_id: number | null;
} | null {
    return firstRow(
        "SELECT id, name, background, hero_tokens, kanka_api_id FROM Campaigns WHERE id = ?",
        id,
    );
}

export function getCampaignDtoById(id: number): CampaignDTO | null {
    const row = readCampaignRow(id);
    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        heroTokens: row.hero_tokens,
        background: row.background,
        kankaApiId: row.kanka_api_id,
    };
}

export function getDisplayEntriesByCampaignId(campaignId: number): DisplayEntryDTO[] {
    const rows = allRows<{
        id: number;
        title: string;
        description: string | null;
        picture_url: string | null;
        type: "Portrait" | "Background";
        campaign: number;
    }>(
        "SELECT id, title, description, picture_url, type, campaign FROM DisplayEntry WHERE campaign = ? ORDER BY id",
        campaignId,
    );

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        pictureUrl: row.picture_url,
        type: row.type,
        campaign: row.campaign,
    }));
}

export function getDisplayEntryById(id: number): DisplayEntryDTO | null {
    const row = firstRow<{
        id: number;
        title: string;
        description: string | null;
        picture_url: string | null;
        type: "Portrait" | "Background";
        campaign: number;
    }>(
        "SELECT id, title, description, picture_url, type, campaign FROM DisplayEntry WHERE id = ?",
        id,
    );

    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        pictureUrl: row.picture_url,
        type: row.type,
        campaign: row.campaign,
    };
}

export function getCharacterConditionsByCharacterId(characterId: number): CharacterConditionDTO[] {
    const rows = allRows<{
        id: number;
        character: number;
        name: string;
        end_type: "endOfTurn" | "save";
    }>(
        "SELECT id, character, name, end_type FROM CharacterConditions WHERE character = ? ORDER BY id",
        characterId,
    );

    return rows.map((row) => ({
        id: row.id,
        character: row.character,
        name: row.name,
        endType: row.end_type,
    }));
}

export function getCharacterConditionById(id: number): CharacterConditionDTO | null {
    const row = firstRow<{
        id: number;
        character: number;
        name: string;
        end_type: "endOfTurn" | "save";
    }>(
        "SELECT id, character, name, end_type FROM CharacterConditions WHERE id = ?",
        id,
    );

    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        character: row.character,
        name: row.name,
        endType: row.end_type,
    };
}

export function getInventoryByCharacterId(characterId: number) {
    const rows = allRows<{
        id: number;
        name: string;
        character: number;
        quantity: number;
    }>(
        "SELECT id, name, character, quantity FROM InventoryItem WHERE character = ? ORDER BY id",
        characterId,
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        characterId: row.character,
        quantity: row.quantity,
    }));
}

export function getInventoryItemById(id: number) {
    const row = firstRow<{
        id: number;
        name: string;
        character: number;
        quantity: number;
    }>(
        "SELECT id, name, character, quantity FROM InventoryItem WHERE id = ?",
        id,
    );

    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        characterId: row.character,
        quantity: row.quantity,
    };
}

export function getCharacterById(id: number): CharacterDTO | null {
    const row = firstRow<{
        id: number;
        name: string;
        might: number;
        agility: number;
        reason: number;
        intuition: number;
        presence: number;
        removed_hp: number;
        max_hp: number;
        temporary_hp: number;
        removed_recoveries: number;
        max_recoveries: number;
        temporary_recoveries: number;
        victories: number;
        campaign: number;
        user: number;
        minions: number;
        offstage: number;
        resource_name: string | null;
        picture_url: string | null;
        border: string | null;
    }>(
        "SELECT id, name, might, agility, reason, intuition, presence, removed_hp, max_hp, temporary_hp, removed_recoveries, max_recoveries, temporary_recoveries, victories, campaign, user, minions, offstage, resource_name, picture_url, border FROM Characters WHERE id = ?",
        id,
    );

    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        might: row.might,
        agility: row.agility,
        reason: row.reason,
        intuition: row.intuition,
        presence: row.presence,
        removedHp: row.removed_hp,
        maxHp: row.max_hp,
        temporaryHp: row.temporary_hp,
        removedRecoveries: row.removed_recoveries,
        maxRecoveries: row.max_recoveries,
        temporaryRecoveries: row.temporary_recoveries,
        victories: row.victories,
        campaign: row.campaign,
        user: row.user,
        minions: row.minions,
        offstage: row.offstage !== 0,
        resourceName: row.resource_name,
        pictureUrl: row.picture_url,
        border: row.border,
        conditions: getCharacterConditionsByCharacterId(id),
        inventory: getInventoryByCharacterId(id),
    };
}

export function getCharactersByCampaignId(campaignId: number): CharacterDTO[] {
    const ids = allRows<{ id: number }>(
        "SELECT id FROM Characters WHERE campaign = ? ORDER BY id",
        campaignId,
    );

    return ids
        .map((row) => getCharacterById(row.id))
        .filter((item): item is CharacterDTO => item != null);
}

export function getAllCharacters(): CharacterDTO[] {
    const ids = allRows<{ id: number }>("SELECT id FROM Characters ORDER BY id");
    return ids
        .map((row) => getCharacterById(row.id))
        .filter((item): item is CharacterDTO => item != null);
}

export function getCombatantById(id: number): CombatantDTO | null {
    const row = firstRow<{
        id: number;
        available: number;
        surges: number;
        resources: number;
        combat: number;
        character: number;
    }>(
        "SELECT id, available, surges, resources, combat, character FROM Combatants WHERE id = ?",
        id,
    );

    if (row == null) {
        return null;
    }

    const character = getCharacterById(row.character);
    if (character == null) {
        return null;
    }

    return {
        id: row.id,
        available: row.available !== 0,
        surges: row.surges,
        resources: row.resources,
        combat: row.combat,
        character,
    };
}

export function getCombatantsForCombat(combatId: number): CombatantDTO[] {
    const rows = allRows<{ id: number }>(
        "SELECT id FROM Combatants WHERE combat = ? ORDER BY id",
        combatId,
    );

    return rows
        .map((row) => getCombatantById(row.id))
        .filter((item): item is CombatantDTO => item != null);
}

export function getCombatById(id: number): CombatDTO | null {
    const row = firstRow<{
        id: number;
        round: number;
        campaign: number;
    }>("SELECT id, round, campaign FROM Combats WHERE id = ?", id);

    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        round: row.round,
        campaign: row.campaign,
        combatants: getCombatantsForCombat(row.id),
    };
}

export function getAllCombats(): CombatDTO[] {
    const rows = allRows<{ id: number }>("SELECT id FROM Combats ORDER BY id");
    return rows
        .map((row) => getCombatById(row.id))
        .filter((item): item is CombatDTO => item != null);
}

export function getCombatsByCampaignId(campaignId: number): CombatDTO[] {
    const rows = allRows<{ id: number }>(
        "SELECT id FROM Combats WHERE campaign = ? ORDER BY id",
        campaignId,
    );

    return rows
        .map((row) => getCombatById(row.id))
        .filter((item): item is CombatDTO => item != null);
}

export function getCampaignDetails(ids?: number[]): CampaignDetailsDTO[] {
    const campaigns =
        ids == null || ids.length === 0
            ? allRows<{ id: number }>("SELECT id FROM Campaigns ORDER BY id")
            : allRows<{ id: number }>(
                `SELECT id FROM Campaigns WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
                ...ids,
            );

    return campaigns
        .map((row) => {
            const campaign = getCampaignDtoById(row.id);
            if (campaign == null) {
                return null;
            }

            return {
                campaign,
                characters: getCharactersByCampaignId(row.id),
                entries: getDisplayEntriesByCampaignId(row.id),
            };
        })
        .filter((item): item is CampaignDetailsDTO => item != null);
}

export function getUsers(): UserDTO[] {
    const rows = allRows<{ id: number; name: string }>("SELECT id, name FROM Users ORDER BY id");
    return rows.map((row) => ({ id: row.id, name: row.name }));
}

export function getUserById(id: number): UserDTO | null {
    const row = firstRow<{ id: number; name: string }>("SELECT id, name FROM Users WHERE id = ?", id);
    if (row == null) {
        return null;
    }
    return { id: row.id, name: row.name };
}
