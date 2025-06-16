import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { auth } from './routes/auth';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081'], // Frontend URLs
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'Journal App API',
    version: '1.0.0',
    status: 'healthy',
  });
});

// Routes
app.route('/auth', auth);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Route not found',
  }, 404);
});

// Error handler
app.onError((error, c) => {
  console.error('Unhandled error:', error);
  return c.json({
    success: false,
    error: 'Internal server error',
  }, 500);
});

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
};
