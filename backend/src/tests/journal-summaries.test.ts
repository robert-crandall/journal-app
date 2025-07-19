import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { eq, and } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Journal Summaries API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('journal-summaries'),
      password: 'testpassword123',
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

  describe('GET /api/journal-summaries', () => {
    it('should get empty list when no summaries exist', async () => {
      const res = await app.request('/api/journal-summaries', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.summaries).toHaveLength(0);
      expect(responseData.data.total).toBe(0);
      expect(responseData.data.hasMore).toBe(false);
    });

    it('should get user summaries with pagination', async () => {
      const db = testDb();

      // Create test summaries
      const summariesData = [
        {
          userId,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Week 1 summary',
          tags: ['tag1', 'tag2'],
        },
        {
          userId,
          period: 'week' as const,
          startDate: '2024-01-08',
          endDate: '2024-01-14',
          summary: 'Week 2 summary',
          tags: ['tag2', 'tag3'],
        },
        {
          userId,
          period: 'month' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          summary: 'January summary',
          tags: ['monthly', 'review'],
        },
      ];

      await db.insert(schema.journalSummaries).values(summariesData);

      const res = await app.request('/api/journal-summaries?limit=2', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.summaries).toHaveLength(2);
      expect(responseData.data.total).toBe(3);
      expect(responseData.data.hasMore).toBe(true);
    });

    it('should filter by period type', async () => {
      const db = testDb();

      // Create test summaries
      const summariesData = [
        {
          userId,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Week summary',
          tags: ['week'],
        },
        {
          userId,
          period: 'month' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          summary: 'Month summary',
          tags: ['month'],
        },
      ];

      await db.insert(schema.journalSummaries).values(summariesData);

      const res = await app.request('/api/journal-summaries?period=week', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.summaries).toHaveLength(1);
      expect(responseData.data.summaries[0].period).toBe('week');
    });

    it('should filter by year', async () => {
      const db = testDb();

      // Create test summaries for different years
      const summariesData = [
        {
          userId,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: '2024 Week summary',
          tags: ['2024'],
        },
        {
          userId,
          period: 'week' as const,
          startDate: '2023-12-25',
          endDate: '2023-12-31',
          summary: '2023 Week summary',
          tags: ['2023'],
        },
      ];

      await db.insert(schema.journalSummaries).values(summariesData);

      const res = await app.request('/api/journal-summaries?year=2024', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.summaries).toHaveLength(1);
      expect(responseData.data.summaries[0].summary).toBe('2024 Week summary');
    });

    it('should only return summaries for authenticated user', async () => {
      const db = testDb();

      // Create another user
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-journal-summaries'),
          password: 'password',
        })
        .returning();

      // Create summaries for both users
      await db.insert(schema.journalSummaries).values([
        {
          userId,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'My summary',
          tags: ['mine'],
        },
        {
          userId: anotherUser[0].id,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Other summary',
          tags: ['theirs'],
        },
      ]);

      const res = await app.request('/api/journal-summaries', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.summaries).toHaveLength(1);
      expect(responseData.data.summaries[0].summary).toBe('My summary');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/journal-summaries');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/journal-summaries/:id', () => {
    it('should get specific summary by ID', async () => {
      const db = testDb();

      // Create test summary
      const [summary] = await db
        .insert(schema.journalSummaries)
        .values({
          userId,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Specific summary',
          tags: ['specific'],
        })
        .returning();

      const res = await app.request(`/api/journal-summaries/${summary.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(summary.id);
      expect(responseData.data.summary).toBe('Specific summary');
      expect(responseData.data.period).toBe('week');
      expect(responseData.data.tags).toEqual(['specific']);
    });

    it('should return 404 for non-existent summary', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await app.request(`/api/journal-summaries/${nonExistentId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Journal summary not found');
    });

    it('should not allow access to other users summaries', async () => {
      const db = testDb();

      // Create another user
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-journal-summaries-get'),
          password: 'password',
        })
        .returning();

      // Create summary for other user
      const [otherSummary] = await db
        .insert(schema.journalSummaries)
        .values({
          userId: anotherUser[0].id,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Other user summary',
          tags: ['other'],
        })
        .returning();

      const res = await app.request(`/api/journal-summaries/${otherSummary.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/journal-summaries/some-id');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/journal-summaries', () => {
    it('should create new summary', async () => {
      const summaryData = {
        period: 'week' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        summary: 'New week summary',
        tags: ['new', 'week'],
      };

      const res = await app.request('/api/journal-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(summaryData),
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        period: summaryData.period,
        startDate: summaryData.startDate,
        endDate: summaryData.endDate,
        summary: summaryData.summary,
        tags: summaryData.tags,
        userId: userId,
      });
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');

      // Verify summary was created in database
      const db = testDb();
      const dbSummary = await db
        .select()
        .from(schema.journalSummaries)
        .where(eq(schema.journalSummaries.id, responseData.data.id))
        .limit(1);

      expect(dbSummary).toHaveLength(1);
      expect(dbSummary[0].summary).toBe(summaryData.summary);
      expect(dbSummary[0].userId).toBe(userId);
    });

    it('should prevent duplicate summaries for same period', async () => {
      const summaryData = {
        period: 'week' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        summary: 'First summary',
        tags: ['first'],
      };

      // Create first summary
      const res1 = await app.request('/api/journal-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(summaryData),
      });

      expect(res1.status).toBe(201);

      // Try to create duplicate
      const res2 = await app.request('/api/journal-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...summaryData,
          summary: 'Second summary',
        }),
      });

      expect(res2.status).toBe(409);
      const responseData = await res2.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Journal summary for this period already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        period: 'week',
        startDate: '2024-01-01',
        // Missing endDate and summary
      };

      const res = await app.request('/api/journal-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidData),
      });

      expect(res.status).toBe(400);
    });

    it('should validate date format', async () => {
      const invalidData = {
        period: 'week',
        startDate: 'invalid-date',
        endDate: '2024-01-07',
        summary: 'Test summary',
      };

      const res = await app.request('/api/journal-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidData),
      });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const summaryData = {
        period: 'week',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        summary: 'Test summary',
      };

      const res = await app.request('/api/journal-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summaryData),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/journal-summaries/generate', () => {
    it('should fail when no completed journals exist', async () => {
      const generateData = {
        period: 'week' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      const res = await app.request('/api/journal-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res.status).toBe(400);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('No completed journal entries found for this period');
    });

    it('should prevent duplicate generation for same period', async () => {
      const db = testDb();

      // Create a summary first
      await db.insert(schema.journalSummaries).values({
        userId,
        period: 'week' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        summary: 'Existing summary',
        tags: ['existing'],
      });

      const generateData = {
        period: 'week' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      const res = await app.request('/api/journal-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(generateData),
      });

      expect(res.status).toBe(409);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Journal summary for this period already exists. Use PUT to update it.');
    });

    it('should require authentication', async () => {
      const generateData = {
        period: 'week',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      const res = await app.request('/api/journal-summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateData),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/journal-summaries/:id', () => {
    it('should update existing summary', async () => {
      const db = testDb();

      // Create test summary
      const [summary] = await db
        .insert(schema.journalSummaries)
        .values({
          userId,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Original summary',
          tags: ['original'],
        })
        .returning();

      const updateData = {
        summary: 'Updated summary',
        tags: ['updated', 'new'],
      };

      const res = await app.request(`/api/journal-summaries/${summary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.summary).toBe('Updated summary');
      expect(responseData.data.tags).toEqual(['updated', 'new']);

      // Verify update in database
      const dbSummary = await db
        .select()
        .from(schema.journalSummaries)
        .where(eq(schema.journalSummaries.id, summary.id))
        .limit(1);

      expect(dbSummary[0].summary).toBe('Updated summary');
      expect(dbSummary[0].tags).toEqual(['updated', 'new']);
    });

    it('should return 404 for non-existent summary', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        summary: 'Updated summary',
      };

      const res = await app.request(`/api/journal-summaries/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(404);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Journal summary not found');
    });

    it('should require authentication', async () => {
      const updateData = {
        summary: 'Updated summary',
      };

      const res = await app.request('/api/journal-summaries/some-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/journal-summaries/:id', () => {
    it('should delete existing summary', async () => {
      const db = testDb();

      // Create test summary
      const [summary] = await db
        .insert(schema.journalSummaries)
        .values({
          userId,
          period: 'week' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          summary: 'Summary to delete',
          tags: ['delete'],
        })
        .returning();

      const res = await app.request(`/api/journal-summaries/${summary.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(summary.id);

      // Verify deletion in database
      const dbSummary = await db
        .select()
        .from(schema.journalSummaries)
        .where(eq(schema.journalSummaries.id, summary.id))
        .limit(1);

      expect(dbSummary).toHaveLength(0);
    });

    it('should return 404 for non-existent summary', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const res = await app.request(`/api/journal-summaries/${nonExistentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Journal summary not found');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/journal-summaries/some-id', {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });
});
