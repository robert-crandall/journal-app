import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { registerSchema, loginSchema } from '../../lib/validation'
import { UserService } from '../../lib/users'
import { AuthService } from '../../lib/auth'

const auth = new Hono()

// Register endpoint
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    // Check if user already exists
    const existingUser = await UserService.findUserByEmail(email)
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400)
    }

    // Create new user
    const user = await UserService.createUser(email, password)

    // Generate JWT token
    const token = AuthService.signJWT({
      userId: user.id,
      email: user.email,
    })

    return c.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Login endpoint
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    // Verify user credentials
    const user = await UserService.verifyUser(email, password)
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Generate JWT token
    const token = AuthService.signJWT({
      userId: user.id,
      email: user.email,
    })

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Get current user info
auth.get('/me', async (c) => {
  try {
    const user = await AuthService.getUserFromRequest(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

export default auth
