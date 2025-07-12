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

describe('Experiments API Integration Tests', () => {
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
  });

  describe('POST /api/experiments', () => {
    it('should create a new experiment', async () => {
      const experimentData = {
        title: 'No Social Media',
        description: 'Stay off social media for 7 days',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        tasks: [
          {
            description: 'Avoid checking Instagram',
            successMetric: 1,
            xpReward: 10,
          },
          {
            description: 'Avoid checking Twitter',
            successMetric: 1,
            xpReward: 10,
          },
        ],
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(experimentData.title);
      expect(data.data.description).toBe(experimentData.description);
      expect(data.data.startDate).toBe(experimentData.startDate);
      expect(data.data.endDate).toBe(experimentData.endDate);
      expect(data.data.tasks).toHaveLength(2);
      expect(data.data.tasks[0].description).toBe(experimentData.tasks[0].description);
      expect(data.data.tasks[0].xpReward).toBe(experimentData.tasks[0].xpReward);
    });

    it('should create experiment without tasks', async () => {
      const experimentData = {
        title: 'Simple Experiment',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(experimentData.title);
      expect(data.data.tasks).toHaveLength(0);
    });

    it('should fail with invalid date range', async () => {
      const experimentData = {
        title: 'Invalid Experiment',
        startDate: '2024-01-07',
        endDate: '2024-01-01', // End before start
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      const experimentData = {
        title: 'Test Experiment',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/experiments', () => {
    it('should get user experiments', async () => {
      // Create experiment first
      const experimentData = {
        title: 'Test Experiment',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const res = await app.request('/api/experiments', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe(experimentData.title);
    });

    it('should return empty array for user with no experiments', async () => {
      const res = await app.request('/api/experiments', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  });

  describe('GET /api/experiments/:id', () => {
    let experimentId: string;

    beforeEach(async () => {
      const experimentData = {
        title: 'Test Experiment',
        description: 'Test description',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        tasks: [
          {
            description: 'Test task',
            successMetric: 2,
            xpReward: 5,
          },
        ],
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      experimentId = data.data.id;
    });

    it('should get experiment with tasks', async () => {
      const res = await app.request(`/api/experiments/${experimentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(experimentId);
      expect(data.data.tasks).toHaveLength(1);
      expect(data.data.tasks[0].description).toBe('Test task');
    });

    it('should return 404 for non-existent experiment', async () => {
      const res = await app.request('/api/experiments/550e8400-e29b-41d4-a716-446655440000', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/experiments/:id', () => {
    let experimentId: string;

    beforeEach(async () => {
      const experimentData = {
        title: 'Original Title',
        description: 'Original description',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      experimentId = data.data.id;
    });

    it('should update experiment', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const res = await app.request(`/api/experiments/${experimentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(updateData.title);
      expect(data.data.description).toBe(updateData.description);
    });
  });

  describe('Task Management', () => {
    let experimentId: string;
    let taskId: string;

    beforeEach(async () => {
      const experimentData = {
        title: 'Test Experiment',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        tasks: [
          {
            description: 'Initial task',
            successMetric: 1,
            xpReward: 10,
          },
        ],
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      experimentId = data.data.id;
      taskId = data.data.tasks[0].id;
    });

    describe('POST /api/experiments/:id/tasks', () => {
      it('should create new task for experiment', async () => {
        const taskData = {
          description: 'New task',
          successMetric: 3,
          xpReward: 15,
        };

        const res = await app.request(`/api/experiments/${experimentId}/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.description).toBe(taskData.description);
        expect(data.data.successMetric).toBe(taskData.successMetric);
        expect(data.data.xpReward).toBe(taskData.xpReward);
      });
    });

    describe('GET /api/experiments/:id/tasks', () => {
      it('should get tasks with completion status', async () => {
        const res = await app.request(`/api/experiments/${experimentId}/tasks`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].completionCount).toBe(0);
        expect(data.data[0].isCompleteToday).toBe(false);
      });
    });

    describe('POST /api/experiments/:id/tasks/:taskId/complete', () => {
      it('should complete a task', async () => {
        const completionData = {
          completedDate: '2024-01-02',
          notes: 'Completed successfully',
        };

        const res = await app.request(`/api/experiments/${experimentId}/tasks/${taskId}/complete`, {
          method: 'POST',
          body: JSON.stringify(completionData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.completedDate).toBe(completionData.completedDate);
        expect(data.data.notes).toBe(completionData.notes);

        // Verify XP was granted
        const db = testDb();
        const xpGrants = await db
          .select()
          .from(schema.xpGrants)
          .where(and(eq(schema.xpGrants.userId, userId), eq(schema.xpGrants.entityType, 'experiment_task')));

        expect(xpGrants).toHaveLength(1);
        expect(xpGrants[0].xpAmount).toBe(10); // From task creation
      });

      it('should prevent duplicate completions for same date', async () => {
        const completionData = {
          completedDate: '2024-01-02',
        };

        // Complete once
        await app.request(`/api/experiments/${experimentId}/tasks/${taskId}/complete`, {
          method: 'POST',
          body: JSON.stringify(completionData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        // Try to complete again for same date
        const res = await app.request(`/api/experiments/${experimentId}/tasks/${taskId}/complete`, {
          method: 'POST',
          body: JSON.stringify(completionData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('already completed');
      });
    });
  });

  describe('GET /api/experiments/:id/dashboard', () => {
    let experimentId: string;
    let taskId: string;

    beforeEach(async () => {
      const experimentData = {
        title: 'Dashboard Test',
        description: 'Testing dashboard functionality',
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        tasks: [
          {
            description: 'Daily task',
            successMetric: 1,
            xpReward: 5,
          },
        ],
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      experimentId = data.data.id;
      taskId = data.data.tasks[0].id;
    });

    it('should get experiment dashboard data', async () => {
      // Complete a task
      await app.request(`/api/experiments/${experimentId}/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ completedDate: '2024-01-01' }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const res = await app.request(`/api/experiments/${experimentId}/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      
      const dashboard = data.data;
      expect(dashboard.experiment.id).toBe(experimentId);
      expect(dashboard.stats.totalDays).toBe(3);
      expect(dashboard.stats.tasksCompleted).toBe(1);
      expect(dashboard.stats.totalTaskInstances).toBe(3); // 3 days * 1 task
      expect(dashboard.xpBreakdown.fromTasks).toBe(5);
      expect(dashboard.tasks).toHaveLength(1);
      expect(dashboard.tasks[0].completionCount).toBe(1);
    });
  });

  describe('DELETE /api/experiments/:id', () => {
    let experimentId: string;

    beforeEach(async () => {
      const experimentData = {
        title: 'To Delete',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };

      const res = await app.request('/api/experiments', {
        method: 'POST',
        body: JSON.stringify(experimentData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      experimentId = data.data.id;
    });

    it('should delete experiment', async () => {
      const res = await app.request(`/api/experiments/${experimentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify it's deleted
      const getRes = await app.request(`/api/experiments/${experimentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getRes.status).toBe(404);
    });
  });
});
