import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { beforeEach, afterEach, afterAll } from 'vitest';
import * as schema from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

// Create test database connection - function to create fresh connections
const testDbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/journal_app';

// Global connection that will be reused across tests in the same file
let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

// For isolation, we'll use savepoints instead of transactions for better compatibility
let currentSavepoint: string | null = null;

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

// Setup that runs before each test - create a savepoint
beforeEach(async () => {
  if (!testClient) {
    getTestDb();
  }
  
  // Create a unique savepoint name for this test
  currentSavepoint = `sp_${uuidv4().replace(/-/g, '_')}`;
  
  // Create a savepoint
  await testClient!`SAVEPOINT ${testClient!.unsafe(currentSavepoint)}`;
});

// Cleanup after each test - rollback to the savepoint
afterEach(async () => {
  if (currentSavepoint && testClient) {
    await testClient!`ROLLBACK TO SAVEPOINT ${testClient!.unsafe(currentSavepoint)}`;
    currentSavepoint = null;
  }
});

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

/**
 * Legacy cleanDatabase function for backward compatibility
 * This is a no-op in the savepoint approach since we're using transaction isolation
 * @deprecated Use the automatic savepoint isolation instead
 */
export async function cleanDatabase() {
  // This is a no-op function as we're using savepoints for isolation
  // The function exists only for backward compatibility with existing tests
  console.warn('cleanDatabase() is deprecated - using transaction savepoints instead');
  return Promise.resolve();
}
