import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import characters from './routes/characters'
import tasks from './routes/tasks'
import { taskCompletionRoutes } from './routes/task-completion'
import feedbackApp from './routes/feedback-system'
import dashboardApp from './routes/dashboard'
import questsApp from './routes/quests'
import experimentsApp from './routes/experiments'
import adHocTasksApp from './routes/ad-hoc-tasks'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Life Gamification API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Mount character routes
app.route('/api/characters', characters)

// Mount feedback system routes
app.route('/api/feedback', feedbackApp)

// Mount dashboard routes
app.route('/api/dashboard', dashboardApp)

// Mount quest routes
app.route('/api/quests', questsApp)

// Mount experiment routes
app.route('/api/experiments', experimentsApp)

// Mount ad-hoc task routes
app.route('/api/tasks/ad-hoc', adHocTasksApp)

// Mount task completion routes first (more specific routes)
app.route('/api/tasks', taskCompletionRoutes)

// Mount task routes (includes catch-all /:id route)
app.route('/api/tasks', tasks)

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  
  if (err instanceof HTTPException) {
    // Return the HTTPException response directly
    return err.getResponse()
  }
  
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500)
})

export default app
export type AppType = typeof app
