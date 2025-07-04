import { env } from '../src/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Check for force flag in command line arguments
const forceRun = process.argv.includes('--force');

if (process.env.NODE_ENV !== 'test' && !forceRun) {
  throw new Error('This script must be run in a test environment or with --force flag');
}

// When run with --force flag, this script will:
// 1. Create a backup of the database (if not on localhost) before cleaning
// 2. Clean and reset the database structure
// 3. Apply all migrations
// 4. Apply seed data if available

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
  const seedPath = path.resolve(__dirname, './seed-stats.ts');
  console.log('Looking for seed file at:', seedPath);
  if (fs.existsSync(seedPath)) {
    console.log('Seed file found, importing...');
    try {
      const seedModule = await import(seedPath);
      if (typeof seedModule.seed === 'function') {
        console.log('Running seed function...');
        await seedModule.seed(db);
        console.log('Seed data applied successfully.');
      } else {
        console.log('No seed function found in module. Available exports:', Object.keys(seedModule));
      }
    } catch (err) {
      console.error('Error importing or running seed file:', err);
    }
  } else {
    console.log('No seed file found at path:', seedPath);
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

async function createBackup() {
  const dbUrl = new URL(env.DATABASE_URL);
  const hostname = dbUrl.hostname;
  
  // Check if database is not on localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🏠 Database is on localhost, skipping backup');
    return;
  }
  
  const dbName = dbUrl.pathname.slice(1); // Remove leading '/'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
  const backupFilename = `${dbName}_backup_${timestamp}.sql`;
  
  // Create sqlbackups directory if it doesn't exist
  const sqlbackupsDir = path.resolve(__dirname, '../../sqlbackups');
  if (!fs.existsSync(sqlbackupsDir)) {
    fs.mkdirSync(sqlbackupsDir, { recursive: true });
  }
  
  const backupPath = path.join(sqlbackupsDir, backupFilename);
  
  try {
    console.log(`💾 Creating backup of database '${dbName}' to ${backupFilename}...`);
    
    // Build pg_dump command with connection string
    const pgDumpCommand = `pg_dump "${env.DATABASE_URL}" --clean --if-exists --create --verbose`;
    
    // Execute pg_dump and write to file
    const { stdout, stderr } = await execAsync(`${pgDumpCommand} > "${backupPath}"`);
    
    if (stderr && !stderr.includes('NOTICE:')) {
      console.warn('⚠️ pg_dump warnings:', stderr);
    }
    
    // Verify backup file was created and has content
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      if (stats.size > 0) {
        console.log(`✅ Backup created successfully: ${backupFilename} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        throw new Error('Backup file is empty');
      }
    } else {
      throw new Error('Backup file was not created');
    }
  } catch (err) {
    console.error('❌ Error creating backup:', (err as Error).message);
    throw err;
  }
}

async function main() {
  try {
    // Create database if needed (assumes PostgreSQL server is running)
    await createDatabaseIfNeeded();
    
    // Create backup if running with --force and database is not on localhost
    if (forceRun) {
      await createBackup();
    }
    
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
