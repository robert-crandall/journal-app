import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verifyToken } from '../utils/auth'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authorization token required' })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  try {
    const payload = verifyToken(token)
    c.set('user', payload)
    await next()
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
}

export function getUserFromContext(c: Context) {
  const user = c.get('user')
  if (!user) {
    throw new HTTPException(401, { message: 'User not authenticated' })
  }
  return user
}
