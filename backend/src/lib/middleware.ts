import { Context, Next } from 'hono';
import { verifyToken, JWTPayload } from './auth';

// Extend Hono's context to include user information
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header('Authorization');
  
  if (!authorization) {
    return c.json({ error: 'Authorization header is required' }, 401);
  }

  const token = authorization.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Token is required' }, 401);
  }

  try {
    const payload = await verifyToken(token);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authorization = c.req.header('Authorization');
  
  if (authorization) {
    const token = authorization.replace('Bearer ', '');
    
    if (token) {
      try {
        const payload = await verifyToken(token);
        c.set('user', payload);
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
  }
  
  await next();
}
