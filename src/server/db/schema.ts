import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const campaigns = sqliteTable("campaigns", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    background: text("background"),
    heroTokens: integer("hero_tokens").notNull().default(0),
    kankaApiId: integer("kanka_api_id"),
});

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
});

export const characters = sqliteTable("characters", {
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
    offstage: integer("offstage", { mode: "boolean" }).notNull().default(false),
    resourceName: text("resource_name"),
    pictureUrl: text("picture_url"),
    border: text("border"),
    campaign: integer("campaign")
        .notNull()
        .references(() => campaigns.id, { onDelete: "cascade", onUpdate: "cascade" }),
    user: integer("user")
        .notNull()
        .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const characterConditions = sqliteTable(
    "character_conditions",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        character: integer("character")
            .notNull()
            .references(() => characters.id, { onDelete: "cascade", onUpdate: "cascade" }),
        name: text("name").notNull(),
        endType: text("end_type", { enum: ["endOfTurn", "save"] }).notNull(),
    },
    (table) => ({
        uniqueCharacterName: uniqueIndex("character_condition_name_index").on(table.character, table.name),
    }),
);

export const inventoryItems = sqliteTable("inventory_item", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    character: integer("character")
        .notNull()
        .references(() => characters.id, { onDelete: "cascade", onUpdate: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
});

export const displayEntries = sqliteTable("display_entry", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    pictureUrl: text("picture_url"),
    type: text("type", { enum: ["Portrait", "Background"] }).notNull(),
    campaign: integer("campaign")
        .notNull()
        .references(() => campaigns.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const combats = sqliteTable("combats", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    round: integer("round").notNull().default(1),
    campaign: integer("campaign")
        .notNull()
        .references(() => campaigns.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const combatants = sqliteTable("combatants", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    available: integer("available", { mode: "boolean" }).notNull().default(true),
    surges: integer("surges").notNull().default(0),
    resources: integer("resources").notNull().default(0),
    combat: integer("combat")
        .notNull()
        .references(() => combats.id, { onDelete: "cascade", onUpdate: "cascade" }),
    character: integer("character")
        .notNull()
        .references(() => characters.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const schema = {
    campaigns,
    users,
    characters,
    characterConditions,
    inventoryItems,
    displayEntries,
    combats,
    combatants,
};
