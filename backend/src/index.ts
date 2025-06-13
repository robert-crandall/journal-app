import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { corsMiddleware, loggerMiddleware, errorHandler } from './middleware/common'

// Import routes
import authRoutes from './routes/auth.routes'
import characterStatsRoutes from './routes/character-stats.routes'
import experimentsRoutes from './routes/experiments.routes'
import journalRoutes from './routes/journal.routes'
import tagsRoutes from './routes/tags.routes'

const app = new Hono()

// Global middleware
app.use('*', corsMiddleware)
app.use('*', loggerMiddleware)
app.use('*', errorHandler)

// Health check
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Journal App Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/character-stats', characterStatsRoutes)
app.route('/api/experiments', experimentsRoutes)
app.route('/api/journal', journalRoutes)
app.route('/api/tags', tagsRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  }, 404)
})

const port = Number(process.env.PORT) || 3001

console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})

export default app
