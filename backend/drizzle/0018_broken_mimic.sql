CREATE TABLE "family" (
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
ALTER TABLE "attributes" DROP CONSTRAINT "attributes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "attributes" ADD COLUMN "entity_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attributes" ADD COLUMN "entity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "family_id" uuid;--> statement-breakpoint
ALTER TABLE "family" ADD CONSTRAINT "family_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributes" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "linked_family_member_ids";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_family";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "class_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "class_description";