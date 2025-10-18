import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { testDb, getUniqueEmail, schema } from '../tests/setup';
import appExport from '../index';
import { dailyQuestions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { DailyQuestion } from '../../../shared/types/daily-questions';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

const BASE_URL = '/api';

// Helper function to create test user
async function createTestUser(userData?: Partial<{ email: string; name: string; password: string }>) {
  const defaultUserData = {
    name: 'Test User',
    email: getUniqueEmail('test'),
    password: 'testpassword123',
    ...userData,
  };

  const registerRes = await app.request('/api/users', {
    method: 'POST',
    body: JSON.stringify(defaultUserData),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const registerData = await registerRes.json();
  return {
    user: registerData.user,
    token: registerData.token,
  };
}

describe('Daily Questions API', () => {
  let userId: string;
  let authToken: string;

  beforeEach(async () => {
    const { user, token } = await createTestUser();
    userId = user.id;
    authToken = token;
  });

  describe('GET /daily-questions/today', () => {
    it('should generate and return a daily question for today', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions/today`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.question).not.toBeNull();
      expect(data.data.question.questionText).toBeTruthy();
      expect(data.data.question.answered).toBe(false);
      expect(data.data.question.dateAssigned).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return the same question when called multiple times on the same day', async () => {
      const response1 = await app.request(`${BASE_URL}/daily-questions/today`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data1 = await response1.json();
      const questionId1 = data1.data.question?.id;

      const response2 = await app.request(`${BASE_URL}/daily-questions/today`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data2 = await response2.json();
      const questionId2 = data2.data.question?.id;

      expect(questionId1).toBe(questionId2);
      expect(data1.data.question.questionText).toBe(data2.data.question.questionText);
    });

    it('should return question for specific date when date parameter is provided', async () => {
      const testDate = '2024-01-15';
      const response = await app.request(`${BASE_URL}/daily-questions/today?date=${testDate}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.question).not.toBeNull();
      expect(data.data.question.dateAssigned).toBe(testDate);
    });

    it('should require authentication', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions/today`);
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /daily-questions/:id/answered', () => {
    let questionId: string;

    beforeEach(async () => {
      // Create a question first
      const response = await app.request(`${BASE_URL}/daily-questions/today`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      questionId = data.data.question.id;
    });

    it('should mark a question as answered', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions/${questionId}/answered`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.answered).toBe(true);

      // Verify in database
      const question = await testDb().select().from(dailyQuestions).where(eq(dailyQuestions.id, questionId)).limit(1);

      expect(question[0].answered).toBe(true);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await app.request(`${BASE_URL}/daily-questions/${fakeId}/answered`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it("should not allow marking another user's question as answered", async () => {
      // Create another user
      const { user: otherUser, token: otherToken } = await createTestUser({
        email: getUniqueEmail('other'),
        name: 'Other User',
      });

      const response = await app.request(`${BASE_URL}/daily-questions/${questionId}/answered`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions/${questionId}/answered`, {
        method: 'PATCH',
      });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /daily-questions/:id', () => {
    let questionId: string;

    beforeEach(async () => {
      // Create a question first
      const response = await app.request(`${BASE_URL}/daily-questions/today`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      questionId = data.data.question.id;
    });

    it('should return a specific daily question', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions/${questionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(questionId);
      expect(data.data.questionText).toBeTruthy();
    });

    it('should return 404 for non-existent question', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await app.request(`${BASE_URL}/daily-questions/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it("should not return another user's question", async () => {
      // Create another user
      const { user: otherUser, token: otherToken } = await createTestUser({
        email: getUniqueEmail('other'),
        name: 'Other User',
      });

      const response = await app.request(`${BASE_URL}/daily-questions/${questionId}`, {
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions/${questionId}`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /daily-questions', () => {
    it('should return empty array when no questions exist', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should return recent daily questions', async () => {
      // Create a few questions for different dates
      const dates = ['2024-01-15', '2024-01-16', '2024-01-17'];

      for (const date of dates) {
        await app.request(`${BASE_URL}/daily-questions/today?date=${date}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }

      const response = await app.request(`${BASE_URL}/daily-questions?limit=5`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(3);
      expect(data.data[0].dateAssigned).toBe('2024-01-17'); // Most recent first
    });

    it('should respect limit parameter', async () => {
      // Create multiple questions
      const dates = ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'];

      for (const date of dates) {
        await app.request(`${BASE_URL}/daily-questions/today?date=${date}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }

      const response = await app.request(`${BASE_URL}/daily-questions?limit=2`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /daily-questions', () => {
    it('should create a new daily question', async () => {
      const questionData = {
        questionText: 'How was your day?',
        dateAssigned: '2024-01-15',
        contextSource: 'Manual test creation',
      };

      const response = await app.request(`${BASE_URL}/daily-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(questionData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.questionText).toBe(questionData.questionText);
      expect(data.data.dateAssigned).toBe(questionData.dateAssigned);
      expect(data.data.answered).toBe(false);
    });

    it('should not allow creating duplicate questions for the same date', async () => {
      const questionData = {
        questionText: 'How was your day?',
        dateAssigned: '2024-01-15',
        contextSource: 'Manual test creation',
      };

      // Create first question
      await app.request(`${BASE_URL}/daily-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(questionData),
      });

      // Try to create duplicate
      const response = await app.request(`${BASE_URL}/daily-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(questionData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await app.request(`${BASE_URL}/daily-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: 'How was your day?',
          dateAssigned: '2024-01-15',
        }),
      });
      expect(response.status).toBe(401);
    });
  });
});
