ALTER TABLE "journal_entries" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "reflected" jsonb DEFAULT 'false'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "started_as_chat" jsonb DEFAULT 'true'::jsonb NOT NULL;