import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

// Create the PostgreSQL client with proper connection pooling
const queryClient = postgres(env.DATABASE_URL, {
  // Configure connection pool
  max: 10,
  idle_timeout: 30000,
  connect_timeout: 30000,
  // Use camelCase transform
  transform: postgres.camel,
});

// Create the Drizzle client
export const db = drizzle(queryClient, { schema });

// Export the schema
export * from './schema';
