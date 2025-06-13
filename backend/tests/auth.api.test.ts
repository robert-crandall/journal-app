import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { cleanDatabase, TEST_USER } from './setup'

// Test server setup
const BASE_URL = 'http://localhost:3002'

describe('Auth API Endpoints', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_USER)
      })

      expect(response.status).toBe(200)

      const result = await response.json() as any
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.user.email).toBe(TEST_USER.email)
      expect(result.data.user.name).toBe(TEST_USER.name)
      expect(result.data.token).toBeDefined()
      expect(result.data.user.passwordHash).toBeUndefined()
    })

    it('should reject duplicate email registration', async () => {
      // Register first user
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_USER)
      })

      // Try to register with same email
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_USER)
      })

      expect(response.status).toBe(400)

      const result = await response.json() as any
      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists')
    })

    it('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com'
          // missing password
        })
      })

      expect(response.status).toBe(400)

      const result = await response.json() as any
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user for login tests
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_USER)
      })
    })

    it('should login with correct credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      })

      expect(response.status).toBe(200)

      const result = await response.json() as any
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.user.email).toBe(TEST_USER.email)
      expect(result.data.token).toBeDefined()
    })

    it('should reject incorrect credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: 'wrongpassword'
        })
      })

      expect(response.status).toBe(401)

      const result = await response.json() as any
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken: string

    beforeEach(async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_USER)
      })

      const result = await response.json() as any
      authToken = result.data.token
    })

    it('should return user profile with valid token', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const result = await response.json() as any
      expect(result.success).toBe(true)
      expect(result.data.email).toBe(TEST_USER.email)
      expect(result.data.name).toBe(TEST_USER.name)
    })

    it('should reject request without token', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET'
      })

      expect(response.status).toBe(401)

      const result = await response.json() as any
      expect(result.success).toBe(false)
      expect(result.error).toContain('token required')
    })
  })
})
