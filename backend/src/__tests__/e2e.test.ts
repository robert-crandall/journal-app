import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { auth } from '../routes/auth';
import tasks from '../routes/tasks';
import journal from '../routes/journal';
import dashboard from '../routes/dashboard';
import { cleanupDatabase, testUser, createAuthHeaders } from './setup';

describe('End-to-End User Journey', () => {
  let app: Hono;

  beforeEach(async () => {
    await cleanupDatabase();
    
    // Create app with all routes
    app = new Hono()
      .route('/api/auth', auth)
      .route('/api/tasks', tasks)
      .route('/api/journal', journal)
      .route('/api/dashboard', dashboard);
  });

  it('should complete a full user journey: register, create tasks/journal, view dashboard', async () => {
    // Step 1: Register a new user
    const registerRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerRes.json();
    expect(registerRes.status).toBe(201);
    expect(registerData.success).toBe(true);
    expect(registerData.data.token).toBeDefined();
    
    const authToken = registerData.data.token;

    // Step 2: Login (verify the user can login)
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const loginData = await loginRes.json();
    expect(loginRes.status).toBe(200);
    expect(loginData.success).toBe(true);

    // Step 3: Create some tasks
    const task1Res = await app.request('/api/tasks', {
      method: 'POST',
      headers: createAuthHeaders(authToken),
      body: JSON.stringify({
        title: 'Complete project documentation',
        description: 'Write comprehensive docs for the journal app',
        dueDate: '2025-06-17'
      }),
    });

    const task1Data = await task1Res.json();
    expect(task1Res.status).toBe(201);
    expect(task1Data.data.title).toBe('Complete project documentation');

    const task2Res = await app.request('/api/tasks', {
      method: 'POST',
      headers: createAuthHeaders(authToken),
      body: JSON.stringify({
        title: 'Review code',
        description: 'Go through the backend implementation'
      }),
    });

    const task2Data = await task2Res.json();
    expect(task2Res.status).toBe(201);

    // Step 4: Mark one task as completed
    const updateTaskRes = await app.request(`/api/tasks/${task1Data.data.id}`, {
      method: 'PUT',
      headers: createAuthHeaders(authToken),
      body: JSON.stringify({
        isCompleted: true
      }),
    });

    const updateTaskData = await updateTaskRes.json();
    expect(updateTaskRes.status).toBe(200);
    expect(updateTaskData.data.isCompleted).toBe(true);

    // Step 5: Create journal entries
    const journal1Res = await app.request('/api/journal', {
      method: 'POST',
      headers: createAuthHeaders(authToken),
      body: JSON.stringify({
        title: 'Great progress today',
        content: 'Made significant progress on the journal app. The backend is coming together nicely with proper testing and type safety.'
      }),
    });

    const journal1Data = await journal1Res.json();
    expect(journal1Res.status).toBe(201);
    expect(journal1Data.data.title).toBe('Great progress today');

    const journal2Res = await app.request('/api/journal', {
      method: 'POST',
      headers: createAuthHeaders(authToken),
      body: JSON.stringify({
        title: 'Learning insights',
        content: 'Learned about the benefits of direct type imports from backend to frontend. Much cleaner architecture.'
      }),
    });

    expect(journal2Res.status).toBe(201);

    // Step 6: Get all tasks to verify they exist
    const allTasksRes = await app.request('/api/tasks', {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    const allTasksData = await allTasksRes.json();
    expect(allTasksRes.status).toBe(200);
    expect(allTasksData.data.length).toBeGreaterThanOrEqual(1); // At least one task exists

    // Step 7: Get all journal entries
    const allJournalRes = await app.request('/api/journal', {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    const allJournalData = await allJournalRes.json();
    expect(allJournalRes.status).toBe(200);
    expect(allJournalData.data).toHaveLength(2);

    // Step 8: Check dashboard shows everything
    const dashboardRes = await app.request('/api/dashboard', {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    const dashboardData = await dashboardRes.json();
    expect(dashboardRes.status).toBe(200);
    expect(dashboardData.success).toBe(true);
    expect(dashboardData.data.user.email).toBe(testUser.email);
    expect(dashboardData.data.tasks).toBeDefined();
    expect(dashboardData.data.journal).toBeDefined();
    expect(dashboardData.data.welcome).toBeDefined();

    // Step 9: Get user profile
    const profileRes = await app.request('/api/auth/me', {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    const profileData = await profileRes.json();
    expect(profileRes.status).toBe(200);
    expect(profileData.data.email).toBe(testUser.email);
    expect(profileData.data.firstName).toBe(testUser.firstName);

    // Step 10: Delete a task
    const deleteTaskRes = await app.request(`/api/tasks/${task2Data.data.id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(authToken),
    });

    expect(deleteTaskRes.status).toBe(200);

    // Step 11: Verify task was deleted
    const finalTasksRes = await app.request('/api/tasks', {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    const finalTasksData = await finalTasksRes.json();
    expect(finalTasksRes.status).toBe(200);
    expect(finalTasksData.data.length).toBeLessThan(allTasksData.data.length); // One less task than before
  });
});
