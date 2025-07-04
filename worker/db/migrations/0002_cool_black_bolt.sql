ALTER TABLE `ghostwriters` ADD `base_persona_id` integer;--> statement-breakpoint
CREATE INDEX `ghostwriter_base_persona_id_idx` ON `ghostwriters` (`base_persona_id`);