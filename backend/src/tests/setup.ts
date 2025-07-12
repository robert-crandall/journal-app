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

// Clean database function with better error handling and retry logic
export async function cleanDatabase() {
  const db = getTestDb();

  // Define the deletion order with table references and names
  const deletionSequence = [
    // Journal data with proper ordering
    { table: schema.journalEntryStatTags, name: 'journal_entry_stat_tags' },
    { table: schema.journalEntryTags, name: 'journal_entry_tags' },
    { table: schema.journalConversationMessages, name: 'journal_conversation_messages' },
    { table: schema.journalEntries, name: 'journal_entries' },
    { table: schema.journalSessions, name: 'journal_sessions' },

    // Experiment data (most likely to have foreign key dependencies)
    { table: schema.experimentTaskCompletions, name: 'experiment_task_completions' },
    { table: schema.experimentTasks, name: 'experiment_tasks' },
    { table: schema.experiments, name: 'experiments' },

    // Family task feedback first (references family members)
    { table: schema.familyTaskFeedback, name: 'family_task_feedback' },
    // Family members next (reference users)
    { table: schema.familyMembers, name: 'family_members' },

    // Focus data
    { table: schema.focuses, name: 'focuses' },

    // Goal tags (references goals and tags)
    { table: schema.goalTags, name: 'goal_tags' },
    // Tags (referenced by goal_tags)
    { table: schema.tags, name: 'tags' },

    // Stats tables (they reference characters and users)
    { table: schema.xpGrants, name: 'xp_grants' },
    { table: schema.characterStatLevelTitles, name: 'character_stat_level_titles' },
    { table: schema.characterStats, name: 'character_stats' },

    // Goals and characters
    { table: schema.goals, name: 'goals' },
    { table: schema.characters, name: 'characters' },

    // Simple todos (reference users)
    { table: schema.simpleTodos, name: 'simple_todos' },

    // Users last (referenced by most other tables)
    { table: schema.users, name: 'users' },
  ];

  // Helper function to safely delete from a single table
  const safeDeleteTable = async (table: any, tableName: string) => {
    try {
      await db.delete(table);
      return { success: true, error: null };
    } catch (error) {
      const err = error as Error;

      // Table doesn't exist - this is OK
      if (err.message.includes('does not exist')) {
        return { success: true, error: null };
      }

      // Connection ended - this is a fatal error
      if (err.message.includes('CONNECTION_ENDED')) {
        throw error;
      }

      return { success: false, error: err };
    }
  };

  // Retry the entire deletion sequence
  const maxRetries = 3;
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const errors: string[] = [];
      let hasRetryableErrors = false;

      // Attempt to delete all tables in sequence
      for (const { table, name } of deletionSequence) {
        const result = await safeDeleteTable(table, name);

        if (!result.success && result.error) {
          const errorMsg = result.error.message;

          // Check if this is a retryable error
          if (
            errorMsg.includes('409') ||
            errorMsg.includes('conflict') ||
            errorMsg.includes('violates foreign key constraint') ||
            errorMsg.includes('could not serialize access')
          ) {
            hasRetryableErrors = true;
            errors.push(`${name}: ${errorMsg}`);
          } else {
            // Non-retryable error, log and continue
            console.warn(`Non-retryable error cleaning table ${name}:`, errorMsg);
          }
        }
      }

      // If no retryable errors, we're done
      if (!hasRetryableErrors) {
        return;
      }

      // Store errors for potential final logging
      lastErrors = errors;

      // If this isn't the last attempt, wait and retry the entire sequence
      if (attempt < maxRetries) {
        const delay = attempt * 150; // Progressive backoff: 150ms, 300ms
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Last attempt failed, log warnings
      if (errors.length > 0) {
        console.warn(`Failed to clean ${errors.length} table(s) after ${maxRetries} attempts:`);
        errors.forEach((error) => console.warn(`  - ${error}`));
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes('CONNECTION_ENDED')) {
        console.error('Error cleaning database:', error);
        // Don't throw - let tests continue even if cleanup partially failed
      }
      return; // Exit retry loop on fatal errors
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
