CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`excerpt` text NOT NULL,
	`pubDate` integer,
	`rssFeedId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`rssFeedId`) REFERENCES `rssFeeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `boards` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`editCode` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rssFeedToFeed` (
	`rssFeedId` integer NOT NULL,
	`boardId` integer NOT NULL,
	FOREIGN KEY (`rssFeedId`) REFERENCES `rssFeeds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`boardId`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rssFeeds` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT 'No description' NOT NULL,
	`link` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rssFeeds_link_unique` ON `rssFeeds` (`link`);