CREATE TABLE "xp_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"xp_amount" integer NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "character_stat_xp_grants" CASCADE;--> statement-breakpoint
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;