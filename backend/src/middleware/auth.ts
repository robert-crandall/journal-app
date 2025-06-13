import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verifyToken } from '../utils/auth'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'Authorization token required'
    }, 401)
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  try {
    const payload = verifyToken(token)
    c.set('user', payload)
    await next()
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid or expired token'
    }, 401)
  }
}

export function getUserFromContext(c: Context) {
  const user = c.get('user')
  if (!user) {
    throw new HTTPException(401, { message: 'User not authenticated' })
  }
  return user
}
