-- Create family table
CREATE TABLE IF NOT EXISTS "family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"age" integer,
	"class_name" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraint for family table
DO $$ BEGIN
 ALTER TABLE "family" ADD CONSTRAINT "family_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Remove old columns from users table first
ALTER TABLE "users" DROP COLUMN IF EXISTS "type";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_family";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "class_name";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "class_description";
--> statement-breakpoint

-- Update attributes table structure
ALTER TABLE "attributes" ADD COLUMN IF NOT EXISTS "entity_type" text;
--> statement-breakpoint
ALTER TABLE "attributes" ADD COLUMN IF NOT EXISTS "entity_id" uuid;
--> statement-breakpoint

-- Set default values for existing attributes (all existing ones are user attributes)
UPDATE "attributes" SET "entity_type" = 'user', "entity_id" = "user_id" WHERE "entity_type" IS NULL;
--> statement-breakpoint

-- Make the new columns not null
ALTER TABLE "attributes" ALTER COLUMN "entity_type" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "attributes" ALTER COLUMN "entity_id" SET NOT NULL;
--> statement-breakpoint

-- Remove old user_id column from attributes
ALTER TABLE "attributes" DROP COLUMN IF EXISTS "user_id";
--> statement-breakpoint

-- Add check constraint for entity_type
ALTER TABLE "attributes" ADD CONSTRAINT IF NOT EXISTS "attributes_entity_type_check" CHECK ("entity_type" IN ('user', 'family'));
--> statement-breakpoint

-- Update tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "family_id" uuid;
--> statement-breakpoint

-- Add foreign key constraint for tasks.family_id
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Remove old linked_family_member_ids column from tasks
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "linked_family_member_ids";