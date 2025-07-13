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

describe('Simple Todos API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: { name: string; email: string; password: string };

  beforeEach(async () => {

    // Create a test user with unique email and get auth token for protected routes
    testUser = {
      name: 'Test User',
      email: getUniqueEmail('todos'),
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

  describe('GET /api/todos', () => {
    it('should return empty array when user has no todos', async () => {
      const res = await app.request('/api/todos', {
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

    it('should return only incomplete todos', async () => {
      const db = testDb();

      // Create some todos directly in database
      await db.insert(schema.simpleTodos).values([
        {
          userId,
          description: 'Incomplete todo',
          isCompleted: false,
        },
        {
          userId,
          description: 'Completed todo',
          isCompleted: true,
          completedAt: new Date(),
        },
      ]);

      const res = await app.request('/api/todos', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].description).toBe('Incomplete todo');
      expect(responseData.data[0].isCompleted).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/todos', {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });

    it('should only return todos for the authenticated user', async () => {
      const db = testDb();

      // Create another user
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-todos'),
          password: 'password',
        })
        .returning();

      // Create todos for both users
      await db.insert(schema.simpleTodos).values([
        {
          userId,
          description: 'My todo',
          isCompleted: false,
        },
        {
          userId: anotherUser[0].id,
          description: 'Other user todo',
          isCompleted: false,
        },
      ]);

      const res = await app.request('/api/todos', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.data[0].description).toBe('My todo');
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new simple todo', async () => {
      const todoData = {
        description: 'Buy groceries',
      };

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(todoData),
      });

      expect(res.status).toBe(201);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        description: todoData.description,
        isCompleted: false,
        completedAt: null,
      });
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data).toHaveProperty('createdAt');
      expect(responseData.data).toHaveProperty('updatedAt');

      // Verify todo was actually created in database
      const db = testDb();
      const dbTodo = await db.select().from(schema.simpleTodos).where(eq(schema.simpleTodos.id, responseData.data.id)).limit(1);

      expect(dbTodo).toHaveLength(1);
      expect(dbTodo[0].description).toBe(todoData.description);
      expect(dbTodo[0].userId).toBe(userId);
      expect(dbTodo[0].isCompleted).toBe(false);
    });

    it('should require authentication', async () => {
      const todoData = {
        description: 'Buy groceries',
      };

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it('should validate description length', async () => {
      const todoData = {
        description: 'x'.repeat(501), // Too long
      };

      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(todoData),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      // Create a test todo
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: 'Original description',
        }),
      });
      const responseData = await res.json();
      todoId = responseData.data.id;
    });

    it('should update todo description', async () => {
      const updateData = {
        description: 'Updated description',
      };

      const res = await app.request(`/api/todos/${todoId}`, {
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
        id: todoId,
        description: updateData.description,
        isCompleted: false,
      });

      // Verify in database
      const db = testDb();
      const dbTodo = await db.select().from(schema.simpleTodos).where(eq(schema.simpleTodos.id, todoId)).limit(1);

      expect(dbTodo[0].description).toBe(updateData.description);
    });

    it('should update completion status', async () => {
      const updateData = {
        isCompleted: true,
      };

      const res = await app.request(`/api/todos/${todoId}`, {
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
        id: todoId,
        isCompleted: true,
      });
      expect(responseData.data.completedAt).not.toBeNull();

      // Verify in database
      const db = testDb();
      const dbTodo = await db.select().from(schema.simpleTodos).where(eq(schema.simpleTodos.id, todoId)).limit(1);

      expect(dbTodo[0].isCompleted).toBe(true);
      expect(dbTodo[0].completedAt).not.toBeNull();
    });

    it('should allow partial updates', async () => {
      const updateData = {
        description: 'Partially updated',
      };

      const res = await app.request(`/api/todos/${todoId}`, {
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
        id: todoId,
        description: updateData.description,
        isCompleted: false, // Should remain unchanged
      });
    });

    it('should return 404 for non-existent todo', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/todos/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: 'Updated',
        }),
      });

      expect(res.status).toBe(404);
    });

    it('should not allow updating other users todos', async () => {
      const db = testDb();

      // Create another user and their todo
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-todos'),
          password: 'password',
        })
        .returning();

      const anotherTodo = await db
        .insert(schema.simpleTodos)
        .values({
          userId: anotherUser[0].id,
          description: 'Other user todo',
        })
        .returning();

      const res = await app.request(`/api/todos/${anotherTodo[0].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: 'Trying to update',
        }),
      });

      expect(res.status).toBe(404); // Should be treated as not found
    });
  });

  describe('PATCH /api/todos/:id/complete', () => {
    let todoId: string;

    beforeEach(async () => {
      // Create a test todo
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: 'Test todo',
        }),
      });
      const responseData = await res.json();
      todoId = responseData.data.id;
    });

    it('should mark todo as completed', async () => {
      const res = await app.request(`/api/todos/${todoId}/complete`, {
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

    it('should mark todo as incomplete', async () => {
      // First complete it
      await app.request(`/api/todos/${todoId}/complete`, {
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
      const res = await app.request(`/api/todos/${todoId}/complete`, {
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

  describe('DELETE /api/todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      // Create a test todo
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          description: 'Todo to delete',
        }),
      });
      const responseData = await res.json();
      todoId = responseData.data.id;
    });

    it('should delete todo', async () => {
      const res = await app.request(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(todoId);

      // Verify todo was deleted from database
      const db = testDb();
      const dbTodos = await db.select().from(schema.simpleTodos).where(eq(schema.simpleTodos.id, todoId));

      expect(dbTodos).toHaveLength(0);
    });

    it('should return 404 for non-existent todo', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const res = await app.request(`/api/todos/${nonExistentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should not allow deleting other users todos', async () => {
      const db = testDb();

      // Create another user and their todo
      const anotherUser = await db
        .insert(schema.users)
        .values({
          name: 'Another User',
          email: getUniqueEmail('another-todos'),
          password: 'password',
        })
        .returning();

      const anotherTodo = await db
        .insert(schema.simpleTodos)
        .values({
          userId: anotherUser[0].id,
          description: 'Other user todo',
        })
        .returning();

      const res = await app.request(`/api/todos/${anotherTodo[0].id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404); // Should be treated as not found
    });
  });
});
