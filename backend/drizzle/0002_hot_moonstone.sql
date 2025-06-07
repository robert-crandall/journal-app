ALTER TABLE "stats" DROP CONSTRAINT "stats_focus_id_focuses_id_fk";
--> statement-breakpoint
ALTER TABLE "focuses" ADD COLUMN "stat_id" uuid;--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "emoji" text;--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "stats" ADD COLUMN "value" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "focuses" ADD CONSTRAINT "focuses_stat_id_stats_id_fk" FOREIGN KEY ("stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats" ADD CONSTRAINT "stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats" DROP COLUMN "focus_id";--> statement-breakpoint
ALTER TABLE "stats" DROP COLUMN "current_value";