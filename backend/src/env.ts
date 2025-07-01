import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().optional().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_GPT_MODEL: z.string().optional().default('gpt-4.1'),
  WEATHER_API_KEY: z.string().optional(),
})

export function loadEnv() {
  // Load environment variables from .env files in the root directory
  if (process.env.NODE_ENV === 'test') {
    // For tests, load from root .env.test
    require('dotenv').config({ path: '../.env.test' })
  } else {
    // For development, load from root .env
    require('dotenv').config({ path: '../.env' })
  }
}

// Load environment variables
loadEnv()

export const env = envSchema.parse(process.env)
