import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Create a migration to add motto column to characters table
export const up = async (db: PostgresJsDatabase) => {
  await db.execute(sql`
    ALTER TABLE characters
    ADD COLUMN motto TEXT;
  `);
};

// Rollback migration by removing the motto column
export const down = async (db: PostgresJsDatabase) => {
  await db.execute(sql`
    ALTER TABLE characters
    DROP COLUMN motto;
  `);
};
