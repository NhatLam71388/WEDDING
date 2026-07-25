CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "messages_name_length_check" CHECK(length("messages"."name") between 1 and 60),
	CONSTRAINT "messages_body_length_check" CHECK(length("messages"."body") between 1 and 400),
	CONSTRAINT "messages_ip_hash_length_check" CHECK(length("messages"."ip_hash") = 64)
);
--> statement-breakpoint
CREATE INDEX `messages_visible_created_idx` ON `messages` (`is_visible`,`created_at`);--> statement-breakpoint
CREATE INDEX `messages_ip_created_idx` ON `messages` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `rsvps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`guest_count` integer NOT NULL,
	`attend` text NOT NULL,
	`side` text NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "rsvps_name_length_check" CHECK(length("rsvps"."name") between 1 and 60),
	CONSTRAINT "rsvps_count_check" CHECK("rsvps"."guest_count" between 0 and 20),
	CONSTRAINT "rsvps_attend_check" CHECK("rsvps"."attend" in ('yes', 'no')),
	CONSTRAINT "rsvps_side_check" CHECK("rsvps"."side" in ('groom', 'bride')),
	CONSTRAINT "rsvps_ip_hash_length_check" CHECK(length("rsvps"."ip_hash") = 64)
);
--> statement-breakpoint
CREATE INDEX `rsvps_ip_created_idx` ON `rsvps` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `rsvps_created_idx` ON `rsvps` (`created_at`);