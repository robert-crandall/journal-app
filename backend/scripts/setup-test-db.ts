import { env } from '../src/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import fs from 'fs';
import path from 'path';

// Check for force flag in command line arguments
const forceRun = process.argv.includes('--force');

if (process.env.NODE_ENV !== 'test' && !forceRun) {
  throw new Error('This script must be run in a test environment or with --force flag');
}

// 2. Connect to DB
const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool);

// 3. Clean up existing test database
// This will drop all tables and the drizzle schema used for migrations
// Useful for ensuring a clean state before running tests

async function cleanDatabase() {
  // Drop all tables in public schema
  const tables = await db.execute(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  for (const row of tables.rows) {
    await db.execute(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
  }
  // Drop drizzle schema (migration tracking)
  await db.execute('DROP SCHEMA IF EXISTS drizzle CASCADE');
}

async function runMigrations() {
  const migrationsPath = path.resolve(__dirname, '../src/db/migrations');
  console.log('Looking for migrations in:', migrationsPath);
  if (!fs.existsSync(migrationsPath)) {
    throw new Error(`Migrations folder not found: ${migrationsPath}`);
  }
  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('Migrations applied successfully.');
  } catch (err) {
    console.error('Error running migrations:', err);
    throw err;
  }
}

async function runSeed() {
  const seedPath = path.resolve(__dirname, './seed.ts');
  if (fs.existsSync(seedPath)) {
    const { seed } = await import(seedPath);
    if (typeof seed === 'function') {
      await seed(db);
    }
  }
}

async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    const testPool = new Pool({ 
      connectionString: env.DATABASE_URL,
      // Short timeout for quick connection check
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 1000,
    });
    
    await testPool.query('SELECT 1');
    await testPool.end();
    console.log('✅ Database is already online');
    return true;
  } catch (err) {
    console.log('❌ Database not accessible:', (err as Error).message);
    return false;
  }
}

async function createDatabaseIfNeeded() {
  // Parse the DATABASE_URL to get connection details
  const dbUrl = new URL(env.DATABASE_URL);
  const dbName = dbUrl.pathname.slice(1); // Remove leading '/'
  
  // Create connection to postgres database (not the target database)
  const postgresUrl = new URL(env.DATABASE_URL);
  postgresUrl.pathname = '/postgres';
  
  const adminPool = new Pool({ connectionString: postgresUrl.toString() });
  
  try {
    // Check if target database exists
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (result.rows.length === 0) {
      console.log(`🗃️ Creating database '${dbName}'...`);
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`🔄 Database '${dbName}' already exists`);
    }
  } catch (err) {
    console.error('❌ Error creating database:', (err as Error).message);
    throw err;
  } finally {
    await adminPool.end();
  }
  
  // Now verify we can connect to the target database
  const isOnline = await checkDatabaseConnection();
  if (!isOnline) {
    console.error('❌ Cannot connect to target database after creation');
    process.exit(1);
  }
}

async function main() {
  try {
    // Create database if needed (assumes PostgreSQL server is running)
    await createDatabaseIfNeeded();
    console.log('Cleaning test database...');
    await cleanDatabase();
    console.log('Applying migrations...');
    await runMigrations();
    console.log('Applying seed data (if any)...');
    await runSeed();
    console.log('Test DB setup complete.');
  } catch (err) {
    console.error('Error setting up test DB:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
