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

describe('User Attributes API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };

  beforeEach(async () => {
    // Generate unique email for each test
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('userattributes'),
      password: 'password123',
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

  describe('POST /api/user-attributes', () => {
    it('should create a new user attribute', async () => {
      const attributeData = {
        category: 'priorities',
        value: 'family',
        source: 'user_set',
      };

      const response = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.category).toBe('priorities');
      expect(data.data.value).toBe('family');
      expect(data.data.source).toBe('user_set');
      expect(data.data.userId).toBe(userId);
    });

    it('should create attribute with default source when not provided', async () => {
      const attributeData = {
        category: 'values',
        value: 'creativity',
      };

      const response = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.source).toBe('user_set');
    });

    it('should reject attribute with invalid category', async () => {
      const attributeData = {
        category: '', // Empty category
        value: 'family',
      };

      const response = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate attribute (same user, category, value)', async () => {
      const attributeData = {
        category: 'priorities',
        value: 'family',
      };

      // Create first attribute
      const firstResponse = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(firstResponse.status).toBe(201);

      // Try to create duplicate
      const duplicateResponse = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(duplicateResponse.status).toBe(500); // Database constraint violation
    });

    it('should require authentication', async () => {
      const attributeData = {
        category: 'priorities',
        value: 'family',
      };

      const response = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/user-attributes', () => {
    beforeEach(async () => {
      // Create some test attributes
      const attributes = [
        { category: 'priorities', value: 'family', source: 'user_set' },
        { category: 'priorities', value: 'health', source: 'gpt_summary' },
        { category: 'values', value: 'creativity', source: 'user_set' },
        { category: 'motivators', value: 'accomplishment', source: 'journal_analysis' },
      ];

      for (const attr of attributes) {
        await app.request('/api/user-attributes', {
          method: 'POST',
          body: JSON.stringify(attr),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    });

    it('should get all user attributes', async () => {
      const response = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(4);
      
      // Check ordering by category then value
      expect(data.data[0].category).toBe('motivators');
      expect(data.data[1].category).toBe('priorities');
      expect(data.data[2].category).toBe('priorities');
      expect(data.data[3].category).toBe('values');
    });

    it('should filter by category', async () => {
      const response = await app.request('/api/user-attributes?category=priorities', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data.every((attr: any) => attr.category === 'priorities')).toBe(true);
    });

    it('should filter by source', async () => {
      const response = await app.request('/api/user-attributes?source=user_set', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data.every((attr: any) => attr.source === 'user_set')).toBe(true);
    });

    it('should filter by both category and source', async () => {
      const response = await app.request('/api/user-attributes?category=priorities&source=user_set', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].category).toBe('priorities');
      expect(data.data[0].source).toBe('user_set');
      expect(data.data[0].value).toBe('family');
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/user-attributes');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/user-attributes/grouped', () => {
    beforeEach(async () => {
      // Create some test attributes
      const attributes = [
        { category: 'priorities', value: 'family', source: 'user_set' },
        { category: 'priorities', value: 'health', source: 'gpt_summary' },
        { category: 'values', value: 'creativity', source: 'user_set' },
        { category: 'motivators', value: 'accomplishment', source: 'journal_analysis' },
      ];

      for (const attr of attributes) {
        await app.request('/api/user-attributes', {
          method: 'POST',
          body: JSON.stringify(attr),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    });

    it('should get attributes grouped by category', async () => {
      const response = await app.request('/api/user-attributes/grouped', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      
      const grouped = data.data;
      expect(Object.keys(grouped)).toHaveLength(3);
      expect(grouped.priorities).toHaveLength(2);
      expect(grouped.values).toHaveLength(1);
      expect(grouped.motivators).toHaveLength(1);
      
      // Check specific values
      expect(grouped.priorities.map((attr: any) => attr.value).sort()).toEqual(['family', 'health']);
      expect(grouped.values[0].value).toBe('creativity');
      expect(grouped.motivators[0].value).toBe('accomplishment');
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/user-attributes/grouped');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/user-attributes/:id', () => {
    let attributeId: string;

    beforeEach(async () => {
      const attributeData = {
        category: 'priorities',
        value: 'family',
      };

      const createResponse = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createData = await createResponse.json();
      attributeId = createData.data.id;
    });

    it('should get specific attribute by id', async () => {
      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(attributeId);
      expect(data.data.category).toBe('priorities');
      expect(data.data.value).toBe('family');
    });

    it('should return 404 for non-existent attribute', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await app.request(`/api/user-attributes/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.request(`/api/user-attributes/${attributeId}`);
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/user-attributes/:id', () => {
    let attributeId: string;

    beforeEach(async () => {
      const attributeData = {
        category: 'priorities',
        value: 'family',
        source: 'user_set',
      };

      const createResponse = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createData = await createResponse.json();
      attributeId = createData.data.id;
    });

    it('should update attribute', async () => {
      const updateData = {
        value: 'work-life balance',
        source: 'gpt_summary',
      };

      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.value).toBe('work-life balance');
      expect(data.data.source).toBe('gpt_summary');
      expect(data.data.category).toBe('priorities'); // Unchanged
    });

    it('should return 404 for non-existent attribute', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = { value: 'updated value' };

      const response = await app.request(`/api/user-attributes/${fakeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const updateData = { value: 'updated value' };

      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/user-attributes/:id', () => {
    let attributeId: string;

    beforeEach(async () => {
      const attributeData = {
        category: 'priorities',
        value: 'family',
      };

      const createResponse = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createData = await createResponse.json();
      attributeId = createData.data.id;
    });

    it('should delete attribute', async () => {
      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify it's actually deleted
      const getResponse = await app.request(`/api/user-attributes/${attributeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent attribute', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await app.request(`/api/user-attributes/${fakeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('User isolation', () => {
    let otherAuthToken: string;
    let otherUserId: string;
    let attributeId: string;

    beforeEach(async () => {
      // Create another user
      const otherUser = {
        name: 'Other User',
        email: getUniqueEmail('userattributes-other'),
        password: 'password123',
      };

      const registerRes = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(otherUser),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const registerData = await registerRes.json();
      otherAuthToken = registerData.token;
      otherUserId = registerData.user.id;

      // Create attribute for first user
      const attributeData = {
        category: 'priorities',
        value: 'family',
      };

      const createResponse = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createData = await createResponse.json();
      attributeId = createData.data.id;
    });

    it('should not allow accessing other users attributes', async () => {
      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should not allow updating other users attributes', async () => {
      const updateData = { value: 'updated by other user' };

      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherAuthToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should not allow deleting other users attributes', async () => {
      const response = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should only return own attributes in listings', async () => {
      // Create attribute for other user
      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify({
          category: 'values',
          value: 'independence',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherAuthToken}`,
        },
      });

      // First user should only see their own attribute
      const firstUserResponse = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const firstUserData = await firstUserResponse.json();
      expect(firstUserData.data).toHaveLength(1);
      expect(firstUserData.data[0].userId).toBe(userId);

      // Other user should only see their own attribute
      const otherUserResponse = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
        },
      });

      const otherUserData = await otherUserResponse.json();
      expect(otherUserData.data).toHaveLength(1);
      expect(otherUserData.data[0].userId).toBe(otherUserId);
    });
  });
});
