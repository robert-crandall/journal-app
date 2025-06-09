ALTER TABLE "focuses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "focuses" CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_focus_id_focuses_id_fk";
--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "day_of_week" text;--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "sample_tasks" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "focus_id";