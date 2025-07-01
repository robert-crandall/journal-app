import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'

// Create the postgres connection
export const connection = postgres(env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 30,
  connect_timeout: 60,
})

// Create Drizzle ORM instance with schema
export const db = drizzle(connection, { schema })

// Export type for use in other files
export type Database = typeof db
