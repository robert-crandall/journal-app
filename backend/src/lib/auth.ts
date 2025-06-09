import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Context } from 'hono'
import { db, users, User } from '../db'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.AUTH_SECRET || 'your-secret-key-change-this'
const JWT_EXPIRES_IN = '30d'

export interface JWTPayload {
  userId: string
  email: string
}

// Define the context type for authenticated requests
export type AuthContext = {
  Variables: {
    user: User
  }
}

export class AuthService {
  static signJWT(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  static verifyJWT(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static async getUserFromRequest(c: Context): Promise<User | null> {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = this.verifyJWT(token)
    if (!payload) {
      return null
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1)

      return user || null
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  static async requireAuth(c: Context): Promise<User> {
    const user = await this.getUserFromRequest(c)
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }
}

// Middleware for authentication
export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  const user = await AuthService.getUserFromRequest(c)
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  // Store user in context for route handlers
  c.set('user', user)
  await next()
}

// Optional auth middleware (doesn't fail if no auth)
export const optionalAuthMiddleware = async (c: Context, next: () => Promise<void>) => {
  const user = await AuthService.getUserFromRequest(c)
  c.set('user', user)
  await next()
}
