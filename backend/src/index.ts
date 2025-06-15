import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRoutes } from './routes/api';
import { db } from './db';
import { JournalTestClient } from './client/journalTestClient';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

// Create main app
const app = new Hono();

// Apply cors middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
}));

// Mount API routes
app.route('/api', apiRoutes);

// Simple health check endpoint
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Journal API is running' });
});

// Export client for use in frontend
export { JournalClient } from './client/journalClient';

// Export types for use in frontend
export * from './types/api';

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// For Bun server
const startServer = async () => {
  console.log(`🚀 Server starting on http://localhost:${PORT}`);
  
  // Check database connection
  try {
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
  
  // Run test client if in test mode
  if (process.env.RUN_TESTS === 'true') {
    setTimeout(async () => {
      console.log('\n📋 Running test client...');
      const testClient = new JournalTestClient(`http://localhost:${PORT}`);
      await testClient.runTests();
    }, 1000); // Give the server a moment to start
  }
};

// Only start the server when this file is the entry point
if (process.argv[1] === import.meta.path) {
  startServer();
}

// Export default Hono app for Bun to start server
export default {
  port: PORT,
  fetch: app.fetch
};
