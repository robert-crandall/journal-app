ALTER TABLE "journals" ADD COLUMN "potion_id" uuid;--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN "sentiment_score" integer;--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN "mood_tags" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "potion_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "mood_score" integer;