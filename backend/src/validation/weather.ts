import { z } from 'zod';

export const getWeatherSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((dateString) => {
      const date = new Date(dateString + 'T00:00:00.000Z');
      const [year, month, day] = dateString.split('-').map(Number);
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }, 'Invalid date')
    .optional(),
});

export const weatherResponseSchema = z.object({
  date: z.string(),
  highTempC: z.number(),
  lowTempC: z.number(),
  condition: z.string(),
  chanceOfRain: z.number().min(0).max(100),
  isRainExpected: z.boolean(),
  windSpeedKph: z.number(),
  humidityPercent: z.number().min(0).max(100),
});

// Schema for validating OpenWeatherMap API response
export const openWeatherMapResponseSchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  weather: z.array(
    z.object({
      id: z.number(),
      main: z.string(),
      description: z.string(),
      icon: z.string(),
    }),
  ),
  base: z.string(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    pressure: z.number(),
    humidity: z.number(),
  }),
  visibility: z.number(),
  wind: z.object({
    speed: z.number(),
    deg: z.number(),
  }),
  clouds: z.object({
    all: z.number(),
  }),
  dt: z.number(),
  sys: z.object({
    type: z.number(),
    id: z.number(),
    country: z.string(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
  timezone: z.number(),
  id: z.number(),
  name: z.string(),
  cod: z.number(),
});
