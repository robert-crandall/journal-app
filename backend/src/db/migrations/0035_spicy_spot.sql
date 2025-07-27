CREATE TABLE "goal_alignment_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start_date" date NOT NULL,
	"period_end_date" date NOT NULL,
	"alignment_score" integer,
	"aligned_goals" jsonb DEFAULT '[]'::jsonb,
	"neglected_goals" jsonb DEFAULT '[]'::jsonb,
	"suggested_next_steps" jsonb DEFAULT '[]'::jsonb,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_alignment_summaries" ADD CONSTRAINT "goal_alignment_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;