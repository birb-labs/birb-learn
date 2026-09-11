CREATE TABLE `lesson_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lesson_id` integer NOT NULL,
	`order` integer NOT NULL,
	`type` text NOT NULL,
	`simulator_key` text,
	`simulator_params` text,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lesson_block_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`block_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text,
	`body_mdx` text,
	`prompt_mdx` text,
	`resolution_mdx` text,
	`caption` text,
	FOREIGN KEY (`block_id`) REFERENCES `lesson_blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_block_translations_block_id_locale_unique` ON `lesson_block_translations` (`block_id`,`locale`);
--> statement-breakpoint
ALTER TABLE `lesson_translations` DROP COLUMN `body_mdx`;
