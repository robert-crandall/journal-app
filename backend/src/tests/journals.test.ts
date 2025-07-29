import { app } from '../app';
import { Hono } from 'hono';
import { createTestUser, testDb } from './setup';
import { journals } from '../db/schema';
import { createAuth } from '../utils/auth';
import { sql } from 'drizzle-orm';
import { expect, it, describe, beforeEach } from 'vitest';

describe('Journal API', () => {
  let userId: number;
  let authToken: string;
  let testApp: Hono;

  beforeEach(async () => {
    const auth = createAuth();
    testApp = app;
    const user = await createTestUser();
    userId = user.id;
    authToken = await auth.createToken(userId);

    // Clean up any journals from previous tests
    await testDb()
      .delete(journals)
      .where(sql`1=1`);
  });

  describe('GET /api/journals/today', () => {
    it('should return null when no journal exists for today', async () => {
      const response = await testApp.request('/api/journals/today', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBe(null);
    });

    it("should return today's journal when it exists", async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Insert a journal for today
      await testDb().insert(journals).values({
        userId: userId,
        date: today,
        content: "Today's journal entry",
        status: 'draft',
        chatSession: [],
      });

      const response = await testApp.request('/api/journals/today', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).not.toBe(null);
      expect(data.data.date).toBe(today);
      expect(data.data.content).toBe("Today's journal entry");
    });

    it('should require authentication', async () => {
      const response = await testApp.request('/api/journals/today', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/journals', () => {
    it('should create a new journal entry', async () => {
      const date = '2023-12-25';
      const response = await testApp.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          content: 'Christmas journal entry',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
      expect(data.data.content).toBe('Christmas journal entry');
      expect(data.data.status).toBe('draft');
    });

    it('should not allow duplicate journals for the same date', async () => {
      const date = '2023-12-26';

      // Create the first journal
      await testApp.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          content: 'First entry',
        }),
      });

      // Try to create another journal for the same date
      const response = await testApp.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          content: 'Second entry',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should require authentication', async () => {
      const response = await testApp.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: '2023-12-27',
          content: 'Test entry',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/journals/:date', () => {
    it('should update an existing journal', async () => {
      const date = '2024-01-01';

      // Create a journal first
      await testDb().insert(journals).values({
        userId,
        date,
        content: 'Original content',
        status: 'draft',
        chatSession: [],
      });

      // Update the journal
      const response = await testApp.request(`/api/journals/${date}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: 'Updated content',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
      expect(data.data.content).toBe('Updated content');
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await testApp.request('/api/journals/2099-12-31', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: "This journal doesn't exist",
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/journals/:date/start-reflection', () => {
    it('should start the reflection process', async () => {
      const date = '2024-01-10';

      // Create a draft journal
      await testDb().insert(journals).values({
        userId,
        date,
        content: 'Draft content',
        status: 'draft',
        chatSession: [],
      });

      const response = await testApp.request(`/api/journals/${date}/start-reflection`, {
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
        .insert(journals)
        .values({
          userId,
          date,
          content: 'In review content',
          status: 'in_review',
          chatSession: [{ role: 'system', content: 'Initial message' }],
        });

      const response = await testApp.request(`/api/journals/${date}/start-reflection`, {
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
        .insert(journals)
        .values({
          userId,
          date,
          content: 'Journal content for chat',
          status: 'in_review',
          chatSession: [{ role: 'system', content: 'Initial message' }],
        });

      const response = await testApp.request(`/api/journals/${date}/chat`, {
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
      await testDb().insert(journals).values({
        userId,
        date,
        content: 'Draft journal',
        status: 'draft',
        chatSession: [],
      });

      const response = await testApp.request(`/api/journals/${date}/chat`, {
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
        .insert(journals)
        .values({
          userId,
          date,
          content: 'Journal content',
          status: 'in_review',
          chatSession: [{ role: 'system', content: 'Initial message' }],
        });

      const response = await testApp.request(`/api/journals/${date}/finish`, {
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
      expect(data.data.status).toBe('completed');
      expect(data.data.summary).toBeTruthy();
    });

    it('should not allow finishing if already completed', async () => {
      const date = '2024-01-15';

      // Create journal in completed status
      await testDb().insert(journals).values({
        userId: userId,
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
      expect(data.error).toContain('already completed');
    });
  });

  describe('GET /api/journals/:date', () => {
    it('should get a specific journal by date', async () => {
      const date = '2024-01-16';

      // Create a journal
      await testDb().insert(journals).values({
        userId,
        date,
        content: 'Journal content',
        status: 'draft',
        chatSession: [],
      });

      const response = await testApp.request(`/api/journals/${date}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
      expect(data.data.content).toBe('Journal content');
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await testApp.request('/api/journals/2099-01-01', {
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
      await testDb().insert(journals).values({
        userId,
        date,
        content: 'Journal to delete',
        status: 'draft',
        chatSession: [],
      });

      const response = await testApp.request(`/api/journals/${date}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      // Verify it's deleted
      const checkResponse = await testApp.request(`/api/journals/${date}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await testApp.request('/api/journals/2099-01-02', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
