ALTER TABLE "tags" ADD COLUMN "source" varchar(20) DEFAULT 'discovered' NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "times_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "status" varchar(20) DEFAULT 'active' NOT NULL;