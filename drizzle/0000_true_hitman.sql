CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`pubDate` integer,
	`rssFeedId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`rssFeedId`) REFERENCES `rssFeeds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`editCode` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rssFeeds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`link` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rssFeedToFeed` (
	`rssFeedId` text NOT NULL,
	`feedId` text NOT NULL,
	FOREIGN KEY (`rssFeedId`) REFERENCES `rssFeeds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`feedId`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE no action
);
