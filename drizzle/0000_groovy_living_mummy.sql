CREATE TABLE IF NOT EXISTS `Campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`background` text,
	`hero_tokens` integer DEFAULT 0 NOT NULL,
	`kanka_api_id` integer,
	CONSTRAINT "campaign_hero_tokens_non_negative" CHECK("Campaigns"."hero_tokens" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `CharacterConditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character` integer NOT NULL,
	`name` text NOT NULL,
	`end_type` text NOT NULL,
	FOREIGN KEY (`character`) REFERENCES `Characters`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "character_conditions_end_type_check" CHECK("CharacterConditions"."end_type" in ('endOfTurn', 'save'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `character_condition_name_index` ON `CharacterConditions` (`character`,`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`might` integer DEFAULT 0 NOT NULL,
	`agility` integer DEFAULT 0 NOT NULL,
	`reason` integer DEFAULT 0 NOT NULL,
	`intuition` integer DEFAULT 0 NOT NULL,
	`presence` integer DEFAULT 0 NOT NULL,
	`removed_hp` integer DEFAULT 0 NOT NULL,
	`max_hp` integer DEFAULT 0 NOT NULL,
	`temporary_hp` integer DEFAULT 0 NOT NULL,
	`removed_recoveries` integer DEFAULT 0 NOT NULL,
	`max_recoveries` integer DEFAULT 0 NOT NULL,
	`temporary_recoveries` integer DEFAULT 0 NOT NULL,
	`victories` integer DEFAULT 0 NOT NULL,
	`minions` integer DEFAULT 0 NOT NULL,
	`offstage` integer DEFAULT 0 NOT NULL,
	`resource_name` text,
	`picture_url` text,
	`border` text,
	`campaign` integer NOT NULL,
	`user` integer NOT NULL,
	FOREIGN KEY (`campaign`) REFERENCES `Campaigns`(`id`) ON UPDATE restrict ON DELETE restrict,
	FOREIGN KEY (`user`) REFERENCES `Users`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "character_minions_non_negative" CHECK("Characters"."minions" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Combatants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`available` integer DEFAULT 1 NOT NULL,
	`surges` integer DEFAULT 0 NOT NULL,
	`resources` integer DEFAULT 0 NOT NULL,
	`combat` integer NOT NULL,
	`character` integer NOT NULL,
	FOREIGN KEY (`combat`) REFERENCES `Combats`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`character`) REFERENCES `Characters`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "combatants_surges_non_negative" CHECK("Combatants"."surges" >= 0),
	CONSTRAINT "combatants_resources_non_negative" CHECK("Combatants"."resources" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Combats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`round` integer DEFAULT 1 NOT NULL,
	`campaign` integer NOT NULL,
	FOREIGN KEY (`campaign`) REFERENCES `Campaigns`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "combat_round_minimum" CHECK("Combats"."round" >= 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `DisplayEntry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`picture_url` text,
	`type` text NOT NULL,
	`campaign` integer NOT NULL,
	FOREIGN KEY (`campaign`) REFERENCES `Campaigns`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "display_entry_type_check" CHECK("DisplayEntry"."type" in ('Portrait', 'Background'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `InventoryItem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`character` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`character`) REFERENCES `Characters`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "inventory_quantity_non_negative" CHECK("InventoryItem"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
