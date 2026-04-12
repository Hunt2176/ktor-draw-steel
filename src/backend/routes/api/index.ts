import { Hono } from "hono";
import { registerCampaignRoutes } from "./campaigns";
import { registerCharacterRoutes } from "./characters";
import { registerCharacterConditionRoutes } from "./character-conditions";
import { registerInventoryItemRoutes } from "./inventory-items";
import { registerDisplayEntryRoutes } from "./display-entries";
import { registerUserRoutes } from "./users";
import { registerCombatRoutes } from "./combats";
import { registerCombatantRoutes } from "./combatants";

export function createApiRouter(): Hono {
    const api = new Hono();

    registerCampaignRoutes(api);
    registerCharacterRoutes(api);
    registerCharacterConditionRoutes(api);
    registerInventoryItemRoutes(api);
    registerDisplayEntryRoutes(api);
    registerUserRoutes(api);
    registerCombatRoutes(api);
    registerCombatantRoutes(api);

    return api;
}
