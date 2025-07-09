import { describe, test, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, cleanDatabase, schema } from './setup';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

// Test setup data
const testUser = {
  name: 'Journal Test User',
  email: 'journal.test@example.com',
  password: 'password123',
};

describe('Journal API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create test user
    const [user] = await testDb().insert(schema.users).values(testUser).returning();
    userId = user.id;
    
    // Generate JWT token
    authToken = await sign(
      {
        id: userId,
        email: user.email,
        name: user.name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      },
      JWT_SECRET,
    );
  });

  describe('GET /api/journal', () => {
    test('should return empty array when user has no journal entries', async () => {
      const res = await app.request('/api/journal', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    test('should require authentication', async () => {
      const res = await app.request('/api/journal', {
        method: 'GET',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/journal', () => {
    test('should create a new journal entry successfully', async () => {
      const journalData = {
        rawContent: 'Today was a good day for learning.',
        conversationHistory: [],
      };

      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journalData),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        rawContent: 'Today was a good day for learning.',
        isProcessed: false,
      });
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
    });

    test('should create minimal journal entry with only required fields', async () => {
      const journalData = {
        rawContent: 'Simple journal entry.',
      };

      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journalData),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        rawContent: 'Simple journal entry.',
        isProcessed: false,
      });
    });

    test('should require authentication', async () => {
      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawContent: 'Test entry' }),
      });

      expect(res.status).toBe(401);
    });

    test('should validate required fields', async () => {
      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
      expect(body.error.issues).toBeDefined();
      expect(body.error.issues.some((issue: any) => issue.path.includes('rawContent'))).toBe(true);
    });
  });

  describe('PUT /api/journal/:id', () => {
    test('should update journal entry successfully', async () => {
      // Create a journal entry
      const createRes = await app.request('/api/journal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawContent: 'Original entry' }),
      });

      const createBody = await createRes.json();
      const entryId = createBody.data.id;

      // Update the journal entry
      const updateData = {
        rawContent: 'Updated entry content',
      };

      const res = await app.request(`/api/journal/${entryId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: entryId,
        rawContent: 'Updated entry content',
      });
    });

    test('should return 404 for non-existent journal entry', async () => {
      const res = await app.request('/api/journal/00000000-0000-0000-0000-000000000000', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawContent: 'Updated entry' }),
      });

      expect(res.status).toBe(404);
    });
  });

  // Note: XP granting functionality exists but may need refinement for proper testing
});
