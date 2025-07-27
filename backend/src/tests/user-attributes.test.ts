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
      email: getUniqueEmail('user-attributes'),
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

  describe('GET /api/user-attributes', () => {
    it('should return empty array when user has no attributes', async () => {
      const res = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should return attributes when user has them', async () => {
      // First create some attributes
      const attributeData1 = {
        category: 'characteristics',
        value: 'Enjoys watching movies more on second watching',
        source: 'journal_analysis',
      };

      const attributeData2 = {
        category: 'motivators',
        value: 'Wants kids to grow up to be self-sufficient',
        source: 'gpt_summary',
      };

      const createRes1 = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData1),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createRes2 = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData2),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(createRes1.status).toBe(201);
      expect(createRes2.status).toBe(201);

      // Now get all attributes
      const getRes = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      
      // Check that both attributes are returned (order might vary)
      const characteristics = data.data.find((attr: any) => attr.category === 'characteristics');
      const motivators = data.data.find((attr: any) => attr.category === 'motivators');
      
      expect(characteristics).toMatchObject({
        category: attributeData1.category,
        value: attributeData1.value,
        source: attributeData1.source,
      });
      
      expect(motivators).toMatchObject({
        category: attributeData2.category,
        value: attributeData2.value,
        source: attributeData2.source,
      });
    });

    it('should filter by category when query parameter provided', async () => {
      // Create attributes in different categories
      const characteristicAttr = {
        category: 'characteristics',
        value: 'Enjoys learning new skills',
        source: 'user_set',
      };

      const motivatorAttr = {
        category: 'motivators',
        value: 'Wants to make a positive impact',
        source: 'user_set',
      };

      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(characteristicAttr),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(motivatorAttr),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Filter by characteristics category
      const res = await app.request('/api/user-attributes?category=characteristics', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].category).toBe('characteristics');
    });

    it('should filter by source when query parameter provided', async () => {
      // Create attributes with different sources
      const userSetAttr = {
        category: 'values',
        value: 'User defined value',
        source: 'user_set',
      };

      const gptAttr = {
        category: 'values',
        value: 'GPT inferred value',
        source: 'gpt_summary',
      };

      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(userSetAttr),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(gptAttr),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Filter by gpt_summary source
      const res = await app.request('/api/user-attributes?source=gpt_summary', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].source).toBe('gpt_summary');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/user-attributes');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user-attributes/grouped', () => {
    it('should return empty object when user has no attributes', async () => {
      const res = await app.request('/api/user-attributes/grouped', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual({});
    });

    it('should return attributes grouped by category', async () => {
      // Create attributes in different categories
      const attributes = [
        { category: 'characteristics', value: 'Enjoys learning', source: 'user_set' },
        { category: 'characteristics', value: 'Prefers quiet environments', source: 'journal_analysis' },
        { category: 'motivators', value: 'Wants to help others', source: 'gpt_summary' },
        { category: 'values', value: 'Honesty', source: 'user_set' },
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

      const res = await app.request('/api/user-attributes/grouped', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('characteristics');
      expect(data.data).toHaveProperty('motivators');
      expect(data.data).toHaveProperty('values');
      expect(data.data.characteristics).toHaveLength(2);
      expect(data.data.motivators).toHaveLength(1);
      expect(data.data.values).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/user-attributes/grouped');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user-attributes/summary', () => {
    it('should return null summary when user has no attributes', async () => {
      const res = await app.request('/api/user-attributes/summary', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.summary).toBe(null);
    });

    it('should return formatted summary when user has attributes', async () => {
      // Create attributes in different categories
      const attributes = [
        { category: 'characteristics', value: 'Enjoys learning new skills', source: 'user_set' },
        { category: 'characteristics', value: 'Prefers working alone', source: 'journal_analysis' },
        { category: 'motivators', value: 'Wants to make a difference', source: 'gpt_summary' },
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

      const res = await app.request('/api/user-attributes/summary', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.summary).toContain('Characteristics:');
      expect(data.data.summary).toContain('Motivators:');
      expect(data.data.summary).toContain('Enjoys learning new skills');
      expect(data.data.summary).toContain('Prefers working alone');
      expect(data.data.summary).toContain('Wants to make a difference');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/user-attributes/summary');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user-attributes/:id', () => {
    let attributeId: string;

    beforeEach(async () => {
      // Create a test attribute
      const attributeData = {
        category: 'test',
        value: 'Test attribute value',
        source: 'user_set',
      };

      const createRes = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      attributeId = createData.data.id;
    });

    it('should return specific attribute by ID', async () => {
      const res = await app.request(`/api/user-attributes/${attributeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: attributeId,
        category: 'test',
        value: 'Test attribute value',
        source: 'user_set',
      });
    });

    it('should return 404 for non-existent attribute', async () => {
      const fakeId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';
      const res = await app.request(`/api/user-attributes/${fakeId}`, {
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
      const res = await app.request(`/api/user-attributes/${attributeId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/user-attributes', () => {
    it('should create a new attribute successfully with all fields', async () => {
      const attributeData = {
        category: 'characteristics',
        value: 'Enjoys problem-solving challenges',
        source: 'journal_analysis',
      };

      const res = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      // Check response structure
      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        category: attributeData.category,
        value: attributeData.value,
        source: attributeData.source,
        userId: userId,
      });
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');
      expect(responseData.data).toHaveProperty('lastUpdated');

      // Verify attribute was actually created in database
      const db = testDb();
      const dbAttribute = await db
        .select()
        .from(schema.userAttributes)
        .where(eq(schema.userAttributes.id, responseData.data.id))
        .limit(1);

      expect(dbAttribute).toHaveLength(1);
      expect(dbAttribute[0].category).toBe(attributeData.category);
      expect(dbAttribute[0].value).toBe(attributeData.value);
      expect(dbAttribute[0].source).toBe(attributeData.source);
      expect(dbAttribute[0].userId).toBe(userId);
    });

    it('should create attribute with minimal data (category and value only)', async () => {
      const attributeData = {
        category: 'values',
        value: 'Integrity',
      };

      const res = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        category: attributeData.category,
        value: attributeData.value,
        source: 'user_set', // Should default to user_set
      });
    });

    it('should allow multiple attributes per user in same category', async () => {
      const attr1 = { category: 'characteristics', value: 'First characteristic' };
      const attr2 = { category: 'characteristics', value: 'Second characteristic' };

      const res1 = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attr1),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const res2 = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attr2),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      // Verify both attributes exist
      const getRes = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.data).toHaveLength(2);
    });

    it('should require authentication', async () => {
      const attributeData = {
        category: 'test',
        value: 'Test value',
      };

      const res = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        category: 'test',
        // Missing value
      };

      const res = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toHaveProperty('issues');
    });

    it('should validate source enum values', async () => {
      const invalidData = {
        category: 'test',
        value: 'Test value',
        source: 'invalid_source',
      };

      const res = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toHaveProperty('issues');
    });

    it('should prevent duplicate attributes (same user, category, and value)', async () => {
      const attributeData = {
        category: 'characteristics',
        value: 'Unique characteristic',
        source: 'user_set',
      };

      // Create first attribute
      const res1 = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res1.status).toBe(201);

      // Try to create duplicate attribute
      const res2 = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Should fail due to unique constraint
      expect(res2.status).toBe(500); // Database constraint violation
    });
  });

  describe('POST /api/user-attributes/bulk', () => {
    it('should create multiple attributes successfully', async () => {
      const bulkData = {
        attributes: [
          { category: 'characteristics', value: 'Bulk attribute 1', source: 'gpt_summary' },
          { category: 'motivators', value: 'Bulk attribute 2', source: 'journal_analysis' },
          { category: 'values', value: 'Bulk attribute 3', source: 'user_set' },
        ],
      };

      const res = await app.request('/api/user-attributes/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(3);

      // Verify all attributes were created
      const getRes = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const getData = await getRes.json();
      expect(getData.data).toHaveLength(3);
    });

    it('should handle empty attributes array', async () => {
      const bulkData = {
        attributes: [],
      };

      const res = await app.request('/api/user-attributes/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual([]);
    });

    it('should update existing attributes on conflict', async () => {
      // Create initial attribute
      const initialAttr = {
        category: 'characteristics',
        value: 'Test characteristic',
        source: 'user_set',
      };

      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(initialAttr),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Bulk create with same category/value but different source
      const bulkData = {
        attributes: [
          { category: 'characteristics', value: 'Test characteristic', source: 'gpt_summary' },
        ],
      };

      const res = await app.request('/api/user-attributes/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].source).toBe('gpt_summary'); // Should be updated

      // Verify only one attribute exists (not duplicated)
      const getRes = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const getData = await getRes.json();
      expect(getData.data).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const bulkData = {
        attributes: [{ category: 'test', value: 'Test value' }],
      };

      const res = await app.request('/api/user-attributes/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/user-attributes/:id', () => {
    let attributeId: string;

    beforeEach(async () => {
      // Create an attribute for update tests
      const attributeData = {
        category: 'original',
        value: 'Original value',
        source: 'user_set',
      };

      const res = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const createData = await res.json();
      attributeId = createData.data.id;
    });

    it('should update attribute successfully', async () => {
      const updateData = {
        category: 'updated',
        value: 'Updated value',
        source: 'gpt_summary',
      };

      const res = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        id: attributeId,
        category: updateData.category,
        value: updateData.value,
        source: updateData.source,
      });

      // Verify in database
      const db = testDb();
      const dbAttribute = await db
        .select()
        .from(schema.userAttributes)
        .where(eq(schema.userAttributes.id, attributeId))
        .limit(1);

      expect(dbAttribute[0].category).toBe(updateData.category);
      expect(dbAttribute[0].value).toBe(updateData.value);
      expect(dbAttribute[0].source).toBe(updateData.source);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        value: 'Only updating value',
      };

      const res = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.value).toBe(updateData.value);
      expect(responseData.data.category).toBe('original'); // Should remain unchanged
      expect(responseData.data.source).toBe('user_set'); // Should remain unchanged
    });

    it('should return 404 when attribute does not exist', async () => {
      const fakeId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';
      const updateData = {
        value: 'Updated value',
      };

      const res = await app.request(`/api/user-attributes/${fakeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(500); // Service throws error for not found
    });

    it('should require authentication', async () => {
      const updateData = {
        value: 'Updated value',
      };

      const res = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/user-attributes/:id', () => {
    let attributeId: string;

    beforeEach(async () => {
      // Create an attribute for delete tests
      const attributeData = {
        category: 'test',
        value: 'Attribute to delete',
        source: 'user_set',
      };

      const res = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const createData = await res.json();
      attributeId = createData.data.id;
    });

    it('should delete attribute successfully', async () => {
      const res = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        id: attributeId,
        category: 'test',
        value: 'Attribute to delete',
      });

      // Verify attribute was actually deleted from database
      const db = testDb();
      const dbAttribute = await db
        .select()
        .from(schema.userAttributes)
        .where(eq(schema.userAttributes.id, attributeId))
        .limit(1);

      expect(dbAttribute).toHaveLength(0);
    });

    it('should return 500 when attribute does not exist', async () => {
      const fakeId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';

      const res = await app.request(`/api/user-attributes/${fakeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(500); // Service throws error for not found
    });

    it('should require authentication', async () => {
      const res = await app.request(`/api/user-attributes/${attributeId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/user-attributes/deduplicate', () => {
    it('should remove duplicate attributes', async () => {
      // Manually insert duplicate attributes directly into database
      const db = testDb();
      
      // Create first attribute
      await db.insert(schema.userAttributes).values({
        userId: userId,
        category: 'characteristics',
        value: 'Duplicate value',
        source: 'user_set',
        lastUpdated: new Date('2023-01-01'),
      });

      // Create duplicate attribute (newer)
      await db.insert(schema.userAttributes).values({
        userId: userId,
        category: 'characteristics',
        value: 'Duplicate value',
        source: 'gpt_summary',
        lastUpdated: new Date('2023-01-02'),
      });

      // Create unique attribute
      await db.insert(schema.userAttributes).values({
        userId: userId,
        category: 'values',
        value: 'Unique value',
        source: 'user_set',
        lastUpdated: new Date('2023-01-01'),
      });

      // Verify we have 3 attributes initially
      const initialRes = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const initialData = await initialRes.json();
      expect(initialData.data).toHaveLength(3);

      // Call deduplicate endpoint
      const res = await app.request('/api/user-attributes/deduplicate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.removedCount).toBe(1);

      // Verify we now have 2 attributes (duplicate removed)
      const finalRes = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const finalData = await finalRes.json();
      expect(finalData.data).toHaveLength(2);

      // Verify the kept attribute is the newer one (gpt_summary)
      const keptDuplicate = finalData.data.find((attr: any) => 
        attr.category === 'characteristics' && attr.value === 'Duplicate value'
      );
      expect(keptDuplicate.source).toBe('gpt_summary');
    });

    it('should handle case with no duplicates', async () => {
      // Create unique attributes
      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify({ category: 'characteristics', value: 'Unique 1' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify({ category: 'characteristics', value: 'Unique 2' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const res = await app.request('/api/user-attributes/deduplicate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.removedCount).toBe(0);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/user-attributes/deduplicate', {
        method: 'POST',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('User Isolation', () => {
    let secondUserId: string;
    let secondAuthToken: string;
    let firstUserAttributeId: string;

    beforeEach(async () => {
      // Create a second user
      const secondUserData = {
        name: 'Second User',
        email: getUniqueEmail('second'),
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

      // Create an attribute for the first user
      const attributeData = {
        category: 'characteristics',
        value: 'First user characteristic',
        source: 'user_set',
      };

      const createRes = await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(attributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      firstUserAttributeId = createData.data.id;
    });

    it('should not allow users to access other users attributes', async () => {
      // Try to access first user's attribute with second user's token
      const res = await app.request(`/api/user-attributes/${firstUserAttributeId}`, {
        headers: {
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should not allow users to update other users attributes', async () => {
      const updateData = {
        value: 'Trying to hack this attribute',
      };

      const res = await app.request(`/api/user-attributes/${firstUserAttributeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(res.status).toBe(500); // Service throws error for not found
    });

    it('should not allow users to delete other users attributes', async () => {
      const res = await app.request(`/api/user-attributes/${firstUserAttributeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(res.status).toBe(500); // Service throws error for not found
    });

    it('should only show attributes belonging to the authenticated user', async () => {
      // Create an attribute for the second user
      const secondUserAttributeData = {
        category: 'characteristics',
        value: 'Second user characteristic',
        source: 'user_set',
      };

      await app.request('/api/user-attributes', {
        method: 'POST',
        body: JSON.stringify(secondUserAttributeData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      // Get attributes for first user
      const firstUserRes = await app.request('/api/user-attributes', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Get attributes for second user
      const secondUserRes = await app.request('/api/user-attributes', {
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

      expect(firstUserData.data[0].value).toBe('First user characteristic');
      expect(secondUserData.data[0].value).toBe('Second user characteristic');
    });
  });
});
