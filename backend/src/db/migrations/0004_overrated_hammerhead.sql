CREATE TABLE "character_stat_level_titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stat_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_stat_xp_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stat_id" uuid NOT NULL,
	"xp_amount" integer NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"example_activities" jsonb DEFAULT '[]'::jsonb,
	"current_level" integer DEFAULT 1 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_stat_level_titles" ADD CONSTRAINT "character_stat_level_titles_stat_id_character_stats_id_fk" FOREIGN KEY ("stat_id") REFERENCES "public"."character_stats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_stat_xp_grants" ADD CONSTRAINT "character_stat_xp_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_stat_xp_grants" ADD CONSTRAINT "character_stat_xp_grants_stat_id_character_stats_id_fk" FOREIGN KEY ("stat_id") REFERENCES "public"."character_stats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_stats" ADD CONSTRAINT "character_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;