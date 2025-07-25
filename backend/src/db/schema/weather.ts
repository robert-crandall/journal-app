import { pgTable, varchar, integer, boolean, jsonb, date, real, text } from 'drizzle-orm/pg-core';

export const dailyWeather = pgTable('daily_weather', {
  date: date('date').primaryKey(), // '2025-07-25' format
  highTempF: real('high_temp_f').notNull(), // High temperature in Fahrenheit
  probabilityOfPrecipitation: integer('probability_of_precipitation'), // 0-100, can be null
  shortForecast: varchar('short_forecast', { length: 255 }).notNull(), // "Mostly Sunny"
  detailedForecast: text('detailed_forecast').notNull(), // Full detailed forecast text
  rawData: jsonb('raw_data'), // Store full Weather.gov API response for flexibility
});
