import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

// Load test environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/journal_app_test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Create test database connection
const testClient = postgres(process.env.DATABASE_URL)
export const testDb = drizzle(testClient, { schema })

// Test constants
export const TEST_UUID = '12345678-1234-4567-8901-123456789012'
export const NON_EXISTENT_UUID = '00000000-0000-4000-8000-000000000000'

// Test user data
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}

export const TEST_USER_2 = {
  email: 'test2@example.com',
  password: 'testpassword456',
  name: 'Test User 2'
}

// Helper to create test user and return auth token
export async function createTestUser(userData = TEST_USER) {
  const response = await fetch('http://localhost:3002/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
  
  const result = await response.json()
  return result
}

// Helper to clean database tables
export async function cleanDatabase() {
  await testDb.delete(schema.journalExperiments)
  await testDb.delete(schema.journalCharacterStats)
  await testDb.delete(schema.journalToneTags)
  await testDb.delete(schema.journalContentTags)
  await testDb.delete(schema.journalEntries)
  await testDb.delete(schema.dailyTasks)
  await testDb.delete(schema.experiments)
  await testDb.delete(schema.contentTags)
  await testDb.delete(schema.characterStats)
  await testDb.delete(schema.users)
}

// Mock OpenAI responses
export const mockOpenAIResponses = {
  followUpQuestion: "What specific aspects of your work felt most challenging today?",
  extractedInsights: {
    title: "Productive Day with Morning Focus",
    summary: "Had a really productive morning working on the project. Felt focused and accomplished several key tasks. Afternoon was more scattered due to meetings.",
    synopsis: "Productive morning work, scattered afternoon meetings.",
    contentTags: ["work", "productivity", "meetings"],
    toneTags: ["focused", "accomplished", "scattered"],
    characterTags: ["focus", "productivity"]
  }
}

// Helper to make authenticated requests
export function makeAuthenticatedRequest(token: string) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }
}
