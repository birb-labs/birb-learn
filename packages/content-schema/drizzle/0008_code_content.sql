ALTER TABLE `lesson_block_translations` ADD `payload_json` text;--> statement-breakpoint
ALTER TABLE `lesson_blocks` ADD `code_kind` text;--> statement-breakpoint
ALTER TABLE `lesson_blocks` ADD `code_language` text;--> statement-breakpoint
ALTER TABLE `question_translations` ADD `code_json` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `code_kind` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `code_language` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `questions_key_unique` ON `questions` (`key`);