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

describe('Quests API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    const userData = {
      name: 'Test User',
      email: getUniqueEmail('quest'), // Unique per test
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
  });

  describe('Quest CRUD Operations', () => {
    it('should create a new quest', async () => {
      const questData = {
        title: 'My Test Quest',
        summary: 'A quest for testing purposes',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const response = await app.request('/api/quests', {
        method: 'POST',
        body: JSON.stringify(questData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(questData.title);
      expect(result.data.summary).toBe(questData.summary);
      expect(result.data.startDate).toBe(questData.startDate);
      expect(result.data.endDate).toBe(questData.endDate);
      expect(result.data.status).toBe('active');
    });

    it('should get all quests for a user', async () => {
      // First create a quest
      const questData = {
        title: 'Test Quest for Listing',
        summary: 'A quest to test listing',
        startDate: '2024-01-01',
      };

      await app.request('/api/quests', {
        method: 'POST',
        body: JSON.stringify(questData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Now get all quests
      const response = await app.request('/api/quests', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].title).toBe(questData.title);
    });

    it('should get a specific quest by ID', async () => {
      // First create a quest
      const questData = {
        title: 'Specific Quest Test',
        summary: 'Testing getting a specific quest',
        startDate: '2024-01-01',
      };

      const createResponse = await app.request('/api/quests', {
        method: 'POST',
        body: JSON.stringify(questData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createResult = await createResponse.json();
      const questId = createResult.data.id;

      // Now get the specific quest
      const response = await app.request(`/api/quests/${questId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(questId);
      expect(result.data.title).toBe(questData.title);
    });

    it('should update a quest', async () => {
      // First create a quest
      const questData = {
        title: 'Quest to Update',
        summary: 'Original summary',
        startDate: '2024-01-01',
      };

      const createResponse = await app.request('/api/quests', {
        method: 'POST',
        body: JSON.stringify(questData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createResult = await createResponse.json();
      const questId = createResult.data.id;

      // Now update the quest
      const updateData = {
        title: 'Updated Quest Title',
        summary: 'Updated summary',
        endDate: '2024-12-31',
      };

      const response = await app.request(`/api/quests/${questId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(updateData.title);
      expect(result.data.summary).toBe(updateData.summary);
      expect(result.data.endDate).toBe(updateData.endDate);
    });

    it('should delete a quest', async () => {
      // First create a quest
      const questData = {
        title: 'Quest to Delete',
        summary: 'This quest will be deleted',
        startDate: '2024-01-01',
      };

      const createResponse = await app.request('/api/quests', {
        method: 'POST',
        body: JSON.stringify(questData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createResult = await createResponse.json();
      const questId = createResult.data.id;

      // Now delete the quest
      const response = await app.request(`/api/quests/${questId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify the quest is deleted
      const getResponse = await app.request(`/api/quests/${questId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Quest Validation', () => {
    it('should reject quest creation without required fields', async () => {
      const invalidQuestData = {
        summary: 'Missing title and start date',
      };

      const response = await app.request('/api/quests', {
        method: 'POST',
        body: JSON.stringify(invalidQuestData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });

    it('should reject unauthorized requests', async () => {
      const questData = {
        title: 'Unauthorized Quest',
        startDate: '2024-01-01',
      };

      const response = await app.request('/api/quests', {
        method: 'POST',
        body: JSON.stringify(questData),
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header
        },
      });

      expect(response.status).toBe(401);
    });
  });
});
