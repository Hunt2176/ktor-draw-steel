import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
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

const sqlite = new Database("draw_steel.sqlite", { create: true });
sqlite.exec("PRAGMA foreign_keys = ON");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  background TEXT,
  hero_tokens INTEGER NOT NULL DEFAULT 0 CHECK (hero_tokens >= 0),
  kanka_api_id INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  might INTEGER NOT NULL DEFAULT 0,
  agility INTEGER NOT NULL DEFAULT 0,
  reason INTEGER NOT NULL DEFAULT 0,
  intuition INTEGER NOT NULL DEFAULT 0,
  presence INTEGER NOT NULL DEFAULT 0,
  removed_hp INTEGER NOT NULL DEFAULT 0,
  max_hp INTEGER NOT NULL DEFAULT 0,
  temporary_hp INTEGER NOT NULL DEFAULT 0,
  removed_recoveries INTEGER NOT NULL DEFAULT 0,
  max_recoveries INTEGER NOT NULL DEFAULT 0,
  temporary_recoveries INTEGER NOT NULL DEFAULT 0,
  victories INTEGER NOT NULL DEFAULT 0,
  minions INTEGER NOT NULL DEFAULT 0 CHECK (minions >= 0),
  offstage INTEGER NOT NULL DEFAULT 0,
  resource_name TEXT,
  picture_url TEXT,
  border TEXT,
  campaign INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS character_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name TEXT NOT NULL COLLATE NOCASE,
  end_type TEXT NOT NULL CHECK(end_type in ('endOfTurn', 'save')),
  UNIQUE(character, name)
);

CREATE TABLE IF NOT EXISTS inventory_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  character INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE ON UPDATE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0)
);

CREATE TABLE IF NOT EXISTS display_entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  picture_url TEXT,
  type TEXT NOT NULL CHECK(type in ('Portrait', 'Background')),
  campaign INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS combats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round INTEGER NOT NULL DEFAULT 1 CHECK(round >= 1),
  campaign INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS combatants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  available INTEGER NOT NULL DEFAULT 1,
  surges INTEGER NOT NULL DEFAULT 0 CHECK(surges >= 0),
  resources INTEGER NOT NULL DEFAULT 0 CHECK(resources >= 0),
  combat INTEGER NOT NULL REFERENCES combats(id) ON DELETE CASCADE ON UPDATE CASCADE,
  character INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE ON UPDATE CASCADE
);
`);

sqlite.exec(`
INSERT INTO users (name)
SELECT 'Default User'
WHERE NOT EXISTS (SELECT 1 FROM users);
`);

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

export const db = drizzle(sqlite, { schema });
