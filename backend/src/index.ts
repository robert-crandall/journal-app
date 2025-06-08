import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serveStatic } from "hono/bun";

// Load environment variables only in development
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (error) {
    // dotenv is a dev dependency, ignore in production
  }
}

// Import routes
import userRoutes from "./routes/users";
import messageRoutes from "./routes/messages";
import notificationRoutes from "./routes/notifications";
import cronRoutes from "./routes/cron";
import docsRoutes from "./routes/docs";
import processingRoutes from "./routes/processing";

// Create Hono application
const app = new Hono();

// Middleware
app.use("*", cors());
// Only enable detailed logging in development
if (process.env.NODE_ENV !== "production") {
  app.use("*", logger());
}
app.use("*", prettyJSON());

// API Routes (more specific routes first)
app.route("/api/users", userRoutes);
app.route("/api/messages", messageRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/processing", processingRoutes);
app.route("/cron", cronRoutes);
app.route("/docs", docsRoutes);

// Health check endpoint for API monitoring
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files - but exclude API routes using a custom condition
app.use("*", async (c, next) => {
  const path = c.req.path;
  
  // Skip static serving for API routes
  if (path.startsWith("/api/") || path.startsWith("/cron") || path.startsWith("/docs")) {
    await next();
    return;
  }
  
  // For non-API routes, try to serve static files first
  return serveStatic({ root: "./frontend-build" })(c, next);
});

// Fallback for client-side routing (SPA) - serve index.html for non-API routes
app.get("*", async (c) => {
  const path = c.req.path;
  
  // This should only be reached for non-API routes that don't have static files
  try {
    const file = Bun.file("./frontend-build/index.html");
    const content = await file.text();
    return c.html(content);
  } catch (error) {
    console.error("Error serving index.html:", error);
    return c.json({ error: "Frontend not found" }, 404);
  }
});

// Error handling
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Start the server when running in Bun
const port = parseInt(Bun.env.PORT || "8000", 10);
console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch
};
