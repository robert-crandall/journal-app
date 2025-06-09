CREATE TYPE "public"."message_role" AS ENUM('user', 'gpt');--> statement-breakpoint
CREATE TABLE "journal_entry_tags" (
	"journal_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"finalized_text" text,
	"title" varchar(255),
	"summary" text,
	"full_summary" text
);
--> statement-breakpoint
CREATE TABLE "journal_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "journal_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "journal_entry_tags" ADD CONSTRAINT "journal_entry_tags_journal_id_journal_sessions_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_tags" ADD CONSTRAINT "journal_entry_tags_tag_id_journal_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."journal_tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_messages" ADD CONSTRAINT "journal_messages_session_id_journal_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."journal_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_sessions" ADD CONSTRAINT "journal_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;