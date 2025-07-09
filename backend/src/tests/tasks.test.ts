import { describe, it, expect, beforeEach } from 'vitest';
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
  name: 'Tasks Test User',
  email: 'tasks.test@example.com',
  password: 'password123',
};

describe('Tasks API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let statId: string;

  beforeEach(async () => {
    await cleanDatabase();
    
    const db = testDb();
    
    // Create test user
    const [user] = await db.insert(schema.users).values(testUser).returning();
    userId = user.id;

    // Generate JWT token
    authToken = await sign(
      {
        id: userId,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      },
      JWT_SECRET,
    );

    // Create a test stat for tasks
    const [stat] = await db
      .insert(schema.characterStats)
      .values({
        userId,
        name: 'Test Stat',
        description: 'A test stat for tasks',
      })
      .returning();
    statId = stat.id;
  });

  describe('GET /api/tasks', () => {
    it('should return empty array when user has no tasks', async () => {
      const res = await app.request('/api/tasks', {
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

    it('should return tasks when user has them', async () => {
      // Create a test task
      const db = testDb();
      await db.insert(schema.tasks).values({
        userId,
        title: 'Test Task',
        description: 'A test task',
        sourceType: 'manual',
        priority: 1,
        xpReward: 10,
        isCompleted: false,
      });

      const res = await app.request('/api/tasks', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Test Task');
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/tasks', {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });

    it('should filter by sourceType', async () => {
      // Create tasks with different source types
      const db = testDb();
      await db.insert(schema.tasks).values([
        {
          userId,
          title: 'Manual Task',
          sourceType: 'manual',
        },
        {
          userId,
          title: 'Auto Task',
          sourceType: 'track_task',
        },
      ]);

      const res = await app.request('/api/tasks?sourceType=manual', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Manual Task');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: 'New Task',
        description: 'A new task for testing',
        sourceType: 'manual',
        priority: 2,
        xpReward: 15,
        statId,
      };

      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe(taskData.title);
      expect(body.data.userId).toBe(userId);
    });

    it('should create minimal task with only required fields', async () => {
      const taskData = {
        title: 'Minimal Task',
        sourceType: 'manual',
      };

      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe(taskData.title);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Test', sourceType: 'manual' }),
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task successfully', async () => {
      // Create a task
      const db = testDb();
      const [task] = await db
        .insert(schema.tasks)
        .values({
          userId,
          title: 'Original Task',
          sourceType: 'manual',
        })
        .returning();

      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
      };

      const res = await app.request(`/api/tasks/${task.id}`, {
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
      expect(body.data.title).toBe(updateData.title);
      expect(body.data.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent task', async () => {
      // Use a valid UUID format but non-existent ID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const res = await app.request(`/api/tasks/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Updated' }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    it('should complete task and grant XP', async () => {
      // Create a task with XP reward
      const db = testDb();
      const [task] = await db
        .insert(schema.tasks)
        .values({
          userId,
          title: 'Task with XP',
          sourceType: 'manual',
          xpReward: 20,
          statId,
        })
        .returning();

      const res = await app.request(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body as completion doesn't require data
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.xpGranted).toBe(20);

      // Check that XP was granted to stat
      const [updatedStat] = await db
        .select()
        .from(schema.characterStats)
        .where(eq(schema.characterStats.id, statId));

      expect(updatedStat.totalXp).toBe(20);
    });

    it('should prevent completing already completed task', async () => {
      // Create a completed task
      const db = testDb();
      const [task] = await db
        .insert(schema.tasks)
        .values({
          userId,
          title: 'Completed Task',
          sourceType: 'manual',
          isCompleted: true,
        })
        .returning();

      const res = await app.request(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('already completed');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task successfully', async () => {
      // Create a task
      const db = testDb();
      const [task] = await db
        .insert(schema.tasks)
        .values({
          userId,
          title: 'Task to Delete',
          sourceType: 'manual',
        })
        .returning();

      const res = await app.request(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // Verify task is deleted
      const deletedTask = await db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, task.id));

      expect(deletedTask).toHaveLength(0);
    });

    it('should return 404 for non-existent task', async () => {
      // Use a valid UUID format but non-existent ID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const res = await app.request(`/api/tasks/${nonExistentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });
});
