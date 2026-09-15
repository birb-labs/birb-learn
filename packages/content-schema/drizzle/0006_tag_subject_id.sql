ALTER TABLE `tags` ADD `subject_id` integer REFERENCES subjects(id);--> statement-breakpoint
UPDATE `tags` SET `subject_id` = (SELECT `id` FROM `subjects` ORDER BY `id` LIMIT 1) WHERE `subject_id` IS NULL;
