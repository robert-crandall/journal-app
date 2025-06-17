import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { auth } from '../routes/auth';
import tasks from '../routes/tasks';
import journal from '../routes/journal';
import dashboard from '../routes/dashboard';
import { cleanupDatabase, testUser, createAuthHeaders } from './setup';

describe('Dashboard Routes', () => {
  let app: Hono;
  let authToken: string;

  beforeEach(async () => {
    await cleanupDatabase();
    
    // Create app with all routes
    app = new Hono()
      .route('/api/auth', auth)
      .route('/api/tasks', tasks)
      .route('/api/journal', journal)
      .route('/api/dashboard', dashboard);

    // Register and login to get auth token
    const registerRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    
    const registerData = await registerRes.json();
    authToken = registerData.data.token;
  });

  describe('GET /api/dashboard', () => {
    it('should get dashboard data for authenticated user with no data', async () => {
      const res = await app.request('/api/dashboard', {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
      expect(data.data.user.email).toBe(testUser.email);
      expect(data.data.welcome).toBeDefined();
      expect(data.data.tasks).toBeDefined();
      expect(data.data.journal).toBeDefined();
    });

    it('should get dashboard data with tasks and journal entries', async () => {
      // Create some tasks
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          title: 'Task Due Today',
          dueDate: today
        }),
      });

      await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          title: 'Completed Task',
          isCompleted: true
        }),
      });

      await app.request('/api/tasks', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          title: 'Task Due Tomorrow',
          dueDate: tomorrow
        }),
      });

      // Create some journal entries
      await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          content: 'First journal entry',
          title: 'Day 1'
        }),
      });

      await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          content: 'Second journal entry',
          title: 'Day 2'
        }),
      });

      // Get dashboard data
      const res = await app.request('/api/dashboard', {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(testUser.email);
      expect(data.data.tasks).toBeDefined();
      expect(data.data.journal).toBeDefined();
      expect(data.data.welcome).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const res = await app.request('/api/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail with invalid token', async () => {
      const res = await app.request('/api/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        },
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });
});
