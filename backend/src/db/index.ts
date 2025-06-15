import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the PostgreSQL connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

// Create the Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export the client for migrations
export const migrationClient = client;
