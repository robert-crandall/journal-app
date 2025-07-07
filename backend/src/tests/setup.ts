import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { beforeEach, afterAll } from 'vitest';
import * as schema from '../db/schema';

// Create test database connection - function to create fresh connections
const testDbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/journal_app';

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
        application_name: `test_${process.pid}_${Date.now()}`,
      },
    });
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}

// Clean database function with better error handling
export async function cleanDatabase() {
  const db = getTestDb();
  
  // Helper function to safely delete from a table
  const safeDelete = async (table: any, tableName: string) => {
    try {
      await db.delete(table);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('does not exist')) {
        console.error(`Error cleaning table ${tableName}:`, error.message);
      }
      // Ignore errors for tables that don't exist yet
    }
  };

  // Delete all data from tables in the correct order (respecting foreign keys)
  try {
    // Family task feedback first (references family members)
    await safeDelete(schema.familyTaskFeedback, 'family_task_feedback');
    // Family members next (reference users)
    await safeDelete(schema.familyMembers, 'family_members');
    // Goal tags (references goals and tags)
    await safeDelete(schema.goalTags, 'goal_tags');
    // Tags (referenced by goal_tags)
    await safeDelete(schema.tags, 'tags');
    // Stats tables (they reference characters and users)
    await safeDelete(schema.characterStatXpGrants, 'character_stat_xp_grants');
    await safeDelete(schema.characterStatLevelTitles, 'character_stat_level_titles');
    await safeDelete(schema.characterStats, 'character_stats');
    await safeDelete(schema.goals, 'goals');
    await safeDelete(schema.characters, 'characters');
    await safeDelete(schema.users, 'users');
  } catch (error) {
    if (error instanceof Error && !error.message.includes('CONNECTION_ENDED')) {
      console.error('Error cleaning database:', error);
    }
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
