import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import usersRoutes from './routes/users';
import helloRoutes from './routes/hello';

// Create main app instance
const app = new Hono();

// Apply global middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:5174',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Middleware for logging and CORS
app.use('*', logger());
app.use('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Chain routes for RPC compatibility
const routes = app
  // Health check endpoints
  .get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  })
  // Mount API routes
  .route('/api/users', usersRoutes)
  // Mount hello world authenticated route
  .route('/api/hello', helloRoutes);

// Serve static files from SvelteKit build output
// Skip API routes and serve static assets first
app.use('*', async (c, next) => {
  const path = c.req.path;
  
  // Skip static serving for API routes
  if (path.startsWith('/api/')) {
    await next();
    return;
  }
  
  // Try to serve static files (JS, CSS, images, etc.)
  const staticHandler = serveStatic({
    root: '../frontend',
    onNotFound: () => {
      // Don't log here, just continue to next middleware
    }
  });
  
  return staticHandler(c, next);
});

// SPA fallback - serve index.html for all remaining non-API routes
app.get('*', serveStatic({ 
  path: '../frontend/index.html',
  onFound: (path, c) => {
    console.log(`🏠 Serving SPA for: ${c.req.path}`);
  },
  onNotFound: (path, c) => {
    console.error(`❌ Frontend not found: ${path}`);
  }
}));

// Export the app type for RPC
export type AppType = typeof routes;

export default app;
