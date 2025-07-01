import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { db } from '../db/connection'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

describe('Authentication Integration Tests', () => {
  const testUsers: string[] = []

  afterAll(async () => {
    // Cleanup test users
    for (const userId of testUsers) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  test('should register a new user with hashed password', async () => {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'testpassword123',
        timezone: 'UTC'
      })
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.user.email).toContain('@example.com')
    expect(data.data.token).toBeString()
    
    // Store for cleanup
    testUsers.push(data.data.user.id)
  })

  test('should login with correct credentials', async () => {
    // First register a user
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `login-test-${Date.now()}@example.com`,
        name: 'Login Test User',
        password: 'logintest123',
        timezone: 'UTC'
      })
    })

    const registerData = await registerResponse.json()
    testUsers.push(registerData.data.user.id)

    // Then try to login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerData.data.user.email,
        password: 'logintest123'
      })
    })

    expect(loginResponse.ok).toBe(true)
    const loginData = await loginResponse.json()
    expect(loginData.success).toBe(true)
    expect(loginData.data.user.email).toBe(registerData.data.user.email)
    expect(loginData.data.token).toBeString()
  })

  test('should reject login with incorrect password', async () => {
    // First register a user
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `wrong-pass-test-${Date.now()}@example.com`,
        name: 'Wrong Pass Test User',
        password: 'correctpassword',
        timezone: 'UTC'
      })
    })

    const registerData = await registerResponse.json()
    testUsers.push(registerData.data.user.id)

    // Then try to login with wrong password
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerData.data.user.email,
        password: 'wrongpassword'
      })
    })

    expect(loginResponse.status).toBe(401)
  })

  test('should create demo user successfully', async () => {
    const response = await fetch('http://localhost:3000/api/auth/create-demo-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.user.email).toContain('demo-')
    expect(data.data.credentials.password).toBe('demo123')
    expect(data.data.token).toBeString()
    
    // Store for cleanup
    testUsers.push(data.data.user.id)
  })
})
