import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { CreateUserSchema, LoginSchema, UpdateUserSchema } from '../types'
import { AuthService } from '../services/auth.service'
import { authMiddleware, getUserFromContext } from '../middleware/auth'

const auth = new Hono()

// Register
auth.post('/register', zValidator('json', CreateUserSchema), async (c) => {
  const input = c.req.valid('json')
  
  const result = await AuthService.register(input)
  
  if (!result.success) {
    throw new HTTPException(400, { message: result.error })
  }
  
  return c.json(result)
})

// Login
auth.post('/login', zValidator('json', LoginSchema), async (c) => {
  const input = c.req.valid('json')
  
  const result = await AuthService.login(input)
  
  if (!result.success) {
    throw new HTTPException(400, { message: result.error })
  }
  
  return c.json(result)
})

// Get current user
auth.get('/me', authMiddleware, async (c) => {
  const user = getUserFromContext(c)
  
  const userData = await AuthService.getUserById(user.userId)
  
  if (!userData) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  return c.json({
    success: true,
    data: userData
  })
})

// Update current user
auth.put('/me', authMiddleware, zValidator('json', UpdateUserSchema), async (c) => {
  const user = getUserFromContext(c)
  const input = c.req.valid('json')
  
  const updatedUser = await AuthService.updateUser(user.userId, input)
  
  if (!updatedUser) {
    throw new HTTPException(400, { message: 'Failed to update user' })
  }
  
  return c.json({
    success: true,
    data: updatedUser
  })
})

// Delete current user
auth.delete('/me', authMiddleware, async (c) => {
  const user = getUserFromContext(c)
  
  const success = await AuthService.deleteUser(user.userId)
  
  if (!success) {
    throw new HTTPException(400, { message: 'Failed to delete user' })
  }
  
  return c.json({
    success: true,
    message: 'User deleted successfully'
  })
})

export default auth
