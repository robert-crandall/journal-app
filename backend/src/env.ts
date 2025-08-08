import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().optional().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOW_REGISTRATION: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // File upload settings
  UPLOAD_DIR: z.string().default('./uploads'),
  BASE_URL: z.string().url().default('http://localhost:3001'),

  // OpenAI API settings (optional in development for those not using GPT features)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  GPT_DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Weather API settings - Weather.gov (free, no API key required)
  WEATHER_LAT: z.string().optional(), // Latitude for Weather.gov API
  WEATHER_LON: z.string().optional(), // Longitude for Weather.gov API

  // Legacy OpenWeatherMap settings (kept for backward compatibility)
  OPENWEATHER_API_KEY: z.string().optional(),
  ZIP_CODE: z.string().optional(),
});

export function loadEnv() {
  // Load environment variables from .env files in the parent directory
  if (process.env.NODE_ENV === 'test') {
    // For tests, load from parent .env.test
    require('dotenv').config({ path: '../.env.test', override: true });
  } else {
    // For development, load from parent .env
    require('dotenv').config({ path: '../.env', override: true });
  }
}

// Load environment variables
loadEnv();

export const env = envSchema.parse(process.env);
