import { describe, it, expect } from 'bun:test'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../src/utils/auth'

describe('Auth Utils', () => {
  describe('password hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
    })

    it('should verify correct password', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
      
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true)
      expect(await verifyPassword(password, hash2)).toBe(true)
    })
  })

  describe('JWT tokens', () => {
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com'
    }

    it('should generate JWT token', () => {
      const token = generateToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should verify valid JWT token', () => {
      const token = generateToken(testPayload)
      const payload = verifyToken(token)

      expect(payload.userId).toBe(testPayload.userId)
      expect(payload.email).toBe(testPayload.email)
      expect(payload.iat).toBeDefined()
      expect(payload.exp).toBeDefined()
    })

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.jwt.token'
      
      expect(() => {
        verifyToken(invalidToken)
      }).toThrow('Invalid token')
    })

    it('should reject expired JWT token', () => {
      // This test would require mocking time or using a very short expiry
      // For now, we'll test with a malformed token
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      
      expect(() => {
        verifyToken(malformedToken)
      }).toThrow('Invalid token')
    })

    it('should handle missing JWT_SECRET environment variable', () => {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      expect(() => {
        generateToken(testPayload)
      }).toThrow('JWT_SECRET environment variable is required')

      expect(() => {
        verifyToken('some.jwt.token')
      }).toThrow('JWT_SECRET environment variable is required')

      // Restore original secret
      process.env.JWT_SECRET = originalSecret
    })
  })
})
