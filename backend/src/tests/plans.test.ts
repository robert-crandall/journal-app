import { describe, it, expect, beforeEach } from 'vitest';
import appExport from '../index';
import { testDb, getUniqueEmail, schema } from './setup';
import { eq, and } from 'drizzle-orm';
import type { PlanType } from '../../../shared/types/plans';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Plans API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };

  beforeEach(async () => {
    // Create a test user with unique email and get auth token for protected routes
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('plans'),
      password: 'testpassword123',
    };

    const signupRes = await app.request('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const signupData = await signupRes.json();
    authToken = signupData.token;
    userId = signupData.user.id;
  });

  describe('GET /api/plans', () => {
    it('should return empty array when user has no plans', async () => {
      const res = await app.request('/api/plans', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual([]);
    });

    it('should return user plans ordered by updatedAt desc', async () => {
      const db = testDb();

      // Create some plans directly in database with a delay to ensure different timestamps
      await db.insert(schema.plans).values([
        {
          userId,
          title: 'Project A',
          type: 'project',
          description: 'First project',
          isOrdered: true,
        },
      ]);

      // Add a small delay to ensure different updatedAt timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await db.insert(schema.plans).values([
        {
          userId,
          title: 'Adventure B',
          type: 'adventure',
          description: 'Epic adventure',
          isOrdered: false,
        },
      ]);

      const res = await app.request('/api/plans', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].title).toBe('Adventure B'); // More recent
      expect(responseData.data[1].title).toBe('Project A');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/plans', {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });

    it('should only return plans for the authenticated user', async () => {
      const db = testDb();

      // Create another user
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-plans'),
          password: 'password',
        })
        .returning();

      // Create plans for both users
      await db.insert(schema.plans).values([
        {
          userId,
          title: 'My Plan',
          type: 'project',
        },
        {
          userId: anotherUser[0].id,
          title: 'Other User Plan',
          type: 'adventure',
        },
      ]);

      const res = await app.request('/api/plans', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].title).toBe('My Plan');
    });
  });

  describe('POST /api/plans', () => {
    it('should create a new plan with minimal data', async () => {
      const planData = {
        title: 'Build Shed',
        type: 'project' as PlanType,
      };

      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(planData),
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        title: planData.title,
        type: planData.type,
        description: null,
        focusId: null,
        isOrdered: false,
        lastActivityAt: null,
      });
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');

      // Verify plan was actually created in database
      const db = testDb();
      const dbPlan = await db.select().from(schema.plans).where(eq(schema.plans.id, responseData.data.id)).limit(1);

      expect(dbPlan).toHaveLength(1);
      expect(dbPlan[0].title).toBe(planData.title);
      expect(dbPlan[0].userId).toBe(userId);
      expect(dbPlan[0].type).toBe(planData.type);
    });

    it('should create a plan with full data', async () => {
      const db = testDb();

      // Create a focus first
      const focus = await db
        .insert(schema.focuses)
        .values({
          userId,
          dayOfWeek: 1,
          title: 'Work Focus',
          description: 'Focus on work tasks',
        })
        .returning();

      const planData = {
        title: 'Climb Mt Taylor',
        type: 'adventure' as PlanType,
        description: 'Epic mountain climbing adventure',
        focusId: focus[0].id,
        isOrdered: true,
      };

      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(planData),
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        title: planData.title,
        type: planData.type,
        description: planData.description,
        focusId: planData.focusId,
        isOrdered: true,
      });
    });

    it('should require authentication', async () => {
      const planData = {
        title: 'Test Plan',
        type: 'project' as PlanType,
      };

      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it('should validate plan type', async () => {
      const planData = {
        title: 'Test Plan',
        type: 'invalid-type',
      };

      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(planData),
      });

      expect(res.status).toBe(400);
    });

    it('should validate title length', async () => {
      const planData = {
        title: 'x'.repeat(256), // Too long
        type: 'project' as PlanType,
      };

      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(planData),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/plans/:id', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a test plan
      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Plan',
          type: 'project',
          isOrdered: true,
        }),
      });
      const responseData = await res.json();
      planId = responseData.data.id;
    });

    it('should return plan with its subtasks', async () => {
      const db = testDb();

      // Create some subtasks
      await db.insert(schema.planSubtasks).values([
        {
          planId,
          userId,
          title: 'First task',
          description: 'Do this first',
          orderIndex: 0,
        },
        {
          planId,
          userId,
          title: 'Second task',
          description: 'Do this second',
          orderIndex: 1,
        },
      ]);

      const res = await app.request(`/api/plans/${planId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        id: planId,
        title: 'Test Plan',
        type: 'project',
        isOrdered: true,
      });
      expect(responseData.data.subtasks).toHaveLength(2);
      expect(responseData.data.subtasks[0].title).toBe('First task'); // Ordered by orderIndex
      expect(responseData.data.subtasks[1].title).toBe('Second task');
    });

    it('should return plan with empty subtasks array', async () => {
      const res = await app.request(`/api/plans/${planId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.subtasks).toEqual([]);
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/plans/${nonExistentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should not allow accessing other users plans', async () => {
      const db = testDb();

      // Create another user and their plan
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-plans'),
          password: 'password',
        })
        .returning();

      const anotherPlan = await db
        .insert(schema.plans)
        .values({
          userId: anotherUser[0].id,
          title: 'Other user plan',
          type: 'project',
        })
        .returning();

      const res = await app.request(`/api/plans/${anotherPlan[0].id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404); // Should be treated as not found
    });
  });

  describe('PUT /api/plans/:id', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a test plan
      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Original Plan',
          type: 'project',
          description: 'Original description',
        }),
      });
      const responseData = await res.json();
      planId = responseData.data.id;
    });

    it('should update plan title', async () => {
      const updateData = {
        title: 'Updated Plan Title',
      };

      const res = await app.request(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        id: planId,
        title: updateData.title,
        type: 'project', // Should remain unchanged
      });

      // Verify in database
      const db = testDb();
      const dbPlan = await db.select().from(schema.plans).where(eq(schema.plans.id, planId)).limit(1);

      expect(dbPlan[0].title).toBe(updateData.title);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        isOrdered: true,
      };

      const res = await app.request(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        id: planId,
        title: 'Original Plan', // Should remain unchanged
        isOrdered: true,
      });
    });

    it('should allow clearing focusId', async () => {
      const updateData = {
        focusId: null,
      };

      const res = await app.request(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.focusId).toBeNull();
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/plans/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Updated',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/plans/:id', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a test plan
      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Plan to delete',
          type: 'project',
        }),
      });
      const responseData = await res.json();
      planId = responseData.data.id;
    });

    it('should delete plan and its subtasks', async () => {
      const db = testDb();

      // Create a subtask
      await db.insert(schema.planSubtasks).values({
        planId,
        userId,
        title: 'Subtask to be deleted',
      });

      const res = await app.request(`/api/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(planId);

      // Verify plan was deleted from database
      const dbPlans = await db.select().from(schema.plans).where(eq(schema.plans.id, planId));
      expect(dbPlans).toHaveLength(0);

      // Verify subtasks were deleted due to cascade
      const dbSubtasks = await db.select().from(schema.planSubtasks).where(eq(schema.planSubtasks.planId, planId));
      expect(dbSubtasks).toHaveLength(0);
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/plans/${nonExistentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/plans/:id/subtasks', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a test plan
      const res = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Plan',
          type: 'project',
        }),
      });
      const responseData = await res.json();
      planId = responseData.data.id;
    });

    it('should create a new subtask', async () => {
      const subtaskData = {
        title: 'First Subtask',
        description: 'Do this first',
        orderIndex: 0,
      };

      const res = await app.request(`/api/plans/${planId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(subtaskData),
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        planId,
        title: subtaskData.title,
        description: subtaskData.description,
        orderIndex: subtaskData.orderIndex,
        isCompleted: false,
        completedAt: null,
      });
      expect(responseData.data).toHaveProperty('id');

      // Verify subtask was created in database
      const db = testDb();
      const dbSubtask = await db.select().from(schema.planSubtasks).where(eq(schema.planSubtasks.id, responseData.data.id)).limit(1);

      expect(dbSubtask).toHaveLength(1);
      expect(dbSubtask[0].title).toBe(subtaskData.title);
      expect(dbSubtask[0].userId).toBe(userId);
    });

    it('should create subtask with minimal data', async () => {
      const subtaskData = {
        title: 'Simple Subtask',
      };

      const res = await app.request(`/api/plans/${planId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(subtaskData),
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        title: subtaskData.title,
        description: null,
        orderIndex: null,
      });
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/plans/${nonExistentId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'New Subtask',
        }),
      });

      expect(res.status).toBe(404);
    });

    it('should validate required fields', async () => {
      const res = await app.request(`/api/plans/${planId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/plans/:planId/subtasks/:subtaskId', () => {
    let planId: string;
    let subtaskId: string;

    beforeEach(async () => {
      // Create a test plan
      const planRes = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Plan',
          type: 'project',
        }),
      });
      const planData = await planRes.json();
      planId = planData.data.id;

      // Create a test subtask
      const subtaskRes = await app.request(`/api/plans/${planId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Original Subtask',
          description: 'Original description',
        }),
      });
      const subtaskData = await subtaskRes.json();
      subtaskId = subtaskData.data.id;
    });

    it('should update subtask title', async () => {
      const updateData = {
        title: 'Updated Subtask Title',
      };

      const res = await app.request(`/api/plans/${planId}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        id: subtaskId,
        title: updateData.title,
        description: 'Original description', // Should remain unchanged
      });
    });

    it('should complete subtask and update plan lastActivityAt', async () => {
      const updateData = {
        isCompleted: true,
      };

      const res = await app.request(`/api/plans/${planId}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.isCompleted).toBe(true);
      expect(responseData.data.completedAt).not.toBeNull();

      // Verify plan's lastActivityAt was updated
      const db = testDb();
      const dbPlan = await db.select().from(schema.plans).where(eq(schema.plans.id, planId)).limit(1);
      expect(dbPlan[0].lastActivityAt).not.toBeNull();
    });

    it('should return 404 for non-existent subtask', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/plans/${planId}/subtasks/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Updated',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/plans/:planId/subtasks/:subtaskId/complete', () => {
    let planId: string;
    let subtaskId: string;

    beforeEach(async () => {
      // Create a test plan and subtask
      const planRes = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Plan',
          type: 'project',
        }),
      });
      const planData = await planRes.json();
      planId = planData.data.id;

      const subtaskRes = await app.request(`/api/plans/${planId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Subtask',
        }),
      });
      const subtaskData = await subtaskRes.json();
      subtaskId = subtaskData.data.id;
    });

    it('should mark subtask as completed', async () => {
      const res = await app.request(`/api/plans/${planId}/subtasks/${subtaskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          isCompleted: true,
        }),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.isCompleted).toBe(true);
      expect(responseData.data.completedAt).not.toBeNull();
    });

    it('should mark subtask as incomplete', async () => {
      // First complete it
      await app.request(`/api/plans/${planId}/subtasks/${subtaskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          isCompleted: true,
        }),
      });

      // Then mark as incomplete
      const res = await app.request(`/api/plans/${planId}/subtasks/${subtaskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          isCompleted: false,
        }),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.isCompleted).toBe(false);
      expect(responseData.data.completedAt).toBeNull();
    });
  });

  describe('DELETE /api/plans/:planId/subtasks/:subtaskId', () => {
    let planId: string;
    let subtaskId: string;

    beforeEach(async () => {
      // Create a test plan and subtask
      const planRes = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Plan',
          type: 'project',
        }),
      });
      const planData = await planRes.json();
      planId = planData.data.id;

      const subtaskRes = await app.request(`/api/plans/${planId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Subtask to delete',
        }),
      });
      const subtaskData = await subtaskRes.json();
      subtaskId = subtaskData.data.id;
    });

    it('should delete subtask', async () => {
      const res = await app.request(`/api/plans/${planId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(subtaskId);

      // Verify subtask was deleted from database
      const db = testDb();
      const dbSubtasks = await db.select().from(schema.planSubtasks).where(eq(schema.planSubtasks.id, subtaskId));

      expect(dbSubtasks).toHaveLength(0);
    });

    it('should return 404 for non-existent subtask', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/plans/${planId}/subtasks/${nonExistentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/plans/:id/subtasks/reorder', () => {
    let planId: string;
    let subtaskIds: string[] = [];

    beforeEach(async () => {
      // Create an ordered plan
      const planRes = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Ordered Plan',
          type: 'project',
          isOrdered: true,
        }),
      });
      const planData = await planRes.json();
      planId = planData.data.id;

      // Create multiple subtasks
      for (let i = 0; i < 3; i++) {
        const subtaskRes = await app.request(`/api/plans/${planId}/subtasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: `Subtask ${i + 1}`,
            orderIndex: i,
          }),
        });
        const subtaskData = await subtaskRes.json();
        subtaskIds.push(subtaskData.data.id);
      }
    });

    it('should reorder subtasks', async () => {
      // Reverse the order
      const reorderedIds = [...subtaskIds].reverse();

      const res = await app.request(`/api/plans/${planId}/subtasks/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          subtaskIds: reorderedIds,
        }),
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);

      // Verify the order was updated in database
      const db = testDb();
      const dbSubtasks = await db.select().from(schema.planSubtasks).where(eq(schema.planSubtasks.planId, planId)).orderBy(schema.planSubtasks.orderIndex);

      expect(dbSubtasks[0].id).toBe(reorderedIds[0]);
      expect(dbSubtasks[1].id).toBe(reorderedIds[1]);
      expect(dbSubtasks[2].id).toBe(reorderedIds[2]);
    });

    it('should not allow reordering unordered plans', async () => {
      // Create an unordered plan
      const unorderedPlanRes = await app.request('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Unordered Plan',
          type: 'adventure',
          isOrdered: false,
        }),
      });
      const unorderedPlanData = await unorderedPlanRes.json();
      const unorderedPlanId = unorderedPlanData.data.id;

      const res = await app.request(`/api/plans/${unorderedPlanId}/subtasks/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          subtaskIds: subtaskIds,
        }),
      });

      expect(res.status).toBe(400);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Cannot reorder subtasks for unordered plans');
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/plans/${nonExistentId}/subtasks/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          subtaskIds: subtaskIds,
        }),
      });

      expect(res.status).toBe(404);
    });
  });
});
