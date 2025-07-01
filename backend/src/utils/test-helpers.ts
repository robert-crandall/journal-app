import * as bcrypt from 'bcrypt'
import { db } from '../db/connection'
import { users } from '../db/schema'

/**
 * Helper function to create a test user with a hashed password
 */
export async function createTestUser(userData: {
  id?: string
  email?: string
  name?: string
  timezone?: string
  zipCode?: string
  password?: string
}) {
  const defaultPassword = userData.password || 'test123'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)
  
  const [user] = await db
    .insert(users)
    .values({
      id: userData.id,
      email: userData.email || `test-${Date.now()}@example.com`,
      name: userData.name || 'Test User',
      password: hashedPassword,
      timezone: userData.timezone || 'UTC',
      zipCode: userData.zipCode,
    })
    .returning()
  
  return { user, password: defaultPassword }
}

/**
 * Helper function to create a test user with minimal data
 */
export async function createMinimalTestUser() {
  return createTestUser({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User'
  })
}

/**
 * Generate a UUID for testing
 */
export function generateTestUUID(): string {
  return crypto.randomUUID()
}
