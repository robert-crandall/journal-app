ALTER TABLE "daily_weather" ADD COLUMN "high_temp_f" real NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_weather" ADD COLUMN "probability_of_precipitation" integer;--> statement-breakpoint
ALTER TABLE "daily_weather" ADD COLUMN "short_forecast" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_weather" ADD COLUMN "detailed_forecast" text NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_weather" DROP COLUMN "high_temp_c";--> statement-breakpoint
ALTER TABLE "daily_weather" DROP COLUMN "low_temp_c";--> statement-breakpoint
ALTER TABLE "daily_weather" DROP COLUMN "condition";--> statement-breakpoint
ALTER TABLE "daily_weather" DROP COLUMN "chance_of_rain";--> statement-breakpoint
ALTER TABLE "daily_weather" DROP COLUMN "is_rain_expected";--> statement-breakpoint
ALTER TABLE "daily_weather" DROP COLUMN "wind_speed_kph";--> statement-breakpoint
ALTER TABLE "daily_weather" DROP COLUMN "humidity_percent";