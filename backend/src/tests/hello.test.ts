import { describe, it, expect, beforeEach } from 'vitest';
import app, { AppType } from '../index';
import { sign } from 'hono/jwt';
import { env } from '../env';
import { testClient } from 'hono/testing';
import { JWTPayload } from '../middleware/auth';

// Create a test client with the proper type
const client = testClient<AppType>(app);

describe('Hello API', () => {
  // Test JWT token data
  const testUser = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };
  
  let validToken: string;
  
  // Create a valid JWT token before tests
  beforeEach(async () => {
    validToken = await sign(testUser, env.JWT_SECRET);
  });

  // Test authenticated endpoint
  it('should return hello message for authenticated user', async () => {
    // Make request with JWT token - note: Hono client uses 'header' (singular)
    const res = await client.api.hello.$get({
      header: {
        Authorization: `Bearer ${validToken}`
      }
    });
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('id', testUser.userId); // Now checking for 'id' instead of 'userId'
    expect(data).toHaveProperty('timestamp');
    expect(data.message).toContain(testUser.email);
  });

  // Test unauthorized access
  it('should return 401 for missing token', async () => {
    // Make request without JWT token
    const res = await client.api.hello.$get();
    expect(res.status).toBe(401);
  });
  
  // Test invalid token
  it('should return 401 for invalid token', async () => {
    // Make request with invalid JWT token
    const res = await client.api.hello.$get({
      header: {
        Authorization: 'Bearer invalid.token.here'
      }
    });
    expect(res.status).toBe(401);
  });
});
