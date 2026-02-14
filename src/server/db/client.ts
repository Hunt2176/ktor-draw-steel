import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { schema } from "./schema.js";

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

export const db = drizzle(sqlite, { schema });
