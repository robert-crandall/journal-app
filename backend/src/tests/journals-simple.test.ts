import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Journal Routes - Simple Test', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Generate unique email for each test
    const testUser = {
      name: 'Test User',
      email: getUniqueEmail('journals'),
      password: 'password123',
    };

    const registerRes = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(registerRes.status).toBe(201);
    const registerData = await registerRes.json();
    authToken = registerData.token;
    userId = registerData.user.id;
  });

  describe('GET /api/journals/today', () => {
    it('should return no journal when none exists for today', async () => {
      const response = await app.request('/api/journals/today', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.exists).toBe(false);
      expect(data.data.actionText).toBe('Write Journal');
    });
  });
});
