// checkTestDb.ts
import { db } from './src/db';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function checkTestDb() {
  try {
    console.log('Checking test database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('✅ Test database connected successfully');
    console.log('Database time:', result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    process.exit(1);
  }
}

checkTestDb();
