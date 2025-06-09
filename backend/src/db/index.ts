import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/journal_app'
const client = postgres(connectionString)
export const db = drizzle(client, { schema })

export * from './schema'
