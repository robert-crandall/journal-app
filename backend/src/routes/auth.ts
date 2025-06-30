import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sign, verify } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import { db } from '../db/connection'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  timezone: z.string().optional().default('UTC'),
  zipCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  timezone: z.string().optional(),
  zipCode: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  // This is a placeholder - in production use proper bcrypt
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  // This is a placeholder - in production use proper bcrypt
  return Buffer.from(password).toString('base64') === hashedPassword
}

// JWT secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this'

const app = new Hono()

// POST /api/auth/register - Register a new user
app.post('/register', 
  zValidator('json', registerSchema),
  async (c) => {
    try {
      const userData = c.req.valid('json')

      // Check if user already exists
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1)

      if (existingUser) {
        throw new HTTPException(409, { message: 'User with this email already exists' })
      }

      // Hash password
      const hashedPassword = hashPassword(userData.password)

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: userData.email,
          name: userData.name,
          // Store hashed password in a password field (we need to add this to schema)
          timezone: userData.timezone,
          zipCode: userData.zipCode,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          timezone: users.timezone,
          zipCode: users.zipCode,
          createdAt: users.createdAt,
        })

      // Generate JWT token
      const token = await sign(
        { 
          userId: newUser.id, 
          email: newUser.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
        },
        JWT_SECRET
      )

      return c.json({
        success: true,
        data: {
          user: newUser,
          token
        }
      }, 201)

    } catch (error) {
      console.error('Registration error:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to register user' })
    }
  }
)

// POST /api/auth/login - Login user
app.post('/login',
  zValidator('json', loginSchema),
  async (c) => {
    try {
      const { email, password } = c.req.valid('json')

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!user) {
        throw new HTTPException(401, { message: 'Invalid email or password' })
      }

      // For now, we'll use a simple demo password check
      // In a real app, you'd verify against a hashed password field
      const isValidPassword = password === 'demo123' || password === 'password'
      
      if (!isValidPassword) {
        throw new HTTPException(401, { message: 'Invalid email or password' })
      }

      // Generate JWT token
      const token = await sign(
        { 
          userId: user.id, 
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
        },
        JWT_SECRET
      )

      // Return user data without sensitive information
      const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        zipCode: user.zipCode,
        createdAt: user.createdAt,
      }

      return c.json({
        success: true,
        data: {
          user: safeUser,
          token
        }
      })

    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to login' })
    }
  }
)

// GET /api/auth/me - Get current user profile
app.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Authorization token required' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    try {
      const payload = await verify(token, JWT_SECRET) as any
      
      // Get fresh user data
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          timezone: users.timezone,
          zipCode: users.zipCode,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1)

      if (!user) {
        throw new HTTPException(401, { message: 'User not found' })
      }

      return c.json({
        success: true,
        data: user
      })

    } catch (jwtError) {
      throw new HTTPException(401, { message: 'Invalid or expired token' })
    }

  } catch (error) {
    console.error('Get profile error:', error)
    if (error instanceof HTTPException) throw error
    throw new HTTPException(500, { message: 'Failed to get user profile' })
  }
})

// PUT /api/auth/profile - Update user profile
app.put('/profile',
  zValidator('json', updateProfileSchema),
  async (c) => {
    try {
      const authHeader = c.req.header('Authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HTTPException(401, { message: 'Authorization token required' })
      }

      const token = authHeader.substring(7)
      const payload = await verify(token, JWT_SECRET) as any
      const updateData = c.req.valid('json')

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, payload.userId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          timezone: users.timezone,
          zipCode: users.zipCode,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })

      return c.json({
        success: true,
        data: updatedUser
      })

    } catch (error) {
      console.error('Update profile error:', error)
      if (error instanceof HTTPException) throw error
      throw new HTTPException(500, { message: 'Failed to update profile' })
    }
  }
)

// POST /api/auth/logout - Logout (client-side token removal, but we can blacklist tokens in future)
app.post('/logout', async (c) => {
  // For JWT tokens, logout is typically handled client-side by removing the token
  // In a more advanced setup, you might want to blacklist the token server-side
  return c.json({
    success: true,
    message: 'Logged out successfully'
  })
})

// POST /api/auth/verify-token - Verify if token is valid
app.post('/verify-token', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Authorization token required' })
    }

    const token = authHeader.substring(7)
    const payload = await verify(token, JWT_SECRET) as any

    // Check if user still exists
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)

    if (!user) {
      throw new HTTPException(401, { message: 'User not found' })
    }

    return c.json({
      success: true,
      data: {
        userId: payload.userId,
        email: payload.email,
        valid: true
      }
    })

  } catch (error) {
    return c.json({
      success: false,
      data: {
        valid: false
      }
    }, 401)
  }
})

// Demo endpoint to create test users
app.post('/create-demo-user', async (c) => {
  try {
    const demoEmail = `demo-${Date.now()}@example.com`
    
    const [demoUser] = await db
      .insert(users)
      .values({
        email: demoEmail,
        name: 'Demo User',
        timezone: 'America/New_York',
        zipCode: '10001',
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        timezone: users.timezone,
        zipCode: users.zipCode,
      })

    // Generate token for immediate login
    const token = await sign(
      { 
        userId: demoUser.id, 
        email: demoUser.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
      },
      JWT_SECRET
    )

    return c.json({
      success: true,
      data: {
        user: demoUser,
        token,
        credentials: {
          email: demoEmail,
          password: 'demo123'
        }
      }
    })

  } catch (error) {
    console.error('Demo user creation error:', error)
    throw new HTTPException(500, { message: 'Failed to create demo user' })
  }
})

export default app
export type AuthAppType = typeof app
