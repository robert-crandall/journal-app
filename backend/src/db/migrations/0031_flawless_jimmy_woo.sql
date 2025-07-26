CREATE TABLE "metric_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"source_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"avg_day_rating" real,
	"days_logged" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"average_tasks_per_day" real DEFAULT 0 NOT NULL,
	"tone_tag_counts" jsonb DEFAULT '{}'::jsonb,
	"most_common_tone" varchar(50),
	"xp_by_stat" jsonb DEFAULT '{}'::jsonb,
	"log_streak" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metric_summaries" ADD CONSTRAINT "metric_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;