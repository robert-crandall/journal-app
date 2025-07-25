import { pgTable, varchar, integer, boolean, jsonb, date, real } from 'drizzle-orm/pg-core';

export const dailyWeather = pgTable('daily_weather', {
  date: date('date').primaryKey(), // '2025-07-19' format
  highTempC: real('high_temp_c').notNull(),
  lowTempC: real('low_temp_c').notNull(),
  condition: varchar('condition', { length: 100 }).notNull(), // "Clear", "Rain", "Thunderstorm", etc.
  chanceOfRain: integer('chance_of_rain').notNull(), // 0-100
  isRainExpected: boolean('is_rain_expected').notNull(),
  windSpeedKph: real('wind_speed_kph').notNull(),
  humidityPercent: integer('humidity_percent').notNull(), // 0-100
  rawData: jsonb('raw_data'), // Store full API response for flexibility
});
