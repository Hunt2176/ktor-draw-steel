import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  check,
  uniqueIndex,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema — a 1:1 port of the original Exposed tables (column names,
 * nullability, defaults, foreign-key cascade rules, and CHECK constraints all
 * preserved) so the SQLite database is shape-compatible with the Ktor version.
 */

export const users = sqliteTable('Users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const campaigns = sqliteTable(
  'Campaigns',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    background: text('background'),
    heroTokens: integer('hero_tokens').notNull().default(0),
    kankaApiId: integer('kanka_api_id'),
  },
  (t) => [check('campaigns_hero_tokens_check', sql`${t.heroTokens} >= 0`)],
);

export const characters = sqliteTable(
  'Characters',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    might: integer('might').notNull().default(0),
    agility: integer('agility').notNull().default(0),
    reason: integer('reason').notNull().default(0),
    intuition: integer('intuition').notNull().default(0),
    presence: integer('presence').notNull().default(0),
    removedHp: integer('removed_hp').notNull().default(0),
    maxHp: integer('max_hp').notNull().default(0),
    temporaryHp: integer('temporary_hp').notNull().default(0),
    removedRecoveries: integer('removed_recoveries').notNull().default(0),
    maxRecoveries: integer('max_recoveries').notNull().default(0),
    temporaryRecoveries: integer('temporary_recoveries').notNull().default(0),
    victories: integer('victories').notNull().default(0),
    minions: integer('minions').notNull().default(0),
    offstage: integer('offstage', { mode: 'boolean' }).notNull().default(false),
    resourceName: text('resource_name'),
    pictureUrl: text('picture_url'),
    border: text('border'),
    // Original: campaign reference has no explicit cascade (RESTRICT).
    campaign: integer('campaign')
      .notNull()
      .references((): AnySQLiteColumn => campaigns.id),
    // Original: user reference cascades on delete/update.
    user: integer('user')
      .notNull()
      .references((): AnySQLiteColumn => users.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (t) => [check('characters_minions_check', sql`${t.minions} >= 0`)],
);

export const characterConditions = sqliteTable(
  'CharacterConditions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    character: integer('character')
      .notNull()
      .references((): AnySQLiteColumn => characters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    name: text('name').notNull(),
    endType: text('end_type', { enum: ['endOfTurn', 'save'] }).notNull(),
  },
  (t) => [
    uniqueIndex('character_condition_name_index').on(t.character, t.name),
  ],
);

export const inventoryItem = sqliteTable(
  'InventoryItem',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    character: integer('character')
      .notNull()
      .references((): AnySQLiteColumn => characters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    quantity: integer('quantity').notNull(),
  },
  (t) => [check('inventory_quantity_check', sql`${t.quantity} >= 0`)],
);

export const combats = sqliteTable(
  'Combats',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    round: integer('round').notNull().default(1),
    campaign: integer('campaign')
      .notNull()
      .references((): AnySQLiteColumn => campaigns.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (t) => [check('combats_round_check', sql`${t.round} >= 1`)],
);

export const combatants = sqliteTable(
  'Combatants',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    available: integer('available', { mode: 'boolean' }).notNull().default(true),
    surges: integer('surges').notNull().default(0),
    resources: integer('resources').notNull().default(0),
    combat: integer('combat')
      .notNull()
      .references((): AnySQLiteColumn => combats.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    character: integer('character')
      .notNull()
      .references((): AnySQLiteColumn => characters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (t) => [
    check('combatants_surges_check', sql`${t.surges} >= 0`),
    check('combatants_resources_check', sql`${t.resources} >= 0`),
  ],
);

export const displayEntry = sqliteTable('DisplayEntry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  pictureUrl: text('picture_url'),
  type: text('type', { enum: ['Portrait', 'Background'] }).notNull(),
  campaign: integer('campaign')
    .notNull()
    .references((): AnySQLiteColumn => campaigns.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
});

export type CharacterRow = typeof characters.$inferSelect;
export type CampaignRow = typeof campaigns.$inferSelect;
export type CombatRow = typeof combats.$inferSelect;
export type CombatantRow = typeof combatants.$inferSelect;
export type CharacterConditionRow = typeof characterConditions.$inferSelect;
export type InventoryItemRow = typeof inventoryItem.$inferSelect;
export type DisplayEntryRow = typeof displayEntry.$inferSelect;
export type UserRow = typeof users.$inferSelect;
