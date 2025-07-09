CREATE TABLE "quest_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quest_id" uuid NOT NULL,
	"stat_id" uuid NOT NULL,
	"bonus_xp_amount" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_task_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"stat_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quest_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"xp_amount" integer DEFAULT 5 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_expired" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"bonus_xp_awarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quest_stats" ADD CONSTRAINT "quest_stats_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_stats" ADD CONSTRAINT "quest_stats_stat_id_character_stats_id_fk" FOREIGN KEY ("stat_id") REFERENCES "public"."character_stats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_task_stats" ADD CONSTRAINT "quest_task_stats_task_id_quest_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."quest_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_task_stats" ADD CONSTRAINT "quest_task_stats_stat_id_character_stats_id_fk" FOREIGN KEY ("stat_id") REFERENCES "public"."character_stats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_tasks" ADD CONSTRAINT "quest_tasks_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quest_stats_quest_id_idx" ON "quest_stats" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "quest_stats_stat_id_idx" ON "quest_stats" USING btree ("stat_id");--> statement-breakpoint
CREATE INDEX "quest_task_stats_task_id_idx" ON "quest_task_stats" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "quest_task_stats_stat_id_idx" ON "quest_task_stats" USING btree ("stat_id");--> statement-breakpoint
CREATE INDEX "quest_tasks_quest_id_idx" ON "quest_tasks" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "quest_tasks_order_idx" ON "quest_tasks" USING btree ("quest_id","order");--> statement-breakpoint
CREATE INDEX "quests_user_id_idx" ON "quests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quests_active_idx" ON "quests" USING btree ("is_active");