ALTER TABLE "tasks" DROP CONSTRAINT "tasks_family_member_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN "day_memory" text;--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN "day_rating" integer;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "family_member_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "completion_summary";