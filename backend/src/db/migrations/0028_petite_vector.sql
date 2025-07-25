CREATE TABLE "daily_weather" (
	"date" date PRIMARY KEY NOT NULL,
	"high_temp_c" real NOT NULL,
	"low_temp_c" real NOT NULL,
	"condition" varchar(100) NOT NULL,
	"chance_of_rain" integer NOT NULL,
	"is_rain_expected" boolean NOT NULL,
	"wind_speed_kph" real NOT NULL,
	"humidity_percent" integer NOT NULL,
	"raw_data" jsonb
);
