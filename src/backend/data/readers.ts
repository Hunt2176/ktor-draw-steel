import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
    campaigns,
    characterConditions,
    characters,
    combatants,
    combats,
    displayEntries,
    inventoryItems,
    users,
} from "../schema";
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
    const row = db
        .select({
            id: campaigns.id,
            name: campaigns.name,
            background: campaigns.background,
            hero_tokens: campaigns.heroTokens,
            kanka_api_id: campaigns.kankaApiId,
        })
        .from(campaigns)
        .where(eq(campaigns.id, id))
        .get();

    return row ?? null;
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
    const rows = db
        .select({
            id: displayEntries.id,
            title: displayEntries.title,
            description: displayEntries.description,
            pictureUrl: displayEntries.pictureUrl,
            type: displayEntries.type,
            campaign: displayEntries.campaign,
        })
        .from(displayEntries)
        .where(eq(displayEntries.campaign, campaignId))
        .orderBy(asc(displayEntries.id))
        .all();

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        pictureUrl: row.pictureUrl,
        type: row.type as "Portrait" | "Background",
        campaign: row.campaign,
    }));
}

export function getDisplayEntryById(id: number): DisplayEntryDTO | null {
    const row = db
        .select({
            id: displayEntries.id,
            title: displayEntries.title,
            description: displayEntries.description,
            pictureUrl: displayEntries.pictureUrl,
            type: displayEntries.type,
            campaign: displayEntries.campaign,
        })
        .from(displayEntries)
        .where(eq(displayEntries.id, id))
        .get();

    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        pictureUrl: row.pictureUrl,
        type: row.type as "Portrait" | "Background",
        campaign: row.campaign,
    };
}

export function getCharacterConditionsByCharacterId(characterId: number): CharacterConditionDTO[] {
    const rows = db
        .select({
            id: characterConditions.id,
            character: characterConditions.character,
            name: characterConditions.name,
            endType: characterConditions.endType,
        })
        .from(characterConditions)
        .where(eq(characterConditions.character, characterId))
        .orderBy(asc(characterConditions.id))
        .all();

    return rows.map((row) => ({
        id: row.id,
        character: row.character,
        name: row.name,
        endType: row.endType as "endOfTurn" | "save",
    }));
}

export function getCharacterConditionById(id: number): CharacterConditionDTO | null {
    const row = db
        .select({
            id: characterConditions.id,
            character: characterConditions.character,
            name: characterConditions.name,
            endType: characterConditions.endType,
        })
        .from(characterConditions)
        .where(eq(characterConditions.id, id))
        .get();

    if (row == null) {
        return null;
    }

    return {
        id: row.id,
        character: row.character,
        name: row.name,
        endType: row.endType as "endOfTurn" | "save",
    };
}

export function getInventoryByCharacterId(characterId: number) {
    const rows = db
        .select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            character: inventoryItems.character,
            quantity: inventoryItems.quantity,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.character, characterId))
        .orderBy(asc(inventoryItems.id))
        .all();

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        characterId: row.character,
        quantity: row.quantity,
    }));
}

export function getInventoryItemById(id: number) {
    const row = db
        .select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            character: inventoryItems.character,
            quantity: inventoryItems.quantity,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, id))
        .get();

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
    const row = db
        .select({
            id: characters.id,
            name: characters.name,
            might: characters.might,
            agility: characters.agility,
            reason: characters.reason,
            intuition: characters.intuition,
            presence: characters.presence,
            removedHp: characters.removedHp,
            maxHp: characters.maxHp,
            temporaryHp: characters.temporaryHp,
            removedRecoveries: characters.removedRecoveries,
            maxRecoveries: characters.maxRecoveries,
            temporaryRecoveries: characters.temporaryRecoveries,
            victories: characters.victories,
            campaign: characters.campaign,
            user: characters.user,
            minions: characters.minions,
            offstage: characters.offstage,
            resourceName: characters.resourceName,
            pictureUrl: characters.pictureUrl,
            border: characters.border,
        })
        .from(characters)
        .where(eq(characters.id, id))
        .get();

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
        removedHp: row.removedHp,
        maxHp: row.maxHp,
        temporaryHp: row.temporaryHp,
        removedRecoveries: row.removedRecoveries,
        maxRecoveries: row.maxRecoveries,
        temporaryRecoveries: row.temporaryRecoveries,
        victories: row.victories,
        campaign: row.campaign,
        user: row.user,
        minions: row.minions,
        offstage: row.offstage !== 0,
        resourceName: row.resourceName,
        pictureUrl: row.pictureUrl,
        border: row.border,
        conditions: getCharacterConditionsByCharacterId(id),
        inventory: getInventoryByCharacterId(id),
    };
}

export function getCharactersByCampaignId(campaignId: number): CharacterDTO[] {
    const ids = db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.campaign, campaignId))
        .orderBy(asc(characters.id))
        .all();

    return ids
        .map((row) => getCharacterById(row.id))
        .filter((item): item is CharacterDTO => item != null);
}

export function getAllCharacters(): CharacterDTO[] {
    const ids = db.select({ id: characters.id }).from(characters).orderBy(asc(characters.id)).all();
    return ids
        .map((row) => getCharacterById(row.id))
        .filter((item): item is CharacterDTO => item != null);
}

export function getCombatantById(id: number): CombatantDTO | null {
    const row = db
        .select({
            id: combatants.id,
            available: combatants.available,
            surges: combatants.surges,
            resources: combatants.resources,
            combat: combatants.combat,
            character: combatants.character,
        })
        .from(combatants)
        .where(eq(combatants.id, id))
        .get();

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
    const rows = db
        .select({ id: combatants.id })
        .from(combatants)
        .where(eq(combatants.combat, combatId))
        .orderBy(asc(combatants.id))
        .all();

    return rows
        .map((row) => getCombatantById(row.id))
        .filter((item): item is CombatantDTO => item != null);
}

export function getCombatById(id: number): CombatDTO | null {
    const row = db
        .select({ id: combats.id, round: combats.round, campaign: combats.campaign })
        .from(combats)
        .where(eq(combats.id, id))
        .get();

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
    const rows = db.select({ id: combats.id }).from(combats).orderBy(asc(combats.id)).all();
    return rows
        .map((row) => getCombatById(row.id))
        .filter((item): item is CombatDTO => item != null);
}

export function getCombatsByCampaignId(campaignId: number): CombatDTO[] {
    const rows = db
        .select({ id: combats.id })
        .from(combats)
        .where(eq(combats.campaign, campaignId))
        .orderBy(asc(combats.id))
        .all();

    return rows
        .map((row) => getCombatById(row.id))
        .filter((item): item is CombatDTO => item != null);
}

export function getCampaignDetails(ids?: number[]): CampaignDetailsDTO[] {
    const campaignRows =
        ids == null
            ? db.select({ id: campaigns.id }).from(campaigns).orderBy(asc(campaigns.id)).all()
            : ids.length === 0
                ? []
                : db
                    .select({ id: campaigns.id })
                    .from(campaigns)
                    .where(inArray(campaigns.id, ids))
                    .orderBy(asc(campaigns.id))
                    .all();

    return campaignRows
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
    const rows = db
        .select({ id: users.id, name: users.name })
        .from(users)
        .orderBy(asc(users.id))
        .all();
    return rows.map((row) => ({ id: row.id, name: row.name }));
}

export function getUserById(id: number): UserDTO | null {
    const row = db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, id))
        .get();

    if (row == null) {
        return null;
    }
    return { id: row.id, name: row.name };
}
