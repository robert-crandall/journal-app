ALTER TABLE "stats" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "stats" DROP COLUMN "system_default";--> statement-breakpoint
ALTER TABLE "stats" DROP COLUMN "value";