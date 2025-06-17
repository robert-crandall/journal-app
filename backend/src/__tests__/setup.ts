// Test setup and utilities
import { beforeAll, afterAll, beforeEach } from 'bun:test';
import { db } from '../db';
import { users, tasks, journalEntries, userContext, userPreferences } from '../db/schema';

// Test database cleanup
export async function cleanupDatabase() {
  try {
    // Delete in reverse order of dependencies
    await db.delete(journalEntries);
    await db.delete(tasks);
    await db.delete(userContext);
    await db.delete(userPreferences);
    await db.delete(users);
  } catch (error) {
    console.error('Database cleanup error:', error);
  }
}

// Test user data
export const testUser = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

export const testUser2 = {
  email: 'test2@example.com',
  password: 'password456',
  firstName: 'Test2',
  lastName: 'User2'
};

// Helper to create authenticated headers
export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Generate a valid UUID for testing non-existent resources
export const nonExistentUUID = '00000000-0000-0000-0000-000000000000';

// Setup test environment
beforeEach(async () => {
  await cleanupDatabase();
});
