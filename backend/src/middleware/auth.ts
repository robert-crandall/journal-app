import type { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';
import type { JwtVariables } from 'hono/jwt';
import { getUserById } from '../utils/auth';
import type { User } from '../db/schema';

export interface AuthContext extends JwtVariables {
  user: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

// JWT middleware that will protect routes
export const jwtMiddleware = jwt({
  secret: JWT_SECRET,
  cookie: 'session', // Also check for JWT in cookies
});

// Custom middleware to add user data to context after JWT verification
export async function userMiddleware(c: Context, next: Next) {
  const jwtPayload = c.get('jwtPayload');
  
  if (!jwtPayload || !jwtPayload.userId) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  const user = await getUserById(jwtPayload.userId);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }
  
  c.set('user', user);
  await next();
}
