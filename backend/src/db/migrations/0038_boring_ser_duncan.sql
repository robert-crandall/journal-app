CREATE TABLE "weekly_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start_date" date NOT NULL,
	"period_end_date" date NOT NULL,
	"journal_summary" text NOT NULL,
	"journal_tags" jsonb DEFAULT '[]'::jsonb,
	"total_xp_gained" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"xp_by_stats" jsonb DEFAULT '[]'::jsonb,
	"tone_frequency" jsonb DEFAULT '[]'::jsonb,
	"content_tag_frequency" jsonb DEFAULT '[]'::jsonb,
	"alignment_score" integer,
	"aligned_goals" jsonb DEFAULT '[]'::jsonb,
	"neglected_goals" jsonb DEFAULT '[]'::jsonb,
	"suggested_next_steps" jsonb DEFAULT '[]'::jsonb,
	"goal_alignment_summary" text NOT NULL,
	"combined_reflection" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_analyses" ADD CONSTRAINT "weekly_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;