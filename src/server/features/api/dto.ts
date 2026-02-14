import { eq, inArray } from "drizzle-orm";
import {
    campaigns,
    characterConditions,
    characters,
    combatants,
    combats,
    db,
    displayEntries,
    inventoryItems,
} from "../../db.js";

export function campaignRowToDto(campaign: typeof campaigns.$inferSelect) {
    return {
        id: campaign.id,
        name: campaign.name,
        heroTokens: campaign.heroTokens,
        background: campaign.background,
        kankaApiId: campaign.kankaApiId,
    };
}

export function characterConditionRowToDto(row: typeof characterConditions.$inferSelect) {
    return {
        id: row.id,
        character: row.character,
        name: row.name,
        endType: row.endType,
    };
}

export function inventoryRowToDto(row: typeof inventoryItems.$inferSelect) {
    return {
        id: row.id,
        name: row.name,
        characterId: row.character,
        quantity: row.quantity,
    };
}

export function displayEntryRowToDto(row: typeof displayEntries.$inferSelect) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        pictureUrl: row.pictureUrl,
        type: row.type,
        campaign: row.campaign,
    };
}

export function buildCharacterDtos(rows: (typeof characters.$inferSelect)[]) {
    if (rows.length === 0) {
        return [] as Array<{
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
            conditions: ReturnType<typeof characterConditionRowToDto>[];
            inventory: ReturnType<typeof inventoryRowToDto>[];
        }>;
    }

    const ids = rows.map((row) => row.id);
    const conditions = db.select().from(characterConditions).where(inArray(characterConditions.character, ids)).all();
    const inventory = db.select().from(inventoryItems).where(inArray(inventoryItems.character, ids)).all();

    const byCharConditions = new Map<number, ReturnType<typeof characterConditionRowToDto>[]>();
    for (const condition of conditions) {
        const arr = byCharConditions.get(condition.character) ?? [];
        arr.push(characterConditionRowToDto(condition));
        byCharConditions.set(condition.character, arr);
    }

    const byCharInventory = new Map<number, ReturnType<typeof inventoryRowToDto>[]>();
    for (const item of inventory) {
        const arr = byCharInventory.get(item.character) ?? [];
        arr.push(inventoryRowToDto(item));
        byCharInventory.set(item.character, arr);
    }

    return rows.map((row) => ({
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
        offstage: row.offstage,
        resourceName: row.resourceName,
        pictureUrl: row.pictureUrl,
        border: row.border,
        conditions: byCharConditions.get(row.id) ?? [],
        inventory: byCharInventory.get(row.id) ?? [],
    }));
}

export function getCharacterDtoById(id: number) {
    const row = db.select().from(characters).where(eq(characters.id, id)).get();
    if (!row) {
        return null;
    }

    return buildCharacterDtos([row])[0] ?? null;
}

export function getCombatDtoById(id: number) {
    const combat = db.select().from(combats).where(eq(combats.id, id)).get();
    if (!combat) {
        return null;
    }

    const cbs = db.select().from(combatants).where(eq(combatants.combat, combat.id)).all();
    const characterIds = cbs.map((row) => row.character);
    const characterRows = characterIds.length
        ? db.select().from(characters).where(inArray(characters.id, characterIds)).all()
        : [];

    const dtoCharacters = buildCharacterDtos(characterRows);
    const characterById = new Map<number, (typeof dtoCharacters)[number]>(dtoCharacters.map((row) => [row.id, row]));

    return {
        id: combat.id,
        round: combat.round,
        campaign: combat.campaign,
        combatants: cbs
            .map((cb) => ({
                id: cb.id,
                available: cb.available,
                surges: cb.surges,
                resources: cb.resources,
                combat: cb.combat,
                character: characterById.get(cb.character),
            }))
            .filter((cb) => cb.character != null),
    };
}

export function getCampaignDetails(ids?: number[]) {
    const campaignRows = ids?.length
        ? db.select().from(campaigns).where(inArray(campaigns.id, ids)).all()
        : db.select().from(campaigns).all();

    const campaignIds = campaignRows.map((row) => row.id);
    if (campaignIds.length === 0) {
        return [];
    }

    const charRows = db.select().from(characters).where(inArray(characters.campaign, campaignIds)).all();
    const entryRows = db.select().from(displayEntries).where(inArray(displayEntries.campaign, campaignIds)).all();

    const characterDtos = buildCharacterDtos(charRows);

    const byCampaignCharacters = new Map<number, typeof characterDtos>();
    for (const character of characterDtos) {
        const arr = byCampaignCharacters.get(character.campaign) ?? [];
        arr.push(character);
        byCampaignCharacters.set(character.campaign, arr);
    }

    const byCampaignEntries = new Map<number, ReturnType<typeof displayEntryRowToDto>[]>();
    for (const entry of entryRows) {
        const arr = byCampaignEntries.get(entry.campaign) ?? [];
        arr.push(displayEntryRowToDto(entry));
        byCampaignEntries.set(entry.campaign, arr);
    }

    return campaignRows.map((campaign) => ({
        campaign: campaignRowToDto(campaign),
        characters: byCampaignCharacters.get(campaign.id) ?? [],
        entries: byCampaignEntries.get(campaign.id) ?? [],
    }));
}
