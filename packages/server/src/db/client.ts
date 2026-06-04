import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { config } from '../config.js';
import * as schema from './schema.js';

/**
 * SQLite connection + Drizzle handle. Foreign-key enforcement is enabled to
 * match the original (which set `PRAGMA foreign_keys=ON`).
 */
const sqlite: Database.Database = new Database(config.databaseUrl);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });
export { schema, sqlite };

/**
 * Create the tables if they do not yet exist. Mirrors Exposed's
 * `SchemaUtils.create` startup behaviour so a fresh checkout boots with no
 * separate migration step.
 */
export function ensureSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      background TEXT NULL,
      hero_tokens INTEGER NOT NULL DEFAULT 0 CHECK (hero_tokens >= 0),
      kanka_api_id INTEGER NULL
    );

    CREATE TABLE IF NOT EXISTS Characters (
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
      resource_name TEXT NULL,
      picture_url TEXT NULL,
      border TEXT NULL,
      campaign INTEGER NOT NULL REFERENCES Campaigns(id),
      user INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS CharacterConditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character INTEGER NOT NULL REFERENCES Characters(id) ON DELETE CASCADE ON UPDATE CASCADE,
      name TEXT NOT NULL,
      end_type TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS character_condition_name_index
      ON CharacterConditions (character, name);

    CREATE TABLE IF NOT EXISTS InventoryItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      character INTEGER NOT NULL REFERENCES Characters(id) ON DELETE CASCADE ON UPDATE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity >= 0)
    );

    CREATE TABLE IF NOT EXISTS Combats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round INTEGER NOT NULL DEFAULT 1 CHECK (round >= 1),
      campaign INTEGER NOT NULL REFERENCES Campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Combatants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      available INTEGER NOT NULL DEFAULT 1,
      surges INTEGER NOT NULL DEFAULT 0 CHECK (surges >= 0),
      resources INTEGER NOT NULL DEFAULT 0 CHECK (resources >= 0),
      combat INTEGER NOT NULL REFERENCES Combats(id) ON DELETE CASCADE ON UPDATE CASCADE,
      character INTEGER NOT NULL REFERENCES Characters(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS DisplayEntry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NULL,
      picture_url TEXT NULL,
      type TEXT NOT NULL,
      campaign INTEGER NOT NULL REFERENCES Campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
}
