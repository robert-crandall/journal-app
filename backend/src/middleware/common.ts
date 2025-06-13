import { Context, Next } from 'hono'
import { cors } from 'hono/cors'

export const corsMiddleware = cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001' // Allow backend testing
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
})

export async function loggerMiddleware(c: Context, next: Next) {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`)
}

export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (error) {
    console.error('Request error:', error)
    
    if (error instanceof Error) {
      const status = (error as any).status || 500
      return c.json({
        success: false,
        error: error.message || 'Internal server error'
      }, status)
    }
    
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
}
