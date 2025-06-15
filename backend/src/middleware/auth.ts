import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getUserFromToken } from '../utils/authUtils';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to authenticate requests using JWT
 * Adds user to the context if authentication is successful
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      throw new HTTPException(401, { message: 'Authorization header missing' });
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : authHeader;
      
    const payload = await getUserFromToken(token);
    if (!payload) {
      throw new HTTPException(401, { message: 'Invalid token' });
    }
    
    // Verify user exists in database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);
    
    if (userResult.length === 0) {
      throw new HTTPException(401, { message: 'User not found' });
    }
    
    // Attach user to the context
    c.set('user', {
      id: payload.id,
      email: payload.email
    });
    
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, { message: 'Authentication failed' });
  }
}

/**
 * Middleware to handle errors consistently
 */
export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Error handling request:', error);
    
    if (error instanceof HTTPException) {
      return c.json({
        success: false,
        error: error.message || 'An error occurred',
      }, error.status);
    }
    
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500);
  }
}
