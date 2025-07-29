import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { sql } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Journal API', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('journals'),
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

    // Clean up any journals from previous tests
    await testDb()
      .delete(schema.journals)
      .where(sql`1=1`);
  });

  describe('GET /api/journals/today', () => {
    it('should return null when no journal exists for today', async () => {
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
    });

    it("should return today's journal when it exists", async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Insert a journal for today
      await testDb().insert(schema.journals).values({
        userId: userId,
        date: today,
        initialMessage: "Today's journal entry",
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request('/api/journals/today', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.exists).toBe(true);
      expect(data.data.journal).not.toBe(null);
      expect(data.data.journal.date).toBe(today);
      expect(data.data.journal.initialMessage).toBe("Today's journal entry");
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/journals/today', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/journals', () => {
    it('should create a new journal entry', async () => {
      const date = '2023-12-25';
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          initialMessage: 'Christmas journal entry',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
      expect(data.data.initialMessage).toBe('Christmas journal entry');
      expect(data.data.status).toBe('draft');
    });

    it('should not allow duplicate journals for the same date', async () => {
      const date = '2023-12-26';

      // Create the first journal
      await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          initialMessage: 'First entry',
        }),
      });

      // Try to create another journal for the same date
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          initialMessage: 'Second entry',
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: '2023-12-27',
          initialMessage: 'Test entry',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/journals/:date', () => {
    it('should update an existing journal', async () => {
      const date = '2024-01-01';

      // Create a journal first
      await testDb().insert(schema.journals).values({
        userId,
        date,
        initialMessage: 'Original content',
        status: 'draft',
        chatSession: [],
      });

      // Update the journal
      const response = await app.request(`/api/journals/${date}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          initialMessage: 'Updated content',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
      expect(data.data.initialMessage).toBe('Updated content');
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await app.request('/api/journals/2099-12-31', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          initialMessage: "This journal doesn't exist",
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/journals/:date/start-reflection', () => {
    it('should start the reflection process', async () => {
      const date = '2024-01-10';

      // Create a draft journal
      await testDb().insert(schema.journals).values({
        userId,
        date,
        initialMessage: 'Draft content',
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request(`/api/journals/${date}/start-reflection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('in_review');
      expect(data.data.chatSession).toBeTruthy();
      expect(data.data.chatSession.length).toBeGreaterThan(0);
    });

    it('should not allow starting reflection if already in review', async () => {
      const date = '2024-01-11';

      // Create a journal already in review
      await testDb()
        .insert(schema.journals)
        .values({
          userId,
          date,
          initialMessage: 'In review content',
          status: 'in_review',
          chatSession: [{ role: 'system', content: 'Initial message' }],
        });

      const response = await app.request(`/api/journals/${date}/start-reflection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/journals/:date/chat', () => {
    it('should add a user message and get AI response', async () => {
      const date = '2024-01-12';

      // Create a journal in review
      await testDb()
        .insert(schema.journals)
        .values({
          userId,
          date,
          initialMessage: 'Journal content for chat',
          status: 'in_review',
          chatSession: [{ role: 'system', content: 'Initial message' }],
        });

      const response = await app.request(`/api/journals/${date}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: 'User message',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.chatSession.length).toBeGreaterThan(1);
    });

    it('should not allow chat if journal is not in review', async () => {
      const date = '2024-01-13';

      // Create a draft journal
      await testDb().insert(schema.journals).values({
        userId,
        date,
        initialMessage: 'Draft journal',
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request(`/api/journals/${date}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: 'User message',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/journals/:date/finish', () => {
    it('should finish the reflection and mark as complete', async () => {
      const date = '2024-01-14';

      // Create journal in review status
      await testDb()
        .insert(schema.journals)
        .values({
          userId,
          date,
          initialMessage: 'Journal content',
          status: 'in_review',
          chatSession: [{ role: 'system', content: 'Initial message' }],
        });

      const response = await app.request(`/api/journals/${date}/finish`, {
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
      expect(data.data.status).toBe('complete');
      expect(data.data.summary).toBeTruthy();
    });

    it('should not allow finishing if already completed', async () => {
      const date = '2024-01-15';

      // Create journal in completed status
      await testDb().insert(schema.journals).values({
        userId,
        date,
        status: 'completed',
        chatSession: [],
        summary: 'Already completed summary',
      });

      const response = await app.request(`/api/journals/${date}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Can only finish journal');
    });
  });

  describe('GET /api/journals/:date', () => {
    it('should get a specific journal by date', async () => {
      const date = '2024-01-16';

      // Create a journal
      await testDb().insert(schema.journals).values({
        userId,
        date,
        initialMessage: 'Journal content',
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request(`/api/journals/${date}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
      expect(data.data.initialMessage).toBe('Journal content');
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await app.request('/api/journals/2099-01-01', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/journals/:date', () => {
    it('should delete a journal', async () => {
      const date = '2024-01-17';

      // Create a journal
      await testDb().insert(schema.journals).values({
        userId,
        date,
        initialMessage: 'Journal to delete',
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request(`/api/journals/${date}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      // Verify it's deleted
      const checkResponse = await app.request(`/api/journals/${date}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await app.request('/api/journals/2099-01-02', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
