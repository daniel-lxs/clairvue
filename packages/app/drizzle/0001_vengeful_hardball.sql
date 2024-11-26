ALTER TABLE "collectionsToFeeds" ADD COLUMN "userId" varchar NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "collectionsToFeeds" ADD CONSTRAINT "collectionsToFeeds_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
