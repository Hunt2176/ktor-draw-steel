import { eq } from "drizzle-orm";
import { db } from "../db";
import { characterConditions, characters, combatants, combats, displayEntries, inventoryItems } from "../schema";
import type { EntityType } from "../types";
import {
    getCampaignDtoById,
    getCharacterById,
    getCharacterConditionById,
    getCombatantById,
    getCombatById,
    getDisplayEntryById,
    getInventoryItemById,
} from "./readers";

export const entityTypeByTable: Partial<Record<string, EntityType>> = {
    Campaigns: "ExposedCampaign",
    Characters: "ExposedCharacter",
    CharacterConditions: "ExposedCharacterCondition",
    InventoryItem: "ExposedInventoryItem",
    DisplayEntry: "ExposedDisplayEntry",
    Combats: "ExposedCombat",
    Combatants: "ExposedCombatant",
};

export function campaignIdForEntity(table: string, id: number): number | null {
    switch (table) {
        case "Campaigns":
            return id;
        case "Characters": {
            const row = db
                .select({ campaign: characters.campaign })
                .from(characters)
                .where(eq(characters.id, id))
                .get();
            return row?.campaign ?? null;
        }
        case "CharacterConditions": {
            const row = db
                .select({ campaign: characters.campaign })
                .from(characterConditions)
                .innerJoin(characters, eq(characters.id, characterConditions.character))
                .where(eq(characterConditions.id, id))
                .get();
            return row?.campaign ?? null;
        }
        case "InventoryItem": {
            const row = db
                .select({ campaign: characters.campaign })
                .from(inventoryItems)
                .innerJoin(characters, eq(characters.id, inventoryItems.character))
                .where(eq(inventoryItems.id, id))
                .get();
            return row?.campaign ?? null;
        }
        case "DisplayEntry": {
            const row = db
                .select({ campaign: displayEntries.campaign })
                .from(displayEntries)
                .where(eq(displayEntries.id, id))
                .get();
            return row?.campaign ?? null;
        }
        case "Combats": {
            const row = db
                .select({ campaign: combats.campaign })
                .from(combats)
                .where(eq(combats.id, id))
                .get();
            return row?.campaign ?? null;
        }
        case "Combatants": {
            const row = db
                .select({ campaign: combats.campaign })
                .from(combatants)
                .innerJoin(combats, eq(combats.id, combatants.combat))
                .where(eq(combatants.id, id))
                .get();
            return row?.campaign ?? null;
        }
        default:
            return null;
    }
}

export function socketDataForEntity(table: string, id: number): unknown | null {
    switch (table) {
        case "Campaigns":
            return getCampaignDtoById(id);
        case "Characters":
            return getCharacterById(id);
        case "CharacterConditions":
            return getCharacterConditionById(id);
        case "InventoryItem":
            return getInventoryItemById(id);
        case "DisplayEntry":
            return getDisplayEntryById(id);
        case "Combats":
            return getCombatById(id);
        case "Combatants":
            return getCombatantById(id);
        default:
            return null;
    }
}
