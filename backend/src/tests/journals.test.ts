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

beforeEach(async () => {
  // Create test user and get auth token
  const testUser = {
    name: 'Test User',
    email: getUniqueEmail('journal'),
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

describe('Journal API', () => {
  describe('GET /api/journals/today', () => {
    it('should return null when no journal exists for today', async () => {
      const response = await app.request('/api/journals/today', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.exists).toBe(false);
      expect(data.data.actionText).toBe('Write Journal');
    });

    it("should return today's journal when it exists", async () => {
      const today = new Date().toISOString().split('T')[0];

      // Create a journal for today
      await testDb().insert(journals).values({
        userId: userId,
        date: today,
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request('/api/journals/today', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.exists).toBe(true);
      expect(data.data.journal.date).toBe(today);
      expect(data.data.status).toBe('draft');
      expect(data.data.actionText).toBe('Continue Writing');
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/journals/today');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/journals', () => {
    it('should create a new journal entry', async () => {
      const journalData = {
        date: '2024-01-15',
        content: 'Test journal content',
      };

      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(journalData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(journalData.date);
      expect(data.data.status).toBe('draft');

      // Verify it was saved to database
      const [savedJournal] = await testDb().select().from(journals).where(eq(journals.userId, userId));

      expect(savedJournal).toBeDefined();
      expect(savedJournal.date).toBe(journalData.date);
    });

    it('should not allow duplicate journals for the same date', async () => {
      const journalData = {
        date: '2024-01-15',
        content: 'First journal',
      };

      // Create first journal
      await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(journalData),
      });

      // Try to create second journal for same date
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ...journalData, content: 'Second journal' }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2024-01-15', content: 'Test' }),
      });
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/journals/:date', () => {
    it('should update an existing journal', async () => {
      const date = '2024-01-15';

      // Create initial journal
      await testDb().insert(journals).values({
        userId: userId,
        date,
        status: 'draft',
        chatSession: [],
      });

      const updateData = {
        content: 'Updated content',
      };

      const response = await app.request(`/api/journals/${date}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await app.request('/api/journals/2024-01-15', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content: 'Update' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/journals/:date/start-reflection', () => {
    it('should start the reflection process', async () => {
      const date = '2024-01-15';

      // Create initial journal
      await testDb().insert(journals).values({
        userId: userId,
        date,
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request(`/api/journals/${date}/start-reflection`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('in_review');
      expect(data.data.chatSession).toHaveLength(2); // user + assistant
      expect(data.data.chatSession[0].role).toBe('user');
      expect(data.data.chatSession[1].role).toBe('assistant');
    });

    it('should not allow starting reflection if already in review', async () => {
      const date = '2024-01-15';

      // Create journal already in review
      await testDb()
        .insert(journals)
        .values({
          userId: userId,
          date,
          status: 'in_review',
          chatSession: [{ role: 'assistant', content: 'Initial prompt' }],
        });

      const response = await app.request(`/api/journals/${date}/start-reflection`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('draft status');
    });
  });

  describe('POST /api/journals/:date/chat', () => {
    it('should add a user message and get AI response', async () => {
      const date = '2024-01-15';

      // Create journal in review status
      await testDb()
        .insert(journals)
        .values({
          userId: userId,
          date,
          status: 'in_review',
          chatSession: [{ role: 'assistant', content: 'Initial prompt' }],
        });

      const chatData = {
        message: 'This is my reflection on today.',
      };

      const response = await app.request(`/api/journals/${date}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(chatData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.chatSession).toHaveLength(3); // Initial + user + assistant
      expect(data.data.chatSession[1].role).toBe('user');
      expect(data.data.chatSession[1].content).toBe(chatData.message);
      expect(data.data.chatSession[2].role).toBe('assistant');
    });

    it('should not allow chat if journal is not in review', async () => {
      const date = '2024-01-15';

      // Create journal in draft status
      await testDb().insert(journals).values({
        userId: userId,
        date,
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request(`/api/journals/${date}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ message: 'Test' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('in review status');
    });
  });

  describe('POST /api/journals/:date/finish', () => {
    it('should finish the reflection and mark as complete', async () => {
      const date = '2024-01-15';

      // Create journal in review with messages
      await testDb()
        .insert(journals)
        .values({
          userId: userId,
          date,
          status: 'in_review',
          chatSession: [
            { role: 'assistant', content: 'Initial prompt' },
            { role: 'user', content: 'My reflection' },
            { role: 'assistant', content: 'Follow-up question' },
          ],
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
      expect(data.data.summary).toBeDefined();
    });

    it('should not allow finishing if not in review', async () => {
      const date = '2024-01-15';

      // Create journal in draft status
      await testDb().insert(journals).values({
        userId: userId,
        date,
        status: 'draft',
        chatSession: [],
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
      expect(data.error).toContain('in_review status');
    });
  });

  describe('GET /api/journals/:date', () => {
    it('should get a specific journal by date', async () => {
      const date = '2024-01-15';

      // Create a journal
      await testDb()
        .insert(journals)
        .values({
          userId: userId,
          date,
          status: 'complete',
          chatSession: [{ role: 'user', content: 'Test entry' }],
          summary: 'Test summary',
        });

      const response = await app.request(`/api/journals/${date}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(date);
      expect(data.data.status).toBe('complete');
      expect(data.data.summary).toBe('Test summary');
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await app.request('/api/journals/2024-01-15', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/journals/:date', () => {
    it('should delete a journal', async () => {
      const date = '2024-01-15';

      // Create a journal
      await testDb().insert(journals).values({
        userId: userId,
        date,
        status: 'draft',
        chatSession: [],
      });

      const response = await app.request(`/api/journals/${date}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify it was deleted
      const [deletedJournal] = await testDb().select().from(journals).where(eq(journals.userId, userId));

      expect(deletedJournal).toBeUndefined();
    });

    it('should return 404 for non-existent journal', async () => {
      const response = await app.request('/api/journals/2024-01-15', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });
  });
});
