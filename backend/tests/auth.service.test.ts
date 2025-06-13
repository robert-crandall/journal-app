import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { AuthService } from '../src/services/auth.service'
import { cleanDatabase, TEST_USER, TEST_USER_2, NON_EXISTENT_UUID } from './setup'

describe('AuthService', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const result = await AuthService.register(TEST_USER)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.user.email).toBe(TEST_USER.email)
      expect(result.data?.user.name).toBe(TEST_USER.name)
      expect(result.data?.token).toBeDefined()
      expect(result.data?.user).not.toHaveProperty('passwordHash')
    })

    it('should fail to register user with existing email', async () => {
      // Register first user
      await AuthService.register(TEST_USER)

      // Try to register with same email
      const result = await AuthService.register(TEST_USER)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already exists with this email')
    })

    it('should handle registration errors gracefully', async () => {
      // Test with invalid data
      const invalidUser = { ...TEST_USER, email: 'invalid-email' }
      const result = await AuthService.register(invalidUser)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await AuthService.register(TEST_USER)
    })

    it('should successfully login with correct credentials', async () => {
      const result = await AuthService.login({
        email: TEST_USER.email,
        password: TEST_USER.password
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.user.email).toBe(TEST_USER.email)
      expect(result.data?.token).toBeDefined()
      expect(result.data?.user).not.toHaveProperty('passwordHash')
    })

    it('should fail login with incorrect email', async () => {
      const result = await AuthService.login({
        email: 'wrong@example.com',
        password: TEST_USER.password
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should fail login with incorrect password', async () => {
      const result = await AuthService.login({
        email: TEST_USER.email,
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })
  })

  describe('updateUser', () => {
    let userId: string

    beforeEach(async () => {
      const result = await AuthService.register(TEST_USER)
      userId = result.data!.user.id
    })

    it('should successfully update user name', async () => {
      const updatedUser = await AuthService.updateUser(userId, {
        name: 'Updated Name'
      })

      expect(updatedUser).toBeDefined()
      expect(updatedUser?.name).toBe('Updated Name')
      expect(updatedUser?.email).toBe(TEST_USER.email)
    })

    it('should successfully update user email', async () => {
      const newEmail = 'updated@example.com'
      const updatedUser = await AuthService.updateUser(userId, {
        email: newEmail
      })

      expect(updatedUser).toBeDefined()
      expect(updatedUser?.email).toBe(newEmail)
    })

    it('should successfully update user password', async () => {
      const newPassword = 'newpassword123'
      const updatedUser = await AuthService.updateUser(userId, {
        password: newPassword
      })

      expect(updatedUser).toBeDefined()

      // Test login with new password
      const loginResult = await AuthService.login({
        email: TEST_USER.email,
        password: newPassword
      })

      expect(loginResult.success).toBe(true)
    })

    it('should return null for non-existent user', async () => {
      const result = await AuthService.updateUser(NON_EXISTENT_UUID, {
        name: 'New Name'
      })

      expect(result).toBe(null)
    })
  })

  describe('getUserById', () => {
    let userId: string

    beforeEach(async () => {
      const result = await AuthService.register(TEST_USER)
      userId = result.data!.user.id
    })

    it('should successfully get user by id', async () => {
      const user = await AuthService.getUserById(userId)

      expect(user).toBeDefined()
      expect(user?.email).toBe(TEST_USER.email)
      expect(user?.name).toBe(TEST_USER.name)
      expect(user).not.toHaveProperty('passwordHash')
    })

    it('should return null for non-existent user', async () => {
      const user = await AuthService.getUserById(NON_EXISTENT_UUID)
      expect(user).toBe(null)
    })
  })

  describe('deleteUser', () => {
    let userId: string

    beforeEach(async () => {
      const result = await AuthService.register(TEST_USER)
      userId = result.data!.user.id
    })

    it('should successfully delete user', async () => {
      const result = await AuthService.deleteUser(userId)
      expect(result).toBe(true)

      // Verify user is deleted
      const user = await AuthService.getUserById(userId)
      expect(user).toBe(null)
    })

    it('should return false for non-existent user', async () => {
      const result = await AuthService.deleteUser(NON_EXISTENT_UUID)
      expect(result).toBe(false)
    })
  })
})
