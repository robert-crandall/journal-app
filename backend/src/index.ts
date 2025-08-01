import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import usersRoutes from './routes/users';
import charactersRoutes from './routes/characters';
import statsRoutes from './routes/stats';
import goalsRoutes from './routes/goals';
import familyRoutes from './routes/family';
import tagsRoutes from './routes/tags';
import focusRoutes from './routes/focus';
import todosRoutes from './routes/todos';
import experimentsRoutes from './routes/experiments';
import journalsRoutes from './routes/journals';
import journalSummariesRoutes from './routes/journal-summaries';
import goalAlignmentSummariesRoutes from './routes/goal-alignment-summaries';
import weeklyAnalysesRoutes from './routes/weekly-analyses';
import questsRoutes from './routes/quests';
import plansRoutes from './routes/plans';
import weatherRoutes from './routes/weather';
import metricSummariesRoutes from './routes/metric-summaries';
import xpGrantsRoutes from './routes/xpGrants';
import dailyIntentsRoutes from './routes/daily-intents';
import generateTasksRoutes from './routes/generate-tasks';
import userAttributesRoutes from './routes/user-attributes';

// Create main app instance
const app = new Hono();

// Apply global middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5174'];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Middleware for logging and CORS
// Only use logger in development
if (process.env.NODE_ENV === 'development') {
  app.use('*', logger());
}
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
  .route('/api/family', familyRoutes)
  // Mount tags routes
  .route('/api/tags', tagsRoutes)
  // Mount focus routes
  .route('/api/focus', focusRoutes)
  // Mount todos routes
  .route('/api/todos', todosRoutes)
  // Mount experiments routes
  .route('/api/experiments', experimentsRoutes)
  // Mount journal routes
  .route('/api/journals', journalsRoutes)
  // Mount journal summaries routes
  .route('/api/journal-summaries', journalSummariesRoutes)
  // Mount goal alignment summaries routes
  .route('/api/goal-alignment-summaries', goalAlignmentSummariesRoutes)
  // Mount weekly analyses routes
  .route('/api/weekly-analyses', weeklyAnalysesRoutes)
  // Mount quest routes
  .route('/api/quests', questsRoutes)
  // Mount plans routes
  .route('/api/plans', plansRoutes)
  // Mount weather routes
  .route('/api/weather', weatherRoutes)
  // Mount metric summaries routes
  .route('/api/metric-summaries', metricSummariesRoutes)
  // Mount XP grants routes
  .route('/api/xp-grants', xpGrantsRoutes)
  // Mount daily intents routes
  .route('/api/daily-intents', dailyIntentsRoutes)
  // Mount generate tasks routes
  .route('/api/generate-tasks', generateTasksRoutes)
  // Mount user attributes routes
  .route('/api/user-attributes', userAttributesRoutes);

// Serve static files - but exclude API routes using a custom condition
app.use('*', async (c, next) => {
  const path = c.req.path;

  // Skip static serving for API routes
  if (path.startsWith('/api/') || path.startsWith('/cron')) {
    await next();
    return;
  }

  // For non-API routes, try to serve static files first (CSS, JS, images, etc.)
  try {
    // Use the Bun-specific serveStatic middleware
    return serveStatic({
      root: '../frontend',
      rewriteRequestPath: (path) => path,
    })(c, next);
  } catch (error) {
    console.error('Error serving static file:', error);
    await next();
  }
});

// SPA fallback - serve index.html for all non-API routes that don't have static files
app.get('*', async (c) => {
  const path = c.req.path;

  // Skip for API routes
  if (path.startsWith('/api/') || path.startsWith('/cron') || path.startsWith('/docs')) {
    return c.json({ error: 'Not found' }, 404);
  }

  // For SPA, always serve index.html for routes that don't match static files
  try {
    // Use Bun's file API to serve the index.html file
    const file = Bun.file('../frontend/index.html');
    const exists = await file.exists();

    if (exists) {
      const content = await file.text();
      return c.html(content);
    } else {
      console.error('index.html file not found');
      return c.json({ error: 'Frontend not found' }, 404);
    }
  } catch (error) {
    console.error('Error serving index.html:', error);
    return c.json({ error: 'Frontend not found' }, 404);
  }
});

// Export the app type for RPC
export type AppType = typeof routes;

// Get port from environment variable, default to 3001
const port = parseInt(process.env.PORT || '3001', 10);

export default {
  port,
  fetch: app.fetch,
};
