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

const { journals } = schema;

let authToken: string;
let userId: string;
const journalDate = '2024-01-17';

beforeEach(async () => {
  // Create test user and get auth token
  const testUser = {
    name: 'Test User',
    email: getUniqueEmail('journal-rating'),
    password: 'password123',
  };

  const registerResponse = await app.request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  expect(registerResponse.status).toBe(201);
  const registerData = await registerResponse.json();
  authToken = registerData.token;
  userId = registerData.user.id;
});

describe('Journal Rating API', () => {
  describe('Journal Day Rating', () => {
    it('should create a journal with day rating', async () => {
      // Create a journal with a day rating
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date: journalDate,
          initialMessage: 'Today was a good day',
          dayRating: 4,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.dayRating).toBe(4);
    });

    it('should update journal day rating', async () => {
      // Create a journal first
      await testDb().insert(journals).values({
        userId,
        date: journalDate,
        status: 'draft',
        chatSession: [],
      });

      // Update the journal with a day rating
      const response = await app.request(`/api/journals/${journalDate}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          dayRating: 5,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.dayRating).toBe(5);
    });

    it('should set inferred day rating when finishing journal', async () => {
      // Create a journal in review status
      await testDb()
        .insert(journals)
        .values({
          userId,
          date: journalDate,
          status: 'in_review',
          chatSession: [
            { role: 'assistant', content: 'Initial prompt' },
            { role: 'user', content: 'I did some work today' },
          ],
        });

      // Finish journal
      const response = await app.request(`/api/journals/${journalDate}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.inferredDayRating).toBeDefined();
      expect(data.data.inferredDayRating).toBeGreaterThanOrEqual(1);
      expect(data.data.inferredDayRating).toBeLessThanOrEqual(5);
    });

    it('should handle journals without day rating', async () => {
      // Create a journal without a day rating
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date: journalDate,
          initialMessage: 'Just a normal day',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.dayRating).toBeNull();
    });

    it('should validate day rating is between 1-5', async () => {
      // Try to create a journal with invalid day rating
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date: journalDate,
          initialMessage: 'Today was a good day',
          dayRating: 6,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});
