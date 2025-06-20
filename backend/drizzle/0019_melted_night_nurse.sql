ALTER TABLE "family" RENAME COLUMN "description" TO "class_description";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "class_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "class_description" text;