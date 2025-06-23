CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`type` text NOT NULL,
	`key` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `api_key_idx` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `api_user_id_idx` ON `api_keys` (`user_id`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`profession` text,
	`interests` text,
	`context` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `phone_idx` ON `contacts` (`phone`);--> statement-breakpoint
CREATE INDEX `contact_user_id_idx` ON `contacts` (`user_id`);--> statement-breakpoint
CREATE TABLE `emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`from_address` text NOT NULL,
	`to_address` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`contact_id` integer NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_contact_id_idx` ON `notes` (`user_id`,`contact_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`description` text,
	`context` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `project_user_id_idx` ON `projects` (`user_id`);--> statement-breakpoint
CREATE TABLE `subtasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer,
	`content` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subtask_task_id_idx` ON `subtasks` (`task_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`content` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `task_project_id_idx` ON `tasks` (`project_id`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`openai_api_key` text,
	`gemini_api_key` text,
	`resend_api_key` text,
	`information` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_settings_idx` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`identity_token` text NOT NULL,
	`encryption_key` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `identity_token_idx` ON `users` (`identity_token`);--> statement-breakpoint
CREATE TABLE `generated_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ghostwriter_id` integer,
	`psy_profile_id` integer NOT NULL,
	`writing_profile_id` integer NOT NULL,
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
CREATE INDEX `generated_content_user_id_idx` ON `generated_contents` (`user_id`);--> statement-breakpoint
CREATE INDEX `generated_content_ghostwriter_id_idx` ON `generated_contents` (`ghostwriter_id`);--> statement-breakpoint
CREATE INDEX `generated_content_training_idx` ON `generated_contents` (`ghostwriter_id`,`isTrainingData`);--> statement-breakpoint
CREATE TABLE `ghostwriters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`avatar_url` text,
	`psy_profile_id` integer,
	`writing_profile_id` integer,
	`psy_profile_rating` integer DEFAULT 50,
	`writing_profile_rating` integer DEFAULT 50,
	`psy_critic` text,
	`human_input_psy_critic` text,
	`writing_critic` text,
	`human_input_writing_critic` text,
	`training_iterations` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ghostwriter_user_id_idx` ON `ghostwriters` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ghostwriter_user_name_idx` ON `ghostwriters` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `gw_psychological_analysis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`psy_profile_id` integer NOT NULL,
	`ghostwriter_id` integer NOT NULL,
	`analysis` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`psy_profile_id`) REFERENCES `psy_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghostwriter_id`) REFERENCES `ghostwriters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `gw_psychological_analysis_user_id_idx` ON `gw_psychological_analysis` (`user_id`);--> statement-breakpoint
CREATE INDEX `gw_psychological_analysis_ghostwriter_id_idx` ON `gw_psychological_analysis` (`ghostwriter_id`);--> statement-breakpoint
CREATE TABLE `gw_writing_analysis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`writing_profile_id` integer NOT NULL,
	`ghostwriter_id` integer NOT NULL,
	`analysis` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`writing_profile_id`) REFERENCES `writing_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghostwriter_id`) REFERENCES `ghostwriters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `gw_writing_analysis_user_id_idx` ON `gw_writing_analysis` (`user_id`);--> statement-breakpoint
CREATE INDEX `gw_writing_analysis_ghostwriter_id_idx` ON `gw_writing_analysis` (`ghostwriter_id`);--> statement-breakpoint
CREATE TABLE `insights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_content_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`persona_id` integer NOT NULL,
	`title` text NOT NULL,
	`raw_content` text NOT NULL,
	`key_points` text NOT NULL,
	`generated_content_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`resource_content_id`) REFERENCES `resource_contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`generated_content_id`) REFERENCES `generated_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `insight_user_id_idx` ON `insights` (`user_id`);--> statement-breakpoint
CREATE INDEX `insight_resource_content_id_idx` ON `insights` (`resource_content_id`);--> statement-breakpoint
CREATE INDEX `insight_persona_id_idx` ON `insights` (`persona_id`);--> statement-breakpoint
CREATE TABLE `original_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ghostwriter_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`ghostwriter_id`) REFERENCES `ghostwriters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `original_content_ghostwriter_id_idx` ON `original_contents` (`ghostwriter_id`);--> statement-breakpoint
CREATE TABLE `personas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `persona_user_id_idx` ON `personas` (`user_id`);--> statement-breakpoint
CREATE TABLE `psy_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ghostwriter_id` integer,
	`name` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`custom` integer DEFAULT false NOT NULL,
	`date_replaced` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghostwriter_id`) REFERENCES `ghostwriters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `psy_profile_user_id_idx` ON `psy_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `psy_profile_ghostwriter_id_idx` ON `psy_profiles` (`ghostwriter_id`);--> statement-breakpoint
CREATE TABLE `resource_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`content` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `resource_content_user_id_idx` ON `resource_contents` (`user_id`);--> statement-breakpoint
CREATE TABLE `writing_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ghostwriter_id` integer,
	`name` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`custom` integer DEFAULT false NOT NULL,
	`date_replaced` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghostwriter_id`) REFERENCES `ghostwriters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `writing_profile_user_id_idx` ON `writing_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `writing_profile_ghostwriter_id_idx` ON `writing_profiles` (`ghostwriter_id`);