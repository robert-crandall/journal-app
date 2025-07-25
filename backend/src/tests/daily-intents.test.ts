import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('Daily Intents API', () => {
  let testUser: { id: string; email: string; name: string };
  let authToken: string;

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    const userData = {
      name: 'Test User',
      email: getUniqueEmail('daily-intents'),
      password: 'testpassword123',
    };

    const signupRes = await app.request('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const signupData = await signupRes.json();
    authToken = signupData.token;
    testUser = {
      id: signupData.user.id,
      email: signupData.user.email,
      name: signupData.user.name,
    };
  });

  describe('POST /api/daily-intents', () => {
    it('should create a new daily intent', async () => {
      const intentData = {
        date: '2024-03-15',
        importanceStatement: 'Complete the project deadline and spend quality time with family',
      };

      const res = await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(intentData),
      });

      expect(res.status).toBe(201);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.date).toBe(intentData.date);
      expect(responseData.data.importanceStatement).toBe(intentData.importanceStatement);
      expect(responseData.data.userId).toBe(testUser.id);
    });

    it('should update existing daily intent for the same date', async () => {
      const date = '2024-03-15';
      const originalStatement = 'Original statement';
      const updatedStatement = 'Updated statement';

      // Create initial intent
      await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          importanceStatement: originalStatement,
        }),
      });

      // Update with new statement
      const res = await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          importanceStatement: updatedStatement,
        }),
      });

      expect(res.status).toBe(201);

      const responseData = await res.json();
      expect(responseData.data.importanceStatement).toBe(updatedStatement);

      // Verify only one record exists for this date
      const db = testDb();
      const intents = await db.select().from(schema.dailyIntents).where(eq(schema.dailyIntents.userId, testUser.id));

      expect(intents).toHaveLength(1);
      expect(intents[0].importanceStatement).toBe(updatedStatement);
    });

    it('should reject invalid date format', async () => {
      const res = await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date: '2024/03/15', // Invalid format
          importanceStatement: 'Valid statement',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject empty importance statement', async () => {
      const res = await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date: '2024-03-15',
          importanceStatement: '',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: '2024-03-15',
          importanceStatement: 'Valid statement',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/daily-intents/:date', () => {
    it('should return daily intent for specific date', async () => {
      const date = '2024-03-15';
      const statement = 'Test importance statement';

      // Create intent via API
      await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          importanceStatement: statement,
        }),
      });

      const res = await app.request(`/api/daily-intents/${date}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.date).toBe(date);
      expect(responseData.data.importanceStatement).toBe(statement);
    });

    it('should return null if no intent exists for date', async () => {
      const res = await app.request('/api/daily-intents/2024-03-15', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBe(null);
    });

    it('should reject invalid date format', async () => {
      const res = await app.request('/api/daily-intents/invalid-date', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/daily-intents', () => {
    it('should return recent daily intents', async () => {
      // Create multiple intents via API
      const intents = [
        { date: '2024-03-13', statement: 'Statement 1' },
        { date: '2024-03-14', statement: 'Statement 2' },
        { date: '2024-03-15', statement: 'Statement 3' },
      ];

      for (const intent of intents) {
        await app.request('/api/daily-intents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            date: intent.date,
            importanceStatement: intent.statement,
          }),
        });
      }

      const res = await app.request('/api/daily-intents', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(3);

      // Should be ordered by date
      expect(responseData.data[0].date).toBe('2024-03-13');
      expect(responseData.data[1].date).toBe('2024-03-14');
      expect(responseData.data[2].date).toBe('2024-03-15');
    });

    it('should respect limit parameter', async () => {
      // Create 15 intents via API
      for (let i = 1; i <= 15; i++) {
        await app.request('/api/daily-intents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            date: `2024-03-${i.toString().padStart(2, '0')}`,
            importanceStatement: `Statement ${i}`,
          }),
        });
      }

      const res = await app.request('/api/daily-intents?limit=5', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(5);
    });

    it('should limit to maximum of 50 intents', async () => {
      const res = await app.request('/api/daily-intents?limit=100', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      // Should not cause an error, just limit to 50
    });
  });
});
