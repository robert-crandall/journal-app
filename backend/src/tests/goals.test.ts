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

// Helper function to get tags for a goal from the normalized tables
async function getGoalTags(goalId: string): Promise<string[]> {
  const db = testDb();
  const goalTags = await db
    .select({ name: schema.tags.name })
    .from(schema.goalTags)
    .innerJoin(schema.tags, eq(schema.tags.id, schema.goalTags.tagId))
    .where(eq(schema.goalTags.goalId, goalId));

  return goalTags.map((tag) => tag.name).sort();
}

describe('Goals API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };

  beforeEach(async () => {
    // Generate unique email for each test
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('goals'),
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

  describe('GET /api/goals', () => {
    it('should return empty array when user has no goals', async () => {
      const res = await app.request('/api/goals', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should return goals when user has them', async () => {
      // First create some goals
      const goalData1 = {
        title: 'Live close to nature',
        description: 'Spend more time outdoors and connect with nature',
        tags: ['outdoors', 'nature', 'health'],
        isActive: true,
      };

      const goalData2 = {
        title: 'Be a better father',
        description: 'Spend quality time with my children every day',
        tags: ['family', 'parenting'],
        isActive: true,
      };

      const createRes1 = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData1),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const createRes2 = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData2),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(createRes1.status).toBe(201);
      expect(createRes2.status).toBe(201);

      // Now get all goals
      const getRes = await app.request('/api/goals', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toMatchObject({
        title: goalData1.title,
        description: goalData1.description,
        tags: goalData1.tags.sort(), // API returns tags in sorted order
        isActive: goalData1.isActive,
        isArchived: false,
      });
      expect(data.data[1]).toMatchObject({
        title: goalData2.title,
        description: goalData2.description,
        tags: goalData2.tags.sort(), // API returns tags in sorted order
        isActive: goalData2.isActive,
        isArchived: false,
      });
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/goals');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      // Create a test goal
      const goalData = {
        title: 'Test Goal',
        description: 'A goal for testing',
        tags: ['test'],
        isActive: true,
      };

      const createRes = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      goalId = createData.data.id;
    });

    it('should return specific goal by ID', async () => {
      const res = await app.request(`/api/goals/${goalId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: goalId,
        title: 'Test Goal',
        description: 'A goal for testing',
        tags: ['test'],
        isActive: true,
        isArchived: false,
      });
    });

    it('should return 404 for non-existent goal', async () => {
      const fakeId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';
      const res = await app.request(`/api/goals/${fakeId}`, {
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
      const res = await app.request(`/api/goals/${goalId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/goals', () => {
    it('should create a new goal successfully with all fields', async () => {
      const goalData = {
        title: 'Master outdoor skills',
        description: 'Learn camping, hiking, and survival skills to become more adventurous',
        tags: ['outdoors', 'adventure', 'skills'],
        isActive: true,
        isArchived: false,
      };

      const res = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
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
        title: goalData.title,
        description: goalData.description,
        tags: goalData.tags,
        isActive: goalData.isActive,
        isArchived: goalData.isArchived,
      });
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');

      // Verify goal was actually created in database
      const db = testDb();
      const dbGoal = await db.select().from(schema.goals).where(eq(schema.goals.id, responseData.data.id)).limit(1);

      expect(dbGoal).toHaveLength(1);
      expect(dbGoal[0].title).toBe(goalData.title);
      expect(dbGoal[0].description).toBe(goalData.description);

      // Check tags in normalized tables
      const dbTags = await getGoalTags(responseData.data.id);
      expect(dbTags).toEqual(goalData.tags.sort());

      expect(dbGoal[0].isActive).toBe(goalData.isActive);
      expect(dbGoal[0].isArchived).toBe(goalData.isArchived);
    });

    it('should create goal with minimal data (title only)', async () => {
      const goalData = {
        title: 'Simple Goal',
      };

      const res = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        title: goalData.title,
        description: null,
        tags: [],
        isActive: true,
        isArchived: false,
      });
    });

    it('should handle empty tags array', async () => {
      const goalData = {
        title: 'Goal with empty tags',
        tags: [],
      };

      const res = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.tags).toEqual([]);
    });

    it('should allow multiple goals per user', async () => {
      const goal1 = { title: 'First Goal' };
      const goal2 = { title: 'Second Goal' };

      const res1 = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goal1),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const res2 = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goal2),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      // Verify both goals exist
      const getRes = await app.request('/api/goals', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.data).toHaveLength(2);
    });

    it('should require authentication', async () => {
      const goalData = {
        title: 'Test Goal',
      };

      const res = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing title',
      };

      const res = await app.request('/api/goals', {
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
      expect(Array.isArray(errorData.error.issues)).toBe(true);
      expect(errorData.error.issues.length).toBeGreaterThan(0);
    });

    it('should validate title length', async () => {
      const invalidData = {
        title: 'a'.repeat(256), // Too long
      };

      const res = await app.request('/api/goals', {
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
      expect(Array.isArray(errorData.error.issues)).toBe(true);
      expect(errorData.error.issues.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      // Create a goal for update tests
      const goalData = {
        title: 'Original Goal',
        description: 'Original description',
        tags: ['original', 'test'],
        isActive: true,
        isArchived: false,
      };

      const res = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const createData = await res.json();
      goalId = createData.data.id;
    });

    it('should update goal successfully', async () => {
      const updateData = {
        title: 'Updated Goal',
        description: 'Updated description',
        tags: ['updated', 'modified'],
        isActive: false,
        isArchived: true,
      };

      const res = await app.request(`/api/goals/${goalId}`, {
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
        id: goalId,
        title: updateData.title,
        description: updateData.description,
        tags: updateData.tags,
        isActive: updateData.isActive,
        isArchived: updateData.isArchived,
      });

      // Verify in database
      const db = testDb();
      const dbGoal = await db.select().from(schema.goals).where(eq(schema.goals.id, goalId)).limit(1);

      expect(dbGoal[0].title).toBe(updateData.title);
      expect(dbGoal[0].description).toBe(updateData.description);

      // Check tags in normalized tables
      const dbTags = await getGoalTags(goalId);
      expect(dbTags).toEqual(updateData.tags.sort());

      expect(dbGoal[0].isActive).toBe(updateData.isActive);
      expect(dbGoal[0].isArchived).toBe(updateData.isArchived);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        title: 'Only updating title',
      };

      const res = await app.request(`/api/goals/${goalId}`, {
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
      expect(responseData.data.title).toBe(updateData.title);
      expect(responseData.data.description).toBe('Original description'); // Should remain unchanged
      expect(responseData.data.tags).toEqual(['original', 'test']); // Should remain unchanged
    });

    it('should update tags correctly', async () => {
      const updateData = {
        tags: ['new', 'tag', 'list'],
      };

      const res = await app.request(`/api/goals/${goalId}`, {
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
      expect(responseData.data.tags).toEqual(updateData.tags);
    });

    it('should handle empty tags array in updates', async () => {
      const updateData = {
        tags: [],
      };

      const res = await app.request(`/api/goals/${goalId}`, {
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
      expect(responseData.data.tags).toEqual([]);
    });

    it('should return 404 when goal does not exist', async () => {
      const fakeId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';
      const updateData = {
        title: 'Updated Title',
      };

      const res = await app.request(`/api/goals/${fakeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const updateData = {
        title: 'Updated Title',
      };

      const res = await app.request(`/api/goals/${goalId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/goals/:id', () => {
    let goalId: string;

    beforeEach(async () => {
      // Create a goal for delete tests
      const goalData = {
        title: 'Goal to Delete',
        description: 'This goal will be deleted',
      };

      const res = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const createData = await res.json();
      goalId = createData.data.id;
    });

    it('should delete goal successfully', async () => {
      const res = await app.request(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        id: goalId,
        title: 'Goal to Delete',
        description: 'This goal will be deleted',
      });

      // Verify goal was actually deleted from database
      const db = testDb();
      const dbGoal = await db.select().from(schema.goals).where(eq(schema.goals.id, goalId)).limit(1);

      expect(dbGoal).toHaveLength(0);
    });

    it('should return 404 when goal does not exist', async () => {
      const fakeId = 'b0e7d7c8-7b7b-4b7b-8b7b-7b7b7b7b7b7b';

      const res = await app.request(`/api/goals/${fakeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const errorData = await res.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const res = await app.request(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('User Isolation', () => {
    let secondUserId: string;
    let secondAuthToken: string;
    let firstUserGoalId: string;

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

      // Create a goal for the first user
      const goalData = {
        title: 'First User Goal',
        description: 'This belongs to the first user',
      };

      const createRes = await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(createRes.status).toBe(201);
      const createData = await createRes.json();
      firstUserGoalId = createData.data.id;
    });

    it('should not allow users to access other users goals', async () => {
      // Try to access first user's goal with second user's token
      const res = await app.request(`/api/goals/${firstUserGoalId}`, {
        headers: {
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should not allow users to update other users goals', async () => {
      const updateData = {
        title: 'Trying to hack this goal',
      };

      const res = await app.request(`/api/goals/${firstUserGoalId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should not allow users to delete other users goals', async () => {
      const res = await app.request(`/api/goals/${firstUserGoalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should only show goals belonging to the authenticated user', async () => {
      // Create a goal for the second user
      const secondUserGoalData = {
        title: 'Second User Goal',
        description: 'This belongs to the second user',
      };

      await app.request('/api/goals', {
        method: 'POST',
        body: JSON.stringify(secondUserGoalData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondAuthToken}`,
        },
      });

      // Get goals for first user
      const firstUserRes = await app.request('/api/goals', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Get goals for second user
      const secondUserRes = await app.request('/api/goals', {
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

      expect(firstUserData.data[0].title).toBe('First User Goal');
      expect(secondUserData.data[0].title).toBe('Second User Goal');
    });
  });
});
