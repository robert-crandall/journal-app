import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, cleanDatabase } from './setup';
import { focuses } from '../db/schema/focus';
import { eq, and } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Focus API', () => {
  // Test user data
  const testUser = {
    name: 'Focus Test User',
    email: 'focus-test@example.com',
    password: 'password123',
  };

  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Register and login test user
    const registerResponse = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(registerResponse.status).toBe(201);

    const loginResponse = await app.request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        rememberMe: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(loginResponse.status).toBe(200);

    const loginData = await loginResponse.json();
    authToken = loginData.token;
    userId = loginData.user.id;
  });

  describe('PUT /api/focus/:dayOfWeek', () => {
    it('should create a new focus', async () => {
      const focusData = {
        dayOfWeek: 1, // Monday
        title: 'Plan & Organize',
        description: 'Mondays are for planning the week ahead and getting organized',
      };

      const response = await app.request('/api/focus/1', {
        method: 'PUT',
        body: JSON.stringify(focusData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(focusData.title);
      expect(data.data.description).toBe(focusData.description);
      expect(data.data.dayOfWeek).toBe(focusData.dayOfWeek);
      expect(data.data.userId).toBe(userId);
    });

    it('should update an existing focus', async () => {
      // First create a focus
      const initialFocus = {
        dayOfWeek: 1,
        title: 'Initial Focus',
        description: 'Initial description',
      };

      await app.request('/api/focus/1', {
        method: 'PUT',
        body: JSON.stringify(initialFocus),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Now update it
      const updatedFocus = {
        dayOfWeek: 1,
        title: 'Updated Focus Title',
        description: 'Updated description for Monday',
      };

      const response = await app.request('/api/focus/1', {
        method: 'PUT',
        body: JSON.stringify(updatedFocus),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(updatedFocus.title);
      expect(data.data.description).toBe(updatedFocus.description);
    });

    it('should reject invalid day of week', async () => {
      const invalidFocus = {
        dayOfWeek: 7, // Invalid: days are 0-6
        title: 'Invalid Day',
        description: 'This should fail',
      };

      const response = await app.request('/api/focus/7', {
        method: 'PUT',
        body: JSON.stringify(invalidFocus),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should require authentication', async () => {
      const focusData = {
        dayOfWeek: 1,
        title: 'Test Focus',
        description: 'Test Description',
      };

      const response = await app.request('/api/focus/1', {
        method: 'PUT',
        body: JSON.stringify(focusData),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/focus', () => {
    beforeEach(async () => {
      // Create test focuses
      const focusData = [
        {
          dayOfWeek: 0,
          title: 'Rest & Reflect',
          description: 'Sundays are for resting',
        },
        {
          dayOfWeek: 1,
          title: 'Plan & Organize',
          description: 'Mondays are for planning',
        },
        {
          dayOfWeek: 6,
          title: 'Adventure Day',
          description: 'Saturdays are for adventures',
        },
      ];

      for (const focus of focusData) {
        await app.request(`/api/focus/${focus.dayOfWeek}`, {
          method: 'PUT',
          body: JSON.stringify(focus),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    });

    it('should get all focuses for user', async () => {
      const response = await app.request('/api/focus', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].dayOfWeek).toBe(0); // Should be sorted by dayOfWeek
      expect(data.data[1].dayOfWeek).toBe(1);
      expect(data.data[2].dayOfWeek).toBe(6);
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/focus');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/focus/:dayOfWeek', () => {
    beforeEach(async () => {
      // Create a test focus
      await app.request('/api/focus/2', {
        method: 'PUT',
        body: JSON.stringify({
          dayOfWeek: 2,
          title: 'Deep Work',
          description: 'Tuesdays are for focused deep work',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
    });

    it('should get a specific focus by day of week', async () => {
      const response = await app.request('/api/focus/2', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.dayOfWeek).toBe(2);
      expect(data.data.title).toBe('Deep Work');
      expect(data.data.description).toBe('Tuesdays are for focused deep work');
    });

    it('should return 404 for non-existent focus', async () => {
      const response = await app.request('/api/focus/4', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/focus/2');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/focus/batch', () => {
    it('should batch update multiple focuses', async () => {
      const batchFocuses = [
        {
          dayOfWeek: 0,
          title: 'Rest & Reflect',
          description: 'Sundays are for resting and reflecting on the week',
        },
        {
          dayOfWeek: 6,
          title: 'Adventure Day',
          description: 'Saturdays are for adventures and new experiences',
        },
      ];

      const response = await app.request('/api/focus/batch', {
        method: 'POST',
        body: JSON.stringify(batchFocuses),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);

      // Check if both focuses were created correctly
      const sunday = data.data.find((f: any) => f.dayOfWeek === 0);
      const saturday = data.data.find((f: any) => f.dayOfWeek === 6);

      expect(sunday).toBeDefined();
      expect(sunday?.title).toBe('Rest & Reflect');
      expect(saturday).toBeDefined();
      expect(saturday?.title).toBe('Adventure Day');

      // Verify in database
      const db = testDb();
      const dbFocuses = await db.select().from(focuses).where(eq(focuses.userId, userId));
      expect(dbFocuses).toHaveLength(2);
    });

    it('should update existing focuses in batch', async () => {
      // First create a focus
      await app.request('/api/focus/3', {
        method: 'PUT',
        body: JSON.stringify({
          dayOfWeek: 3,
          title: 'Initial Wednesday',
          description: 'Initial description',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Now batch update with one new and one existing focus
      const batchFocuses = [
        {
          dayOfWeek: 3,
          title: 'Updated Wednesday',
          description: 'Updated description',
        },
        {
          dayOfWeek: 4,
          title: 'New Thursday',
          description: 'New description',
        },
      ];

      const response = await app.request('/api/focus/batch', {
        method: 'POST',
        body: JSON.stringify(batchFocuses),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);

      // Verify in database
      const db = testDb();
      const dbFocuses = await db.select().from(focuses).where(eq(focuses.userId, userId));
      expect(dbFocuses).toHaveLength(2);

      const wednesday = dbFocuses.find(f => f.dayOfWeek === 3);
      expect(wednesday?.title).toBe('Updated Wednesday');
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/focus/batch', {
        method: 'POST',
        body: JSON.stringify([{ dayOfWeek: 0, title: 'Test', description: 'Test' }]),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/focus/:dayOfWeek', () => {
    beforeEach(async () => {
      // Create a test focus to delete
      await app.request('/api/focus/5', {
        method: 'PUT',
        body: JSON.stringify({
          dayOfWeek: 5,
          title: 'Focus to Delete',
          description: 'This will be deleted',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
    });

    it('should delete a focus', async () => {
      const response = await app.request('/api/focus/5', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify deletion
      const getResponse = await app.request('/api/focus/5', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(getResponse.status).toBe(404);

      // Verify in database
      const db = testDb();
      const dbFocuses = await db.select().from(focuses).where(
        and(
          eq(focuses.userId, userId),
          eq(focuses.dayOfWeek, 5)
        )
      );
      expect(dbFocuses).toHaveLength(0);
    });

    it('should return 404 for non-existent focus', async () => {
      const response = await app.request('/api/focus/4', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/focus/5', {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });
  });
});
