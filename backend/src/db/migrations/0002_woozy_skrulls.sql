CREATE TABLE "external_task_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"task_id" uuid,
	"last_sync_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_task_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"api_endpoint" varchar(500) NOT NULL,
	"auth_type" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"mapping_rules" jsonb NOT NULL,
	"sync_schedule" varchar(100),
	"last_sync_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"error_count" integer DEFAULT 0,
	"last_error" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_task_integrations" ADD CONSTRAINT "external_task_integrations_source_id_external_task_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."external_task_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_task_integrations" ADD CONSTRAINT "external_task_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_task_integrations" ADD CONSTRAINT "external_task_integrations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_task_sources" ADD CONSTRAINT "external_task_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;