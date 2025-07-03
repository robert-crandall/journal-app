import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { beforeEach, afterAll } from 'vitest';
import * as schema from '../db/schema';

// Create test database connection - function to create fresh connections
const testDbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/example_app';

// Global connection that will be reused across tests in the same file
let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

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
        application_name: `test_${process.pid}_${Date.now()}`
      }
    });
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}

// Clean database function with better error handling
export async function cleanDatabase() {
  try {
    const db = getTestDb();
    // Delete all data from tables in the correct order (respecting foreign keys)
    await db.delete(schema.users);
  } catch (error) {
    // Only log actual errors, not warnings about missing tables
    if (error instanceof Error && error.message && !error.message.includes('CONNECTION_ENDED')) {
      console.warn('Error cleaning database:', error.message);
    }
    // If delete fails, the table might not exist yet, which is fine for tests
  }
}

// Setup that runs before each test
beforeEach(async () => {
  await cleanDatabase();
});

// Cleanup after all tests - only close connection once at the very end
afterAll(async () => {
  try {
    await cleanDatabase();
  } catch (error) {
    // Ignore cleanup errors at shutdown
  }
  
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
