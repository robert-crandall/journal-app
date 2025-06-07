ALTER TABLE "tasks" ADD COLUMN "task_date" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "linked_stat_ids" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "linked_family_member_ids" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "emotion_tag" text;