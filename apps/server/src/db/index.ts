import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';
import { config } from '../config.js';

/**
 * SQLite connection (better-sqlite3) wired to Drizzle. Tables are created with
 * raw DDL that matches the original Exposed-generated schema exactly — including
 * the case-insensitive (NOCASE) collation on condition names, all CHECK
 * constraints and the foreign-key cascade rules.
 */
const sqlite = new Database(config.databaseUrl);
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  background TEXT NULL,
  hero_tokens INTEGER DEFAULT 0 NOT NULL,
  kanka_api_id INTEGER NULL,
  CONSTRAINT chk_campaigns_hero_tokens CHECK (hero_tokens >= 0)
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  might INTEGER DEFAULT 0 NOT NULL,
  agility INTEGER DEFAULT 0 NOT NULL,
  reason INTEGER DEFAULT 0 NOT NULL,
  intuition INTEGER DEFAULT 0 NOT NULL,
  presence INTEGER DEFAULT 0 NOT NULL,
  removed_hp INTEGER DEFAULT 0 NOT NULL,
  max_hp INTEGER DEFAULT 0 NOT NULL,
  temporary_hp INTEGER DEFAULT 0 NOT NULL,
  removed_recoveries INTEGER DEFAULT 0 NOT NULL,
  max_recoveries INTEGER DEFAULT 0 NOT NULL,
  temporary_recoveries INTEGER DEFAULT 0 NOT NULL,
  victories INTEGER DEFAULT 0 NOT NULL,
  minions INTEGER DEFAULT 0 NOT NULL,
  offstage INTEGER DEFAULT 0 NOT NULL,
  resource_name TEXT NULL,
  picture_url VARCHAR(255) NULL,
  border VARCHAR(255) NULL,
  campaign INTEGER NOT NULL,
  "user" INTEGER NOT NULL,
  CONSTRAINT chk_characters_minions CHECK (minions >= 0),
  CONSTRAINT fk_characters_campaign FOREIGN KEY (campaign) REFERENCES campaigns(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_characters_user FOREIGN KEY ("user") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS character_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character INTEGER NOT NULL,
  name TEXT COLLATE NOCASE NOT NULL,
  end_type VARCHAR(255) NOT NULL,
  CONSTRAINT fk_cc_character FOREIGN KEY (character) REFERENCES characters(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS character_condition_name_index ON character_conditions(character, name);

CREATE TABLE IF NOT EXISTS inventory_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  character INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0),
  CONSTRAINT fk_inv_character FOREIGN KEY (character) REFERENCES characters(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS combats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round INTEGER DEFAULT 1 NOT NULL,
  campaign INTEGER NOT NULL,
  CONSTRAINT chk_combats_round CHECK (round >= 1),
  CONSTRAINT fk_combat_campaign FOREIGN KEY (campaign) REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS combatants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  available INTEGER DEFAULT 1 NOT NULL,
  surges INTEGER DEFAULT 0 NOT NULL,
  resources INTEGER DEFAULT 0 NOT NULL,
  combat INTEGER NOT NULL,
  character INTEGER NOT NULL,
  CONSTRAINT chk_combatants_surges CHECK (surges >= 0),
  CONSTRAINT chk_combatants_resources CHECK (resources >= 0),
  CONSTRAINT fk_combatant_combat FOREIGN KEY (combat) REFERENCES combats(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_combatant_character FOREIGN KEY (character) REFERENCES characters(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS display_entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NULL,
  picture_url TEXT NULL,
  type VARCHAR(255) NOT NULL,
  campaign INTEGER NOT NULL,
  CONSTRAINT fk_de_campaign FOREIGN KEY (campaign) REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE
);
`;

export function initDatabase(): void {
  sqlite.exec(DDL);

  // The original deployment assumes a default user (characters are created with
  // `user: 1`). Seed one so character creation works out of the box.
  const existing = db.select().from(schema.users).all();
  if (existing.length === 0) {
    db.insert(schema.users).values({ name: 'Default' }).run();
  }
}

export { sql };
export * as tables from './schema.js';
