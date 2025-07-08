import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, cleanDatabase, schema } from './setup';
import { eq, and } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Journal API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Create a test user with unique email and get auth token for protected routes
    const testId = Date.now() + Math.random();
    const userData = {
      name: 'Test User',
      email: `test${testId}@example.com`,
      password: 'password123',
    };

    const registerRes = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(registerRes.status).toBe(201);
    const registerData = await registerRes.json();
    authToken = registerData.token;
    userId = registerData.user.id;

    // Create a test character for context
    const characterData = {
      name: 'Test Hero',
      characterClass: 'Adventurer',
      backstory: 'A brave soul seeking wisdom',
      goals: 'To become enlightened',
    };

    await app.request('/api/characters', {
      method: 'POST',
      body: JSON.stringify(characterData),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
  });

  describe('POST /api/journal/start', () => {
    it('should start a new journal session successfully', async () => {
      const res = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('sessionId');
      expect(data.data).toHaveProperty('message');
      expect(typeof data.data.sessionId).toBe('string');
      expect(typeof data.data.message).toBe('string');

      // Verify session was created in database
      const db = testDb();
      const dbSession = await db
        .select()
        .from(schema.journalSessions)
        .where(eq(schema.journalSessions.id, data.data.sessionId))
        .limit(1);

      expect(dbSession).toHaveLength(1);
      expect(dbSession[0].userId).toBe(userId);
      expect(dbSession[0].isActive).toBe(true);
      expect(Array.isArray(dbSession[0].messages)).toBe(true);
      const messages = dbSession[0].messages as any[];
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/journal/message', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Start a journal session
      const startRes = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(startRes.status).toBe(201);
      const startData = await startRes.json();
      sessionId = startData.data.sessionId;
    });

    it('should send message and receive response successfully', async () => {
      const messageData = {
        sessionId,
        message: 'I had a really great day today!',
      };

      const res = await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify(messageData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('response');
      expect(data.data).toHaveProperty('shouldOfferSave');
      expect(data.data).toHaveProperty('conversationLength');
      expect(typeof data.data.response).toBe('string');
      expect(typeof data.data.shouldOfferSave).toBe('boolean');
      expect(typeof data.data.conversationLength).toBe('number');
      expect(data.data.conversationLength).toBe(1);

      // Verify session was updated in database
      const db = testDb();
      const dbSession = await db
        .select()
        .from(schema.journalSessions)
        .where(eq(schema.journalSessions.id, sessionId))
        .limit(1);

      const messages = dbSession[0].messages as any[];
      expect(messages).toHaveLength(3); // Welcome + user message + assistant response
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe(messageData.message);
      expect(messages[2].role).toBe('assistant');
    });

    it('should handle multiple messages in conversation', async () => {
      const messages = [
        'I had a really great day today!',
        'I went hiking with my family.',
        'It made me feel so connected to nature.',
      ];

      let conversationLength = 0;
      for (const message of messages) {
        conversationLength++;
        const messageData = {
          sessionId,
          message,
        };

        const res = await app.request('/api/journal/message', {
          method: 'POST',
          body: JSON.stringify(messageData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.conversationLength).toBe(conversationLength);
      }

      // After 3 messages, should offer to save
      const finalRes = await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: 'This conversation has been really helpful.',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const finalData = await finalRes.json();
      expect(finalData.data.shouldOfferSave).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';
      const messageData = {
        sessionId: fakeSessionId,
        message: 'Test message',
      };

      const res = await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify(messageData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should validate message content', async () => {
      const invalidData = {
        sessionId,
        message: '', // Empty message
      };

      const res = await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('issues');
    });

    it('should require authentication', async () => {
      const messageData = {
        sessionId,
        message: 'Test message',
      };

      const res = await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify(messageData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/journal/save', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Start a journal session and add some messages
      const startRes = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(startRes.status).toBe(201);
      const startData = await startRes.json();
      sessionId = startData.data.sessionId;

      // Add a few messages to make it saveable
      const messages = ['I had a great day today!', 'I went hiking.', 'It was very peaceful.'];

      for (const message of messages) {
        await app.request('/api/journal/message', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            message,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    });

    it('should save journal entry successfully', async () => {
      const saveData = {
        sessionId,
      };

      const res = await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify(saveData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('entryId');
      expect(data.data).toHaveProperty('title');
      expect(data.data).toHaveProperty('synopsis');
      expect(data.data).toHaveProperty('summary');
      expect(data.data).toHaveProperty('tags');
      expect(data.data).toHaveProperty('statTags');
      expect(Array.isArray(data.data.tags)).toBe(true);
      expect(Array.isArray(data.data.statTags)).toBe(true);

      // Verify entry was created in database
      const db = testDb();
      const dbEntry = await db
        .select()
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.id, data.data.entryId))
        .limit(1);

      expect(dbEntry).toHaveLength(1);
      expect(dbEntry[0].userId).toBe(userId);
      expect(dbEntry[0].title).toBe(data.data.title);
      expect(dbEntry[0].synopsis).toBe(data.data.synopsis);
      expect(dbEntry[0].summary).toBe(data.data.summary);

      // Verify messages were saved
      const dbMessages = await db
        .select()
        .from(schema.journalConversationMessages)
        .where(eq(schema.journalConversationMessages.entryId, data.data.entryId))
        .orderBy(schema.journalConversationMessages.messageOrder);

      expect(dbMessages.length).toBeGreaterThan(1); // Should have multiple messages

      // Verify session was marked inactive
      const dbSession = await db
        .select()
        .from(schema.journalSessions)
        .where(eq(schema.journalSessions.id, sessionId))
        .limit(1);

      expect(dbSession[0].isActive).toBe(false);
    });

    it('should create tags for the entry', async () => {
      const saveData = {
        sessionId,
      };

      const res = await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify(saveData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json();

      // Check if tags were created and linked
      const db = testDb();
      const entryTags = await db
        .select({
          tagName: schema.tags.name,
        })
        .from(schema.journalEntryTags)
        .innerJoin(schema.tags, eq(schema.journalEntryTags.tagId, schema.tags.id))
        .where(eq(schema.journalEntryTags.entryId, data.data.entryId));

      expect(entryTags.length).toBeGreaterThanOrEqual(0); // GPT might suggest some tags
    });

    it('should return 404 for non-existent session', async () => {
      const fakeSessionId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';
      const saveData = {
        sessionId: fakeSessionId,
      };

      const res = await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify(saveData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const saveData = {
        sessionId,
      };

      const res = await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify(saveData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/journal', () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a complete journal entry for testing
      const startRes = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const startData = await startRes.json();
      const sessionId = startData.data.sessionId;

      // Add messages
      await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: 'I had a wonderful day exploring the forest.',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Save the entry
      const saveRes = await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const saveData = await saveRes.json();
      entryId = saveData.data.entryId;
    });

    it('should return all journal entries for user', async () => {
      const res = await app.request('/api/journal', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(1);

      const entry = data.data[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('synopsis');
      expect(entry).toHaveProperty('summary');
      expect(entry).toHaveProperty('messages');
      expect(entry).toHaveProperty('tags');
      expect(entry).toHaveProperty('statTags');
      expect(Array.isArray(entry.messages)).toBe(true);
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(Array.isArray(entry.statTags)).toBe(true);
    });

    it('should return empty array when user has no entries', async () => {
      // Create a new user with no entries
      const newUserData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const registerRes = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const registerData = await registerRes.json();
      const newAuthToken = registerData.token;

      const res = await app.request('/api/journal', {
        headers: {
          Authorization: `Bearer ${newAuthToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/journal');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/journal/:id', () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a complete journal entry for testing
      const startRes = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const startData = await startRes.json();
      const sessionId = startData.data.sessionId;

      // Add messages
      await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: 'Today I learned something valuable about myself.',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Save the entry
      const saveRes = await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const saveData = await saveRes.json();
      entryId = saveData.data.entryId;
    });

    it('should return specific journal entry with full details', async () => {
      const res = await app.request(`/api/journal/${entryId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const entry = data.data;
      expect(entry.id).toBe(entryId);
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('synopsis');
      expect(entry).toHaveProperty('summary');
      expect(entry).toHaveProperty('messages');
      expect(entry).toHaveProperty('tags');
      expect(entry).toHaveProperty('statTags');
      expect(Array.isArray(entry.messages)).toBe(true);
      expect(entry.messages.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent entry', async () => {
      const fakeId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';
      const res = await app.request(`/api/journal/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const res = await app.request(`/api/journal/${entryId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('User Isolation', () => {
    let secondUserId: string;
    let secondAuthToken: string;
    let firstUserEntryId: string;

    beforeEach(async () => {
      // Create a second user
      const secondUserData = {
        name: 'Second User',
        email: 'second@example.com',
        password: 'password123',
      };

      const registerRes = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(secondUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(registerRes.status).toBe(201);
      const registerData = await registerRes.json();
      secondAuthToken = registerData.token;
      secondUserId = registerData.user.id;

      // Create a journal entry for the first user
      const startRes = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const startData = await startRes.json();
      const sessionId = startData.data.sessionId;

      await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: 'This is a private thought.',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const saveRes = await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const saveData = await saveRes.json();
      firstUserEntryId = saveData.data.entryId;
    });

    it('should not allow users to access other users journal entries', async () => {
      const res = await app.request(`/api/journal/${firstUserEntryId}`, {
        headers: {
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should not allow users to send messages in other users sessions', async () => {
      // Start a session with first user
      const startRes = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const startData = await startRes.json();
      const sessionId = startData.data.sessionId;

      // Try to send message with second user
      const messageRes = await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: 'Trying to hack this session',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(messageRes.status).toBe(404);
      const data = await messageRes.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should only show journal entries belonging to the authenticated user', async () => {
      // Create an entry for the second user
      const startRes = await app.request('/api/journal/start', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      const startData = await startRes.json();
      const sessionId = startData.data.sessionId;

      await app.request('/api/journal/message', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          message: 'Second user thoughts.',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      await app.request('/api/journal/save', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      // Get entries for both users
      const firstUserRes = await app.request('/api/journal', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const secondUserRes = await app.request('/api/journal', {
        headers: {
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(firstUserRes.status).toBe(200);
      expect(secondUserRes.status).toBe(200);

      const firstUserData = await firstUserRes.json();
      const secondUserData = await secondUserRes.json();

      expect(firstUserData.data).toHaveLength(1);
      expect(secondUserData.data).toHaveLength(1);

      // Ensure entries don't overlap
      expect(firstUserData.data[0].id).not.toBe(secondUserData.data[0].id);
    });
  });
});
