import { describe, it, expect, beforeEach } from 'vitest';
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

describe('Generate Tasks API', () => {
  let testUser: { id: string; email: string; name: string };
  let authToken: string;

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    const userData = {
      name: 'Test User',
      email: getUniqueEmail('generate-tasks'),
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

  describe('POST /api/generate-tasks', () => {

    it('should generate daily tasks with daily intent', async () => {
      const date = '2024-03-15';
      const importanceStatement = 'Focus on completing my coding project and connecting with family';

      // First create a daily intent
      await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          importanceStatement,
        }),
      });

      const taskGenData = {
        date,
        includeIntent: true,
      };

      const res = await app.request('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(taskGenData),
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadata.includedIntent).toBe(true);
      expect(responseData.data.metadata.intentStatement).toBe(importanceStatement);
    });

    it('should generate tasks with character information', async () => {
      const db = testDb();

      // Create character for the user
      await db.insert(schema.characters).values({
        userId: testUser.id,
        name: 'Test Character',
        characterClass: 'Ranger',
        backstory: 'A nature-loving adventurer who values family time and outdoor exploration.',
      });

      const taskGenData = {
        date: '2024-03-15',
        includeIntent: false,
      };

      const res = await app.request('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(taskGenData),
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadata.characterClass).toBe('Ranger');
    });

    it('should generate tasks with family members', async () => {
      const db = testDb();

      // Create family member for the user
      await db.insert(schema.familyMembers).values({
        userId: testUser.id,
        name: 'Sarah',
        relationship: 'wife',
        likes: 'hiking, reading, cooking',
        dislikes: 'crowded places',
      });

      const taskGenData = {
        date: '2024-03-15',
        includeIntent: false,
      };

      const res = await app.request('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(taskGenData),
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadata.familyCount).toBe(1);
    });

    it('should reject invalid date format', async () => {
      const res = await app.request('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date: '2024/03/15', // Invalid format
          includeIntent: false,
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: '2024-03-15',
          includeIntent: false,
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/generate-tasks/:date', () => {
    it('should return generated tasks for specific date', async () => {
      const date = '2024-03-15';

      // First generate tasks for the date
      await app.request('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          includeIntent: false,
        }),
      });

      const res = await app.request(`/api/generate-tasks/${date}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.date).toBe(date);
      expect(responseData.data.tasks).toHaveLength(2);
      expect(responseData.data.intent).toBe(null);
    });

    it('should return tasks with daily intent when available', async () => {
      const date = '2024-03-15';
      const importanceStatement = 'Test importance statement';

      // Create daily intent
      await app.request('/api/daily-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          importanceStatement,
        }),
      });

      // Generate tasks
      await app.request('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          includeIntent: true,
        }),
      });

      const res = await app.request(`/api/generate-tasks/${date}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.intent).not.toBe(null);
      expect(responseData.data.intent.importanceStatement).toBe(importanceStatement);
    });

    it('should return empty tasks array if no tasks generated', async () => {
      const res = await app.request('/api/generate-tasks/2024-03-15', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);

      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.tasks).toHaveLength(0);
    });

    it('should reject invalid date format', async () => {
      const res = await app.request('/api/generate-tasks/invalid-date', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/generate-tasks/2024-03-15', {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });
  });
});
