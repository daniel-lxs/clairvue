ALTER TABLE "boards" RENAME COLUMN "editCode" TO "userId";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boards" ADD CONSTRAINT "boards_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
