import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll } from 'vitest';
import * as schema from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

// Create test database connection - function to create fresh connections
const testDbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/journal_app';

// Global connection that will be reused across tests in the same file
let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

export function getUniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

/**
 * Returns a test database instance
 * This will always return the same instance used by the test harness
 */
export function getTestDb() {
  if (!testClient || !testDb) {
    testClient = postgres(testDbUrl, {
      // Separate connection pool for each test file
      max: 5,
      idle_timeout: 60000,
      connect_timeout: 10000,
      transform: postgres.camel,
      // Add unique connection id to prevent conflicts
      connection: {
        application_name: `test_${process.pid}_${Date.now()}`,
      },
    });
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}

// Cleanup after all tests - only close connection once at the very end
afterAll(async () => {
  // Close the connection with a longer delay to ensure all queries are complete
  if (testClient) {
    setTimeout(async () => {
      try {
        await testClient!.end();
        testClient = null;
        testDb = null;
      } catch (error) {
        // Ignore connection close errors
      }
    }, 500);
  }
});

export { schema };

// Export the connection for direct use in tests
export { getTestDb as testDb };
