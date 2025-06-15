import { createHash } from 'crypto';
import { verify, sign } from 'hono/jwt';
import 'dotenv/config';
import { HTTPException } from 'hono/http-exception';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development-only';

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'default-secret-key-for-development-only') {
  console.warn('WARNING: Using default JWT secret in production environment!');
}

/**
 * Hash a password using SHA-256
 * In a production application, you would want to use a more secure method like bcrypt
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: { id: string; email: string }): string {
  return sign(payload, JWT_SECRET);
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<{ id: string; email: string }> {
  try {
    return await verify(token, JWT_SECRET);
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
}

/**
 * Create a userAuth object from a JWT token
 * This is used to pass user information to the RPC client
 */
export async function getUserFromToken(token: string | undefined): Promise<{ id: string; email: string } | null> {
  if (!token) return null;
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    return await verifyToken(cleanToken);
  } catch (error) {
    return null;
  }
}
