import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import routes from './routes'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}))

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'Journal App API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.route('/api', routes)

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err)
  return c.json({ 
    error: 'Internal server error',
    message: err.message 
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
}
