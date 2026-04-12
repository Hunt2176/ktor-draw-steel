import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("Users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
});

export const campaigns = sqliteTable(
    "Campaigns",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        name: text("name").notNull(),
        background: text("background"),
        heroTokens: integer("hero_tokens").notNull().default(0),
        kankaApiId: integer("kanka_api_id"),
    },
    (table) => [check("campaign_hero_tokens_non_negative", sql`${table.heroTokens} >= 0`)],
);

export const characters = sqliteTable(
    "Characters",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        name: text("name").notNull(),
        might: integer("might").notNull().default(0),
        agility: integer("agility").notNull().default(0),
        reason: integer("reason").notNull().default(0),
        intuition: integer("intuition").notNull().default(0),
        presence: integer("presence").notNull().default(0),
        removedHp: integer("removed_hp").notNull().default(0),
        maxHp: integer("max_hp").notNull().default(0),
        temporaryHp: integer("temporary_hp").notNull().default(0),
        removedRecoveries: integer("removed_recoveries").notNull().default(0),
        maxRecoveries: integer("max_recoveries").notNull().default(0),
        temporaryRecoveries: integer("temporary_recoveries").notNull().default(0),
        victories: integer("victories").notNull().default(0),
        minions: integer("minions").notNull().default(0),
        offstage: integer("offstage").notNull().default(0),
        resourceName: text("resource_name"),
        pictureUrl: text("picture_url"),
        border: text("border"),
        campaign: integer("campaign")
            .notNull()
            .references(() => campaigns.id, { onDelete: "restrict", onUpdate: "restrict" }),
        user: integer("user")
            .notNull()
            .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [check("character_minions_non_negative", sql`${table.minions} >= 0`)],
);

export const characterConditions = sqliteTable(
    "CharacterConditions",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        character: integer("character")
            .notNull()
            .references(() => characters.id, { onDelete: "cascade", onUpdate: "cascade" }),
        name: text("name").notNull(),
        endType: text("end_type").notNull(),
    },
    (table) => [
        uniqueIndex("character_condition_name_index").on(table.character, table.name),
        check("character_conditions_end_type_check", sql`${table.endType} in ('endOfTurn', 'save')`),
    ],
);

export const inventoryItems = sqliteTable(
    "InventoryItem",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        name: text("name").notNull(),
        character: integer("character")
            .notNull()
            .references(() => characters.id, { onDelete: "cascade", onUpdate: "cascade" }),
        quantity: integer("quantity").notNull(),
    },
    (table) => [check("inventory_quantity_non_negative", sql`${table.quantity} >= 0`)],
);

export const displayEntries = sqliteTable(
    "DisplayEntry",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        title: text("title").notNull(),
        description: text("description"),
        pictureUrl: text("picture_url"),
        type: text("type").notNull(),
        campaign: integer("campaign")
            .notNull()
            .references(() => campaigns.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [check("display_entry_type_check", sql`${table.type} in ('Portrait', 'Background')`)],
);

export const combats = sqliteTable(
    "Combats",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        round: integer("round").notNull().default(1),
        campaign: integer("campaign")
            .notNull()
            .references(() => campaigns.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [check("combat_round_minimum", sql`${table.round} >= 1`)],
);

export const combatants = sqliteTable(
    "Combatants",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        available: integer("available").notNull().default(1),
        surges: integer("surges").notNull().default(0),
        resources: integer("resources").notNull().default(0),
        combat: integer("combat")
            .notNull()
            .references(() => combats.id, { onDelete: "cascade", onUpdate: "cascade" }),
        character: integer("character")
            .notNull()
            .references(() => characters.id, { onDelete: "cascade", onUpdate: "cascade" }),
    },
    (table) => [
        check("combatants_surges_non_negative", sql`${table.surges} >= 0`),
        check("combatants_resources_non_negative", sql`${table.resources} >= 0`),
    ],
);
