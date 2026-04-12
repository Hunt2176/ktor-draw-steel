import { firstRow } from "../db";
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
            const row = firstRow<{ campaign: number }>("SELECT campaign FROM Characters WHERE id = ?", id);
            return row?.campaign ?? null;
        }
        case "CharacterConditions": {
            const row = firstRow<{ campaign: number }>(
                "SELECT c.campaign AS campaign FROM CharacterConditions cc JOIN Characters c ON c.id = cc.character WHERE cc.id = ?",
                id,
            );
            return row?.campaign ?? null;
        }
        case "InventoryItem": {
            const row = firstRow<{ campaign: number }>(
                "SELECT c.campaign AS campaign FROM InventoryItem ii JOIN Characters c ON c.id = ii.character WHERE ii.id = ?",
                id,
            );
            return row?.campaign ?? null;
        }
        case "DisplayEntry": {
            const row = firstRow<{ campaign: number }>("SELECT campaign FROM DisplayEntry WHERE id = ?", id);
            return row?.campaign ?? null;
        }
        case "Combats": {
            const row = firstRow<{ campaign: number }>("SELECT campaign FROM Combats WHERE id = ?", id);
            return row?.campaign ?? null;
        }
        case "Combatants": {
            const row = firstRow<{ campaign: number }>(
                "SELECT co.campaign AS campaign FROM Combatants cb JOIN Combats co ON co.id = cb.combat WHERE cb.id = ?",
                id,
            );
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
