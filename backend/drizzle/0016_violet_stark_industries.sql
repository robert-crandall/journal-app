CREATE TABLE "adhoc_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"linked_stat_id" uuid NOT NULL,
	"xp_value" integer DEFAULT 25 NOT NULL,
	"icon_id" text,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "adhoc_task_id" uuid;--> statement-breakpoint
ALTER TABLE "adhoc_tasks" ADD CONSTRAINT "adhoc_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adhoc_tasks" ADD CONSTRAINT "adhoc_tasks_linked_stat_id_stats_id_fk" FOREIGN KEY ("linked_stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_adhoc_task_id_adhoc_tasks_id_fk" FOREIGN KEY ("adhoc_task_id") REFERENCES "public"."adhoc_tasks"("id") ON DELETE set null ON UPDATE no action;