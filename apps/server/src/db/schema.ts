import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  check,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Drizzle schema mirroring the original Exposed tables. Column names, defaults,
 * check constraints, foreign-key cascade behaviour and the case-insensitive
 * condition uniqueness all match the Kotlin definitions so behaviour is identical.
 */

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const campaigns = sqliteTable(
  'campaigns',
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
  'characters',
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
    campaign: integer('campaign')
      .notNull()
      .references(() => campaigns.id),
    user: integer('user')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => [check('characters_minions_check', sql`${t.minions} >= 0`)],
);

export const characterConditions = sqliteTable(
  'character_conditions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    character: integer('character')
      .notNull()
      .references(() => characters.id, {
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
  'inventory_item',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    character: integer('character')
      .notNull()
      .references(() => characters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    quantity: integer('quantity').notNull(),
  },
  (t) => [check('inventory_item_quantity_check', sql`${t.quantity} >= 0`)],
);

export const combats = sqliteTable(
  'combats',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    round: integer('round').notNull().default(1),
    campaign: integer('campaign')
      .notNull()
      .references(() => campaigns.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (t) => [check('combats_round_check', sql`${t.round} >= 1`)],
);

export const combatants = sqliteTable(
  'combatants',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    available: integer('available', { mode: 'boolean' })
      .notNull()
      .default(true),
    surges: integer('surges').notNull().default(0),
    resources: integer('resources').notNull().default(0),
    combat: integer('combat')
      .notNull()
      .references(() => combats.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    character: integer('character')
      .notNull()
      .references(() => characters.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (t) => [
    check('combatants_surges_check', sql`${t.surges} >= 0`),
    check('combatants_resources_check', sql`${t.resources} >= 0`),
  ],
);

export const displayEntry = sqliteTable('display_entry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  pictureUrl: text('picture_url'),
  type: text('type', { enum: ['Portrait', 'Background'] }).notNull(),
  campaign: integer('campaign')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
});

/* ---------------------------------------------------------------- relations */

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  characters: many(characters),
  combats: many(combats),
  entries: many(displayEntry),
}));

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [characters.campaign],
    references: [campaigns.id],
  }),
  user: one(users, { fields: [characters.user], references: [users.id] }),
  conditions: many(characterConditions),
  inventory: many(inventoryItem),
}));

export const characterConditionsRelations = relations(
  characterConditions,
  ({ one }) => ({
    character: one(characters, {
      fields: [characterConditions.character],
      references: [characters.id],
    }),
  }),
);

export const inventoryItemRelations = relations(inventoryItem, ({ one }) => ({
  character: one(characters, {
    fields: [inventoryItem.character],
    references: [characters.id],
  }),
}));

export const combatsRelations = relations(combats, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [combats.campaign],
    references: [campaigns.id],
  }),
  combatants: many(combatants),
}));

export const combatantsRelations = relations(combatants, ({ one }) => ({
  combat: one(combats, {
    fields: [combatants.combat],
    references: [combats.id],
  }),
  character: one(characters, {
    fields: [combatants.character],
    references: [characters.id],
  }),
}));

export const displayEntryRelations = relations(displayEntry, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [displayEntry.campaign],
    references: [campaigns.id],
  }),
}));
