import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { auth } from '../routes/auth';
import journal from '../routes/journal';
import { cleanupDatabase, testUser, createAuthHeaders, nonExistentUUID } from './setup';

describe('Journal Routes', () => {
  let app: Hono;
  let authToken: string;

  beforeEach(async () => {
    await cleanupDatabase();
    
    // Create app with auth and journal routes
    app = new Hono()
      .route('/api/auth', auth)
      .route('/api/journal', journal);

    // Register and login to get auth token
    const registerRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    
    const registerData = await registerRes.json();
    authToken = registerData.data.token;
  });

  describe('POST /api/journal', () => {
    it('should create a new journal entry successfully', async () => {
      const entryData = {
        content: 'Today was a great day! I learned a lot about TypeScript and had fun coding.',
        title: 'Great Learning Day'
      };

      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(entryData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe(entryData.content);
      expect(data.data.title).toBe(entryData.title);
      expect(data.data.id).toBeDefined();
      expect(data.data.createdAt).toBeDefined();
    });

    it('should create entry without title', async () => {
      const entryData = {
        content: 'Just some thoughts without a title.'
      };

      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(entryData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe(entryData.content);
      expect(data.data.title).toBe(null);
    });

    it('should fail without authentication', async () => {
      const entryData = {
        content: 'This should fail'
      };

      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail with empty content', async () => {
      const entryData = {
        content: ''
      };

      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(entryData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should fail with missing content', async () => {
      const entryData = {
        title: 'Title without content'
      };

      const res = await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(entryData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/journal', () => {
    beforeEach(async () => {
      // Create some test journal entries
      const entries = [
        { content: 'First entry', title: 'Day 1' },
        { content: 'Second entry', title: 'Day 2' },
        { content: 'Third entry' } // No title
      ];

      for (const entry of entries) {
        await app.request('/api/journal', {
          method: 'POST',
          headers: createAuthHeaders(authToken),
          body: JSON.stringify(entry),
        });
      }
    });

    it('should get all journal entries for authenticated user', async () => {
      const res = await app.request('/api/journal', {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].content).toBeDefined();
      expect(data.data[0].createdAt).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const res = await app.request('/api/journal', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      
      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/journal/:id', () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a journal entry first
      const createRes = await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          content: 'Test entry for individual fetch',
          title: 'Test Entry'
        }),
      });
      
      const createData = await createRes.json();
      entryId = createData.data.id;
    });

    it('should get specific journal entry', async () => {
      const res = await app.request(`/api/journal/${entryId}`, {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe('Test entry for individual fetch');
      expect(data.data.title).toBe('Test Entry');
    });

    it('should fail for non-existent entry', async () => {
      const res = await app.request(`/api/journal/${nonExistentUUID}`, {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/journal/:id', () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a journal entry first
      const createRes = await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          content: 'Original content',
          title: 'Original Title'
        }),
      });
      
      const createData = await createRes.json();
      entryId = createData.data.id;
    });

    it('should update journal entry successfully', async () => {
      const updateData = {
        content: 'Updated content with more details',
        title: 'Updated Title'
      };

      const res = await app.request(`/api/journal/${entryId}`, {
        method: 'PUT',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe(updateData.content);
      expect(data.data.title).toBe(updateData.title);
      expect(data.data.updatedAt).toBeDefined();
    });

    it('should fail to update non-existent entry', async () => {
      const updateData = {
        content: 'This should fail'
      };

      const res = await app.request(`/api/journal/${nonExistentUUID}`, {
        method: 'PUT',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/journal/:id', () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a journal entry first
      const createRes = await app.request('/api/journal', {
        method: 'POST',
        headers: createAuthHeaders(authToken),
        body: JSON.stringify({
          content: 'Entry to be deleted',
          title: 'Delete Me'
        }),
      });
      
      const createData = await createRes.json();
      entryId = createData.data.id;
    });

    it('should delete journal entry successfully', async () => {
      const res = await app.request(`/api/journal/${entryId}`, {
        method: 'DELETE',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify entry is deleted
      const getRes = await app.request(`/api/journal/${entryId}`, {
        method: 'GET',
        headers: createAuthHeaders(authToken),
      });
      
      expect(getRes.status).toBe(404);
    });

    it('should fail to delete non-existent entry', async () => {
      const res = await app.request(`/api/journal/${nonExistentUUID}`, {
        method: 'DELETE',
        headers: createAuthHeaders(authToken),
      });

      const data = await res.json();
      
      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
