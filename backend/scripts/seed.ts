import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import fs from 'fs';
import path from 'path';

export async function seed(db: NodePgDatabase<typeof schema>) {
  try {
    // Read and execute default stats SQL file
    const defaultStatsPath = path.resolve(__dirname, '../src/db/seed_data/default_stats.sql');
    if (fs.existsSync(defaultStatsPath)) {
      console.log('Loading default stats data...');
      const sql = fs.readFileSync(defaultStatsPath, 'utf-8');
      // Split SQL statements by semicolon and execute each one
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await db.execute(statement);
        }
      }
      console.log('Default stats data loaded successfully.');
    } else {
      console.warn('Default stats seed file not found at:', defaultStatsPath);
    }
  } catch (error) {
    console.error('Error seeding default data:', error);
    throw error;
  }
}
