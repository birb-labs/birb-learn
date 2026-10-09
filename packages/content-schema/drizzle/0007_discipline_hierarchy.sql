CREATE TABLE `discipline_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discipline_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`discipline_id`) REFERENCES `disciplines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discipline_translations_discipline_id_locale_unique` ON `discipline_translations` (`discipline_id`,`locale`);--> statement-breakpoint
CREATE TABLE `disciplines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `disciplines_slug_unique` ON `disciplines` (`slug`);--> statement-breakpoint
-- SQLite cannot add a NOT NULL column without a default, so `discipline_id`
-- is nullable at the database level and required by the app layer instead
-- (the same tradeoff made for `tags.subject_id` in 0006).
ALTER TABLE `subjects` ADD `discipline_id` integer REFERENCES disciplines(id);--> statement-breakpoint
-- Backfill: every pre-existing subject (assunto geral) predates the
-- discipline level and is mathematics content, so they all move under a
-- single "Mathematics" discipline. Skipped on an empty database so a fresh
-- install does not ship an empty discipline.
INSERT INTO `disciplines` (`slug`, `order`)
SELECT 'matematica', 1 WHERE EXISTS (SELECT 1 FROM `subjects`);--> statement-breakpoint
INSERT INTO `discipline_translations` (`discipline_id`, `locale`, `name`)
SELECT `id`, 'pt-BR', 'Matemática' FROM `disciplines` WHERE `slug` = 'matematica';--> statement-breakpoint
INSERT INTO `discipline_translations` (`discipline_id`, `locale`, `name`)
SELECT `id`, 'en-US', 'Mathematics' FROM `disciplines` WHERE `slug` = 'matematica';--> statement-breakpoint
INSERT INTO `discipline_translations` (`discipline_id`, `locale`, `name`)
SELECT `id`, 'es', 'Matemáticas' FROM `disciplines` WHERE `slug` = 'matematica';--> statement-breakpoint
UPDATE `subjects` SET `discipline_id` = (SELECT `id` FROM `disciplines` WHERE `slug` = 'matematica') WHERE `discipline_id` IS NULL;