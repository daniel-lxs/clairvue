CREATE TABLE IF NOT EXISTS "articles" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"rssFeedId" text NOT NULL,
	"description" text,
	"siteName" text,
	"image" text,
	"publishedAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boards" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"editCode" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boardsToRssFeeds" (
	"boardId" varchar(8) NOT NULL,
	"rssFeedId" varchar(8) NOT NULL,
	CONSTRAINT "boardsToRssFeeds_boardId_rssFeedId_pk" PRIMARY KEY("boardId","rssFeedId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rssFeeds" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT 'No description' NOT NULL,
	"link" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rssFeeds_link_unique" UNIQUE("link")
);
