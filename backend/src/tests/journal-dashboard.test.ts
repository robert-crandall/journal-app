import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail } from './setup';
import { journals, tags, xpGrants, users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Journal Dashboard API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user and get auth token
    const testUser = {
      name: 'Test User',
      email: getUniqueEmail('journal-dashboard'),
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

  afterEach(async () => {
    // Clean up test data
    await testDb().delete(xpGrants).where(eq(xpGrants.userId, userId));
    await testDb().delete(journals).where(eq(journals.userId, userId));
    await testDb().delete(tags).where(eq(tags.userId, userId));
    await testDb().delete(users).where(eq(users.id, userId));
  });

  describe('GET /api/journals', () => {
    it('should return empty list when user has no journals', async () => {
      const response = await app.request('/api/journals', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toEqual([]);
      expect(data.data.total).toBe(0);
      expect(data.data.hasMore).toBe(false);
      expect(data.data.availableTags).toEqual([]);
    });

    it('should return journals ordered by date descending', async () => {
      // Create multiple journal entries
      const journalsData = [
        {
          userId,
          date: '2024-01-15',
          status: 'complete',
          title: 'First Journal',
          synopsis: 'First synopsis',
          initialMessage: 'First message',
        },
        {
          userId,
          date: '2024-01-16',
          status: 'draft',
          title: null,
          synopsis: null,
          initialMessage: 'Second message',
        },
        {
          userId,
          date: '2024-01-14',
          status: 'in_review',
          title: 'Third Journal',
          synopsis: 'Third synopsis',
          initialMessage: 'Third message',
        },
      ];

      await testDb().insert(journals).values(journalsData);

      const response = await app.request('/api/journals', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toHaveLength(3);

      // Should be ordered by date descending
      expect(data.data.journals[0].date).toBe('2024-01-16');
      expect(data.data.journals[1].date).toBe('2024-01-15');
      expect(data.data.journals[2].date).toBe('2024-01-14');

      expect(data.data.total).toBe(3);
      expect(data.data.hasMore).toBe(false);
    });

    it('should filter journals by status', async () => {
      // Create journals with different statuses
      const journalsData = [
        {
          userId,
          date: '2024-01-15',
          status: 'complete',
          title: 'Complete Journal',
          initialMessage: 'Complete message',
        },
        {
          userId,
          date: '2024-01-16',
          status: 'draft',
          title: 'Draft Journal',
          initialMessage: 'Draft message',
        },
        {
          userId,
          date: '2024-01-17',
          status: 'in_review',
          title: 'Review Journal',
          initialMessage: 'Review message',
        },
      ];

      await testDb().insert(journals).values(journalsData);

      // Filter by complete status
      const response = await app.request('/api/journals?status=complete', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toHaveLength(1);
      expect(data.data.journals[0].status).toBe('complete');
      expect(data.data.journals[0].title).toBe('Complete Journal');
    });

    it('should filter journals by date range', async () => {
      // Create journals across different dates
      const journalsData = [
        {
          userId,
          date: '2024-01-10',
          status: 'complete',
          title: 'Old Journal',
          initialMessage: 'Old message',
        },
        {
          userId,
          date: '2024-01-15',
          status: 'complete',
          title: 'Middle Journal',
          initialMessage: 'Middle message',
        },
        {
          userId,
          date: '2024-01-20',
          status: 'complete',
          title: 'New Journal',
          initialMessage: 'New message',
        },
      ];

      await testDb().insert(journals).values(journalsData);

      // Filter by date range
      const response = await app.request('/api/journals?dateFrom=2024-01-12&dateTo=2024-01-18', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toHaveLength(1);
      expect(data.data.journals[0].title).toBe('Middle Journal');
      expect(data.data.journals[0].date).toBe('2024-01-15');
    });

    it('should search journals by content', async () => {
      // Create journals with different content
      const journalsData = [
        {
          userId,
          date: '2024-01-15',
          status: 'complete',
          title: 'Workout Journal',
          synopsis: 'Fitness and health',
          initialMessage: 'Today I exercised at the gym',
        },
        {
          userId,
          date: '2024-01-16',
          status: 'complete',
          title: 'Coding Journal',
          synopsis: 'Programming work',
          initialMessage: 'Worked on JavaScript features',
        },
        {
          userId,
          date: '2024-01-17',
          status: 'complete',
          title: 'Reading Journal',
          synopsis: 'Book reflection',
          initialMessage: 'Read an interesting novel',
        },
      ];

      await testDb().insert(journals).values(journalsData);

      // Search for "gym"
      const response = await app.request('/api/journals?search=gym', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toHaveLength(1);
      expect(data.data.journals[0].title).toBe('Workout Journal');
    });

    it('should handle pagination correctly', async () => {
      // Create 25 journal entries
      const journalsData = Array.from({ length: 25 }, (_, i) => ({
        userId,
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        status: 'complete',
        title: `Journal ${i + 1}`,
        initialMessage: `Message ${i + 1}`,
      }));

      await testDb().insert(journals).values(journalsData);

      // Get first page (default limit 20)
      const response1 = await app.request('/api/journals', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);
      expect(data1.data.journals).toHaveLength(20);
      expect(data1.data.total).toBe(25);
      expect(data1.data.hasMore).toBe(true);

      // Get second page
      const response2 = await app.request('/api/journals?limit=20&offset=20', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.success).toBe(true);
      expect(data2.data.journals).toHaveLength(5);
      expect(data2.data.total).toBe(25);
      expect(data2.data.hasMore).toBe(false);
    });

    it('should include character and word counts', async () => {
      const message = 'This is a test message with several words.';
      const journalData = {
        userId,
        date: '2024-01-15',
        status: 'complete',
        title: 'Test Journal',
        initialMessage: message,
      };

      await testDb().insert(journals).values([journalData]);

      const response = await app.request('/api/journals', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toHaveLength(1);

      const journal = data.data.journals[0];
      expect(journal.characterCount).toBe(message.length); // Length of the message
      expect(journal.wordCount).toBe(8); // Number of words
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/journals');
      expect(response.status).toBe(401);
    });

    it('should only return journals for the authenticated user', async () => {
      // Create a second user
      const secondUser = {
        name: 'Second User',
        email: getUniqueEmail('journal-dashboard-2'),
        password: 'password123',
      };

      const registerResponse = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secondUser),
      });

      const secondUserData = await registerResponse.json();
      const secondUserId = secondUserData.user.id;

      // Create journals for both users
      const journalsData = [
        {
          userId,
          date: '2024-01-15',
          status: 'complete',
          title: 'First User Journal',
          initialMessage: 'First user message',
        },
        {
          userId: secondUserId,
          date: '2024-01-16',
          status: 'complete',
          title: 'Second User Journal',
          initialMessage: 'Second user message',
        },
      ];

      await testDb().insert(journals).values(journalsData);

      const response = await app.request('/api/journals', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.journals).toHaveLength(1);
      expect(data.data.journals[0].title).toBe('First User Journal');

      // Clean up second user
      await testDb().delete(journals).where(eq(journals.userId, secondUserId));
      await testDb().delete(users).where(eq(users.id, secondUserId));
    });

    it('should validate query parameters', async () => {
      // Test invalid status
      const response1 = await app.request('/api/journals?status=invalid', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response1.status).toBe(400);

      // Test invalid date format
      const response2 = await app.request('/api/journals?dateFrom=invalid-date', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response2.status).toBe(400);

      // Test invalid limit
      const response3 = await app.request('/api/journals?limit=101', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(response3.status).toBe(400);
    });
  });
});
