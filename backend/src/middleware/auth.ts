import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'

// JWT secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this'

export interface JWTPayload {
  id: string
  email: string
  exp: number
}

// Extend Context to include user info
declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: JWTPayload
    userId: string
  }
}

// JWT authentication middleware
export const jwtAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Authorization token required' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    try {
      const payload = await verify(token, JWT_SECRET) as any
      
      // Validate required fields - support both id and userId fields for compatibility
      const userId = payload.id || payload.userId;
      if (!userId || !payload.email) {
        throw new HTTPException(401, { message: 'Invalid token payload' })
      }
      
      const jwtPayload: JWTPayload = {
        id: userId,
        email: payload.email,
        exp: payload.exp
      }
      
      // Set user info in context for use in route handlers
      c.set('jwtPayload', jwtPayload)
      c.set('userId', userId)
      
      await next()
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      throw new HTTPException(401, { message: 'Invalid or expired token' })
    }
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Auth middleware error:', error)
    throw new HTTPException(500, { message: 'Authentication error' })
  }
}

// Helper function to get user ID from context
export const getUserId = (c: Context): string => {
  const userId = c.get('userId')
  if (!userId) {
    throw new HTTPException(401, { message: 'User ID not found in context' })
  }
  return userId
}
