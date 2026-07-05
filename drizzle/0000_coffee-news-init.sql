CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`author_member_id` text NOT NULL,
	`edition_number` integer NOT NULL,
	`section` text NOT NULL,
	`title` text NOT NULL,
	`dek` text,
	`body` text NOT NULL,
	`cover_image_url` text,
	`size_hint` text DEFAULT 'normal' NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_member_id`) REFERENCES `room_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `articles_room_edition_idx` ON `articles` (`room_id`,`edition_number`,`archived`);--> statement-breakpoint
CREATE TABLE `room_members` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`display_name` text NOT NULL,
	`emoji` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`secret_code_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `members_room_idx` ON `room_members` (`room_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_room_name_uq` ON `room_members` (`room_id`,`display_name`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`invite_code` text NOT NULL,
	`edition_number` integer DEFAULT 1 NOT NULL,
	`edition_started_at` integer NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`member_soft_limit` integer DEFAULT 50 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_slug_uq` ON `rooms` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_invite_code_uq` ON `rooms` (`invite_code`);--> statement-breakpoint
CREATE TABLE `stamps` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`member_id` text NOT NULL,
	`stamp_type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `room_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stamps_member_type_uq` ON `stamps` (`article_id`,`member_id`,`stamp_type`);--> statement-breakpoint
CREATE INDEX `stamps_article_idx` ON `stamps` (`article_id`);