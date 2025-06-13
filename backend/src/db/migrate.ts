import 'dotenv/config'
import { db } from './index'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

async function runMigrations() {
  console.log('Running migrations...')
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

runMigrations()
