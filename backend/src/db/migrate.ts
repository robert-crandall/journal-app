import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient } from './index';
import { resolve } from 'path';

// Path to the migrations folder
const migrationsFolder = resolve('./drizzle');

async function main() {
  try {
    console.log('Starting database migrations...');
    console.log(`Using migrations from: ${migrationsFolder}`);
    console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
    
    // Apply migrations
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

main();
