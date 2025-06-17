import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { auth } from '../routes/auth';
import tasks from '../routes/tasks';
import { cleanupDatabase, testUser, createAuthHeaders, nonExistentUUID } from './setup';

describe('Task Routes', () => {
  let app: Hono;
  let authToken: string;

  beforeEach(async () => {
    await cleanupDatabase();
    
    // Create app with auth and tasks routes
    app = new Hono()
      .route('/api/auth', auth)
      .route('/api/tasks', tasks);

    // Register and login to get auth token
    const registerRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    
    const registerData = await registerRes.json();
    authToken = registerData.data.token;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        dueDate: '2025-06-20'
      };

      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(taskData.title);
      expect(data.data.description).toBe(taskData.description);
      expect(data.data.isCompleted).toBe(false);
      expect(data.data.id).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const taskData = {
        title: 'Test Task'
      };

      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail with invalid due date format', async () => {
      const taskData = {
        title: 'Test Task',
        dueDate: 'invalid-date'
      };

      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should fail with missing title', async () => {
      const taskData = {
        priority: 'medium' as const
      };

      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create some test tasks
      const tasks = [
        { title: 'Task 1' },
        { title: 'Task 2' },
        { title: 'Task 3' }
      ];

      for (const task of tasks) {
        await app.request('/api/tasks', {
          method: 'POST',
          headers: createAuthHeaders(authToken),
          body: JSON.stringify(task),
        });
      }
    });

    it('should get all tasks for authenticated user', async () => {
      const res = await app.request('/api/tasks', {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].title).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const res = await app.request('/api/tasks', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a task first
      const createRes = await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          title: 'Original Task'
        }),
      });
      
      const createData = await createRes.json();
      taskId = createData.data.id;
    });

    it('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Task',
        isCompleted: true
      };

      const res = await app.request(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(updateData.title);
      expect(data.data.isCompleted).toBe(true);
    });

    it('should fail to update non-existent task', async () => {
      const updateData = {
        title: 'Updated Task'
      };

      const res = await app.request(`/api/tasks/${nonExistentUUID}`, {
        method: 'PUT',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a task first
      const createRes = await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          title: 'Task to Delete'
        }),
      });
      
      const createData = await createRes.json();
      taskId = createData.data.id;
    });

    it('should delete task successfully', async () => {
      const res = await app.request(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify task is deleted
      const getRes = await app.request(`/api/tasks/${taskId}`, {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });
      
      expect(getRes.status).toBe(404);
    });

    it('should fail to delete non-existent task', async () => {
      const res = await app.request(`/api/tasks/${nonExistentUUID}`, {
        method: 'DELETE',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
