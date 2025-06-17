import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { auth } from '../routes/auth';
import { cleanupDatabase, testUser, testUser2 } from './setup';

describe('Authentication Routes', () => {
  let app: Hono;

  beforeEach(async () => {
    await cleanupDatabase();
    app = new Hono().route('/api/auth', auth);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const data = await res.json();
      
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(testUser.email);
      expect(data.data.user.firstName).toBe(testUser.firstName);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.passwordHash).toBeUndefined(); // Should not expose password
    });

    it('should fail with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });

      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      // Register first user
      await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      // Try to register same email again
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should fail with weak password', async () => {
      const weakPasswordUser = { ...testUser, password: '123' };
      
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weakPasswordUser),
      });

      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user first
      await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(testUser.email);
      expect(data.data.token).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: testUser.password,
        }),
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/auth/me (protected)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerRes = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      
      const registerData = await registerRes.json();
      authToken = registerData.data.token;
    });

    it('should get profile with valid token', async () => {
      const res = await app.request('/api/auth/me', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json' 
        },
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(testUser.email);
    });

    it('should fail without token', async () => {
      const res = await app.request('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail with invalid token', async () => {
      const res = await app.request('/api/auth/me', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json' 
        },
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });
});
