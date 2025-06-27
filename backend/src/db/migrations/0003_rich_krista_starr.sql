CREATE TABLE "pattern_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"supporting_patterns" jsonb,
	"confidence_score" numeric(3, 2) NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"ai_context" jsonb,
	"priority" varchar(20) DEFAULT 'medium',
	"is_active" boolean DEFAULT true,
	"expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_completion_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"completion_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"event_timestamp" timestamp with time zone NOT NULL,
	"task_source" varchar(50) NOT NULL,
	"task_difficulty" varchar(20),
	"estimated_duration" integer,
	"actual_duration" integer,
	"time_of_day" varchar(20),
	"day_of_week" varchar(10),
	"weather_condition" varchar(50),
	"user_mood" varchar(20),
	"energy_level" varchar(20),
	"previous_task_completion" boolean,
	"xp_awarded" integer DEFAULT 0,
	"feedback_sentiment" numeric(3, 2),
	"feedback_keywords" jsonb,
	"involves_family_member" uuid,
	"family_member_satisfaction" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_completion_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pattern_type" varchar(50) NOT NULL,
	"pattern_key" varchar(100) NOT NULL,
	"pattern_value" jsonb,
	"total_occurrences" integer DEFAULT 0 NOT NULL,
	"successful_completions" integer DEFAULT 0 NOT NULL,
	"failed_completions" integer DEFAULT 0 NOT NULL,
	"average_xp_awarded" numeric(5, 2) DEFAULT '0',
	"average_feedback_sentiment" numeric(3, 2) DEFAULT '0',
	"confidence" numeric(3, 2) DEFAULT '0',
	"strength" varchar(20) DEFAULT 'weak',
	"recommendation" text,
	"should_avoid" boolean DEFAULT false,
	"first_observed" timestamp with time zone DEFAULT now() NOT NULL,
	"last_observed" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pattern_insights" ADD CONSTRAINT "pattern_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completion_events" ADD CONSTRAINT "task_completion_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completion_events" ADD CONSTRAINT "task_completion_events_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completion_events" ADD CONSTRAINT "task_completion_events_completion_id_task_completions_id_fk" FOREIGN KEY ("completion_id") REFERENCES "public"."task_completions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completion_events" ADD CONSTRAINT "task_completion_events_involves_family_member_family_members_id_fk" FOREIGN KEY ("involves_family_member") REFERENCES "public"."family_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completion_patterns" ADD CONSTRAINT "task_completion_patterns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;