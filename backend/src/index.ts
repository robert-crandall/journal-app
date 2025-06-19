import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { JwtVariables } from 'hono/jwt';
import type { User } from './db/schema';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from 'hono/bun';

// Define app variables type
type Variables = JwtVariables & {
  user: User;
};

// Routes
import auth from './routes/auth';
import family from './routes/family';
import tasks from './routes/tasks';
import adhocTasks from './routes/adhocTasks';
import journals from './routes/journals';
import potions from './routes/potions';
import stats from './routes/stats';
import preferences from './routes/preferences';
import tags from './routes/tags';

const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use("*", cors());

// Only enable detailed logging in development
// if (process.env.NODE_ENV !== "production") {
//   app.use("*", logger());
// }
app.use("*", prettyJSON());

// API routes
app.route('/api/auth', auth);
app.route('/api/family', family);
app.route('/api/tasks', tasks);
app.route('/api/adhoc-tasks', adhocTasks);
app.route('/api/journals', journals);
app.route('/api/potions', potions);
app.route('/api/stats', stats);
app.route('/api/preferences', preferences);
app.route('/api/tags', tags);

// Serve static files - but exclude API routes using a custom condition
app.use("*", async (c, next) => {
  const path = c.req.path;
  
  // Skip static serving for API routes
  if (path.startsWith("/api/") || path.startsWith("/cron") || path.startsWith("/docs")) {
    await next();
    return;
  }
  
  // For non-API routes, try to serve static files first
  return serveStatic({ root: "./frontend" })(c, next);
});

// Fallback for client-side routing (SPA) - serve index.html for non-API routes
app.get("*", async (c) => {
  const path = c.req.path;
  
  // This should only be reached for non-API routes that don't have static files
  try {
    const file = Bun.file("./frontend/index.html");
    const content = await file.text();
    return c.html(content);
  } catch (error) {
    console.error("Error serving index.html:", error);
    return c.json({ error: "Frontend not found" }, 404);
  }
});

// Start the server when running in Bun
const port = parseInt(Bun.env.PORT || "3000", 10);
console.log(`Server is running on port ${port}`);
export default {
  port,
  fetch: app.fetch
};
