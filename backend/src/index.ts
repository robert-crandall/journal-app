import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { JwtVariables } from 'hono/jwt';
import type { User } from './db/schema';

// Define app variables type
type Variables = JwtVariables & {
  user: User;
};

// Routes
import auth from './routes/auth';
import family from './routes/family';
import tasks from './routes/tasks';
import focuses from './routes/focuses';
import journals from './routes/journals';
import potions from './routes/potions';
import stats from './routes/stats';
import preferences from './routes/preferences';
import tags from './routes/tags';

const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ message: 'Life Quest API is running!' });
});

// API routes
app.route('/api/auth', auth);
app.route('/api/family', family);
app.route('/api/tasks', tasks);
app.route('/api/focuses', focuses);
app.route('/api/journals', journals);
app.route('/api/potions', potions);
app.route('/api/stats', stats);
app.route('/api/preferences', preferences);
app.route('/api/tags', tags);

export default app;
