ALTER TABLE "family_members" ALTER COLUMN "energy_level" SET DATA TYPE integer USING CASE WHEN energy_level ~ '^[0-9]+$' THEN energy_level::integer ELSE 50 END;--> statement-breakpoint
ALTER TABLE "family_members" ALTER COLUMN "energy_level" SET DEFAULT 50;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "connection_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "family_members" ADD COLUMN "connection_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "family_task_feedback" ADD COLUMN "xp_granted" integer;