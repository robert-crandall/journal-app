ALTER TABLE "levels" RENAME TO "stats";--> statement-breakpoint
ALTER TABLE "stats" RENAME COLUMN "current_level" TO "current_value";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "level_id" TO "stat_id";--> statement-breakpoint
ALTER TABLE "stats" DROP CONSTRAINT "levels_focus_id_focuses_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_level_id_levels_id_fk";
--> statement-breakpoint
ALTER TABLE "stats" ADD CONSTRAINT "stats_focus_id_focuses_id_fk" FOREIGN KEY ("focus_id") REFERENCES "public"."focuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_stat_id_stats_id_fk" FOREIGN KEY ("stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;