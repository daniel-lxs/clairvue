ALTER TABLE "feeds" ALTER COLUMN "description" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "type";