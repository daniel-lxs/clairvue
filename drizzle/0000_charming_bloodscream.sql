CREATE TYPE "public"."type" AS ENUM('rss', 'atom');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"feedId" text NOT NULL,
	"description" text,
	"siteName" text,
	"image" text,
	"author" text,
	"readable" boolean DEFAULT false NOT NULL,
	"publishedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "articles_link_unique" UNIQUE("link")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boards" (
	"id" varchar PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boardsToFeeds" (
	"boardId" varchar NOT NULL,
	"feedId" varchar NOT NULL,
	CONSTRAINT "boardsToFeeds_boardId_feedId_pk" PRIMARY KEY("boardId","feedId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feeds" (
	"id" varchar PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"link" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feeds_link_unique" UNIQUE("link")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"hashedPassword" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boards" ADD CONSTRAINT "boards_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
