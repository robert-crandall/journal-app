import { describe, it, expect } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { eq } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Authentication Flow Integration Tests', () => {
  // Generate a unique email suffix for this test run
  const emailSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  describe('User Registration and Token Generation', () => {
    it('should complete full registration flow with valid JWT', async () => {
      // No need to clean database - using transaction isolation via savepoints

      const userData = {
        name: 'Auth Test User',
        email: getUniqueEmail('auth'),
        password: 'securepassword123',
      };

      // Step 1: Register user
      const registerRes = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(registerRes.status).toBe(201);
      const registerData = await registerRes.json();

      // Verify response structure
      expect(registerData).toHaveProperty('user');
      expect(registerData).toHaveProperty('token');

      const { user, token } = registerData;

      // Verify user data
      expect(user.id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.createdAt).toBeDefined();
      expect(user).not.toHaveProperty('password'); // Should not expose password

      // Verify JWT token format
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature

      // Verify user exists in database with hashed password
      const dbUsers = await testDb().select().from(schema.users).where(eq(schema.users.id, user.id));
      expect(dbUsers).toHaveLength(1);

      const dbUser = dbUsers[0];
      expect(dbUser.name).toBe(userData.name);
      expect(dbUser.email).toBe(userData.email);
      expect(dbUser.password).not.toBe(userData.password); // Should be hashed
      expect(dbUser.password).toHaveLength(60); // Bcrypt hash length
      expect(dbUser.createdAt).toBeDefined();
      expect(dbUser.updatedAt).toBeDefined();
    });

    it('should generate unique tokens for different users', async () => {
      // No need to clean database - using transaction isolation via savepoints

      const user1Data = {
        name: 'User One',
        email: getUniqueEmail('user1'),
        password: 'password123',
      };

      const user2Data = {
        name: 'User Two',
        email: getUniqueEmail('user2'),
        password: 'password123',
      };

      // Register first user
      const res1 = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(user1Data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res1.status).toBe(201);
      const data1 = await res1.json();

      // Register second user
      const res2 = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(user2Data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res2.status).toBe(201);
      const data2 = await res2.json();

      // Tokens should be different
      expect(data1.token).not.toBe(data2.token);
      expect(data1.user.id).not.toBe(data2.user.id);
      expect(data1.user.email).not.toBe(data2.user.email);

      // Verify both users exist in database
      const dbUsers = await testDb().select().from(schema.users).where(eq(schema.users.email, user1Data.email));
      const dbUsers2 = await testDb().select().from(schema.users).where(eq(schema.users.email, user2Data.email));

      expect(dbUsers).toHaveLength(1);
      expect(dbUsers2).toHaveLength(1);
      expect(dbUsers[0].id).toBe(data1.user.id);
      expect(dbUsers2[0].id).toBe(data2.user.id);
    });

    it('should include user information in JWT payload', async () => {
      // No need to clean database - using transaction isolation via savepoints

      const userData = {
        name: 'JWT Payload Test',
        email: getUniqueEmail('jwtpayload'),
        password: 'password123',
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      const token = responseData.token;
      const [header, payload, signature] = token.split('.');

      // Decode JWT payload (base64url decode)
      const decodedPayload = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

      // Verify payload contains user information
      expect(decodedPayload).toHaveProperty('userId', responseData.user.id);
      expect(decodedPayload).toHaveProperty('name', userData.name);

      // Should not contain sensitive information
      expect(decodedPayload).not.toHaveProperty('password');

      // Should have standard JWT claims
      expect(decodedPayload).toHaveProperty('iat'); // issued at
      expect(typeof decodedPayload.iat).toBe('number');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords with bcrypt', async () => {
      // No need to clean database - using transaction isolation via savepoints

      const userData = {
        name: 'Hash Test User',
        email: getUniqueEmail('hash'),
        password: 'plainTextPassword123',
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      // Get user from database
      const dbUsers = await testDb().select().from(schema.users).where(eq(schema.users.id, responseData.user.id));
      expect(dbUsers).toHaveLength(1);

      const dbUser = dbUsers[0];

      // Password should be hashed
      expect(dbUser.password).not.toBe(userData.password);
      expect(dbUser.password).toHaveLength(60); // Bcrypt hash length
      expect(dbUser.password).toMatch(/^\$2[aby]\$/); // Bcrypt format

      // Hash should be deterministic but salted (different each time)
      const res2 = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          email: getUniqueEmail('hash2'),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res2.status).toBe(201);
      const responseData2 = await res2.json();

      const dbUsers2 = await testDb().select().from(schema.users).where(eq(schema.users.id, responseData2.user.id));
      const dbUser2 = dbUsers2[0];

      // Same password should produce different hashes (due to salt)
      expect(dbUser.password).not.toBe(dbUser2.password);
    });

    it('should handle special characters in passwords', async () => {
      // No need to clean database - using transaction isolation via savepoints

      const specialPasswords = ['p@ssw0rd!'];

      for (let i = 0; i < specialPasswords.length; i++) {
        const userData = {
          name: `Special User ${i}`,
          email: getUniqueEmail(`special${i}`),
          password: specialPasswords[i],
        };

        const res = await app.request('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        expect(res.status).toBe(201);
        const responseData = await res.json();

        // Verify user was created and password was hashed
        const dbUsers = await testDb().select().from(schema.users).where(eq(schema.users.id, responseData.user.id));
        expect(dbUsers).toHaveLength(1);

        const dbUser = dbUsers[0];
        expect(dbUser.password).not.toBe(specialPasswords[i]);
        expect(dbUser.password).toHaveLength(60);
      }
    });
  });

  describe('JWT Token Security', () => {
    it('should generate cryptographically secure tokens', async () => {
      const userData = {
        name: 'Token Security Test',
        email: getUniqueEmail('tokensec'),
        password: 'password123',
      };

      // Generate multiple tokens to test randomness
      const tokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        // No need to clean database between iterations - using transaction isolation via savepoints

        const res = await app.request('/api/users', {
          method: 'POST',
          body: JSON.stringify({
            ...userData,
            email: getUniqueEmail(`tokensec${i}`),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        expect(res.status).toBe(201);
        const responseData = await res.json();
        tokens.push(responseData.token);
      }

      // All tokens should be different
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);

      // All tokens should be properly formatted
      for (const token of tokens) {
        expect(token.split('.')).toHaveLength(3);
        expect(token.length).toBeGreaterThan(100); // JWT tokens are typically long
      }
    });

    it('should include proper JWT headers', async () => {
      const userData = {
        name: 'JWT Header Test',
        email: getUniqueEmail('jwtheader'),
        password: 'password123',
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      const token = responseData.token;
      const [headerB64] = token.split('.');

      // Decode JWT header
      const header = JSON.parse(Buffer.from(headerB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

      // Verify JWT header
      expect(header).toHaveProperty('typ', 'JWT');
      expect(header).toHaveProperty('alg');
      expect(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512']).toContain(header.alg);
    });
  });

  describe('Registration Flow Edge Cases', () => {
    it('should handle concurrent registration attempts', async () => {
      const userData = {
        name: 'Concurrent Test',
        email: getUniqueEmail('concurrent'),
        password: 'password123',
      };

      // Attempt to create the same user concurrently
      const promises = Array.from({ length: 3 }, () =>
        app.request('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      const results = await Promise.all(promises);

      // Only one should succeed, others should fail with 409 (conflict)
      const successfulResponses = results.filter((r) => r.status === 201);
      const conflictResponses = results.filter((r) => r.status === 409);

      expect(successfulResponses).toHaveLength(1);
      expect(conflictResponses).toHaveLength(2);

      // Verify only one user exists in database
      const dbUsers = await testDb().select().from(schema.users).where(eq(schema.users.email, userData.email));
      expect(dbUsers).toHaveLength(1);
    });

    it('should maintain data consistency during registration', async () => {
      const userData = {
        name: 'Consistency Test',
        email: getUniqueEmail('consistency'),
        password: 'password123',
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      // Verify response data matches database data
      const dbUsers = await testDb().select().from(schema.users).where(eq(schema.users.id, responseData.user.id));
      expect(dbUsers).toHaveLength(1);

      const dbUser = dbUsers[0];
      expect(dbUser.id).toBe(responseData.user.id);
      expect(dbUser.name).toBe(responseData.user.name);
      expect(dbUser.email).toBe(responseData.user.email);
      expect(dbUser.createdAt.toISOString()).toBe(responseData.user.createdAt);

      // Verify timestamps are recent and consistent
      const now = Date.now();
      const createdAt = new Date(dbUser.createdAt).getTime();
      const updatedAt = new Date(dbUser.updatedAt).getTime();

      expect(createdAt).toBeLessThanOrEqual(now);
      expect(createdAt).toBeGreaterThan(now - 10000); // Within last 10 seconds
      expect(updatedAt).toBe(createdAt); // Should be same on creation
    });
  });
});
