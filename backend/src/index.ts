import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import usersRoutes from './routes/users';
import charactersRoutes from './routes/characters';
import statsRoutes from './routes/stats';
import goalsRoutes from './routes/goals';
import familyRoutes from './routes/family';

// Create main app instance
const app = new Hono();

// Apply global middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5174'];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Middleware for logging and CORS
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Chain routes for RPC compatibility
const routes = app
  // Health check endpoints
  .get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  })
  // Mount API routes
  .route('/api/users', usersRoutes)
  // Mount character routes
  .route('/api/characters', charactersRoutes)
  // Mount stats routes
  .route('/api/stats', statsRoutes)
  // Mount goals routes
  .route('/api/goals', goalsRoutes)
  // Mount family routes
  .route('/api/family', familyRoutes);

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
    },
  });

  return staticHandler(c, next);
});

// SPA fallback - serve index.html for all remaining non-API routes
app.get(
  '*',
  serveStatic({
    path: '../frontend/index.html',
    onFound: (path, c) => {
      console.log(`🏠 Serving SPA for: ${c.req.path}`);
    },
    onNotFound: (path, c) => {
      console.error(`❌ Frontend not found: ${path}`);
    },
  }),
);

// Export the app type for RPC
export type AppType = typeof routes;

// Get port from environment variable, default to 3001
const port = parseInt(process.env.PORT || '3001', 10);

export default {
  port,
  fetch: app.fetch,
};
