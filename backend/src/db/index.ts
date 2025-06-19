import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/lifequest';

// Configure postgres client with proper connection pooling
const client = postgres(connectionString, { 
  prepare: false,
  max: 5, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds  
  max_lifetime: 60 * 30, // Close connections after 30 minutes
  connection: {
    application_name: 'journal-app-backend',
  },
});

export const db = drizzle(client, { schema });
