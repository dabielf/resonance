PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_generated_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ghostwriter_id` integer,
	`psy_profile_id` integer,
	`writing_profile_id` integer,
	`persona_id` integer,
	`prompt` text NOT NULL,
	`content` text NOT NULL,
	`user_feedback` text,
	`isTrainingData` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghostwriter_id`) REFERENCES `ghostwriters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`psy_profile_id`) REFERENCES `psy_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`writing_profile_id`) REFERENCES `writing_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_generated_contents`("id", "user_id", "ghostwriter_id", "psy_profile_id", "writing_profile_id", "persona_id", "prompt", "content", "user_feedback", "isTrainingData", "created_at") SELECT "id", "user_id", "ghostwriter_id", "psy_profile_id", "writing_profile_id", "persona_id", "prompt", "content", "user_feedback", "isTrainingData", "created_at" FROM `generated_contents`;--> statement-breakpoint
DROP TABLE `generated_contents`;--> statement-breakpoint
ALTER TABLE `__new_generated_contents` RENAME TO `generated_contents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `generated_content_user_id_idx` ON `generated_contents` (`user_id`);--> statement-breakpoint
CREATE INDEX `generated_content_ghostwriter_id_idx` ON `generated_contents` (`ghostwriter_id`);--> statement-breakpoint
CREATE INDEX `generated_content_training_idx` ON `generated_contents` (`ghostwriter_id`,`isTrainingData`);--> statement-breakpoint
CREATE TABLE `__new_original_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ghostwriter_id` integer,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`ghostwriter_id`) REFERENCES `ghostwriters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_original_contents`("id", "ghostwriter_id", "content", "created_at") SELECT "id", "ghostwriter_id", "content", "created_at" FROM `original_contents`;--> statement-breakpoint
DROP TABLE `original_contents`;--> statement-breakpoint
ALTER TABLE `__new_original_contents` RENAME TO `original_contents`;--> statement-breakpoint
CREATE INDEX `original_content_ghostwriter_id_idx` ON `original_contents` (`ghostwriter_id`);--> statement-breakpoint
ALTER TABLE `ghostwriters` ADD `deleted_at` text;--> statement-breakpoint
CREATE INDEX `ghostwriter_deleted_at_idx` ON `ghostwriters` (`deleted_at`);