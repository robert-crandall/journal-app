import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { hashPassword, verifyPassword, generateToken } from '../utils/auth'
import { CreateUserInput, LoginInput, UpdateUserInput, User, AuthResponse } from '../types'

export class AuthService {
  static async register(input: CreateUserInput): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email)
      })

      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email'
        }
      }

      // Hash password and create user
      const passwordHash = await hashPassword(input.password)
      
      const [newUser] = await db.insert(users).values({
        email: input.email,
        passwordHash,
        name: input.name,
      }).returning()

      // Generate token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
      })

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = newUser

      return {
        success: true,
        data: {
          user: userWithoutPassword as User,
          token,
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Registration failed'
      }
    }
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email)
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Verify password
      const isValidPassword = await verifyPassword(input.password, user.passwordHash)
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      })

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user

      return {
        success: true,
        data: {
          user: userWithoutPassword as User,
          token,
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Login failed'
      }
    }
  }

  static async updateUser(userId: string, input: UpdateUserInput): Promise<User | null> {
    try {
      const updateData: any = {}

      if (input.name !== undefined) {
        updateData.name = input.name
      }

      if (input.email !== undefined) {
        updateData.email = input.email
      }

      if (input.password !== undefined) {
        updateData.passwordHash = await hashPassword(input.password)
      }

      updateData.updatedAt = new Date()

      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning()

      if (!updatedUser) {
        return null
      }

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = updatedUser
      return userWithoutPassword as User
    } catch (error) {
      console.error('Update user error:', error)
      return null
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      })

      if (!user) {
        return null
      }

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user
      return userWithoutPassword as User
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }

  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await db.delete(users)
        .where(eq(users.id, userId))

      return result.length > 0
    } catch (error) {
      console.error('Delete user error:', error)
      return false
    }
  }
}
