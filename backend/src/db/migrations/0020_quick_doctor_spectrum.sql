CREATE TABLE "journals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"initial_message" text,
	"chat_session" jsonb,
	"summary" text,
	"title" text,
	"synopsis" text,
	"tone_tags" varchar(1000),
	"content_tags" varchar(1000),
	"stat_tags" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "journal_conversation_messages" CASCADE;--> statement-breakpoint
DROP TABLE "journal_entries" CASCADE;--> statement-breakpoint
DROP TABLE "journal_entry_stat_tags" CASCADE;--> statement-breakpoint
DROP TABLE "journal_entry_tags" CASCADE;--> statement-breakpoint
DROP TABLE "journal_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;