import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { simpleTodos } from '../db/schema/todos';
import { createSimpleTodoSchema, updateSimpleTodoSchema, completeSimpleTodoSchema } from '../validation/todos';
import { handleApiError } from '../utils/logger';
import type { SimpleTodoResponse } from '../../../shared/types/todos';

const app = new Hono()
  // Get user's simple todos (only active/incomplete ones by default)
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const todos = await db
        .select({
          id: simpleTodos.id,
          description: simpleTodos.description,
          isCompleted: simpleTodos.isCompleted,
          completedAt: simpleTodos.completedAt,
          createdAt: simpleTodos.createdAt,
          updatedAt: simpleTodos.updatedAt,
        })
        .from(simpleTodos)
        .where(and(eq(simpleTodos.userId, userId), eq(simpleTodos.isCompleted, false)))
        .orderBy(desc(simpleTodos.createdAt));

      const formattedTodos: SimpleTodoResponse[] = todos.map((todo) => ({
        id: todo.id,
        description: todo.description,
        isCompleted: todo.isCompleted,
        completedAt: todo.completedAt?.toISOString() || null,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
      }));

      return c.json({
        success: true,
        data: formattedTodos,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch simple todos');
    }
  })

  // Create a new simple todo
  .post('/', jwtAuth, zValidator('json', createSimpleTodoSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json');

      const [newTodo] = await db
        .insert(simpleTodos)
        .values({
          userId,
          description: data.description,
        })
        .returning({
          id: simpleTodos.id,
          description: simpleTodos.description,
          isCompleted: simpleTodos.isCompleted,
          completedAt: simpleTodos.completedAt,
          createdAt: simpleTodos.createdAt,
          updatedAt: simpleTodos.updatedAt,
        });

      const formattedTodo: SimpleTodoResponse = {
        id: newTodo.id,
        description: newTodo.description,
        isCompleted: newTodo.isCompleted,
        completedAt: newTodo.completedAt?.toISOString() || null,
        createdAt: newTodo.createdAt.toISOString(),
        updatedAt: newTodo.updatedAt.toISOString(),
      };

      return c.json(
        {
          success: true,
          data: formattedTodo,
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create simple todo');
    }
  })

  // Update a simple todo
  .put('/:id', jwtAuth, zValidator('json', updateSimpleTodoSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const todoId = c.req.param('id');
      const data = c.req.valid('json');

      // Check if todo exists and belongs to the user
      const existingTodo = await db
        .select()
        .from(simpleTodos)
        .where(and(eq(simpleTodos.id, todoId), eq(simpleTodos.userId, userId)))
        .limit(1);

      if (existingTodo.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Simple todo not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only update provided fields
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.isCompleted !== undefined) {
        updateData.isCompleted = data.isCompleted;
        // Set or clear completedAt based on completion status
        updateData.completedAt = data.isCompleted ? new Date() : null;
      }

      const [updatedTodo] = await db.update(simpleTodos).set(updateData).where(eq(simpleTodos.id, todoId)).returning({
        id: simpleTodos.id,
        description: simpleTodos.description,
        isCompleted: simpleTodos.isCompleted,
        completedAt: simpleTodos.completedAt,
        createdAt: simpleTodos.createdAt,
        updatedAt: simpleTodos.updatedAt,
      });

      const formattedTodo: SimpleTodoResponse = {
        id: updatedTodo.id,
        description: updatedTodo.description,
        isCompleted: updatedTodo.isCompleted,
        completedAt: updatedTodo.completedAt?.toISOString() || null,
        createdAt: updatedTodo.createdAt.toISOString(),
        updatedAt: updatedTodo.updatedAt.toISOString(),
      };

      return c.json({
        success: true,
        data: formattedTodo,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update simple todo');
    }
  })

  // Complete/uncomplete a simple todo (convenience endpoint)
  .patch('/:id/complete', jwtAuth, zValidator('json', completeSimpleTodoSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const todoId = c.req.param('id');
      const data = c.req.valid('json');

      // Check if todo exists and belongs to the user
      const existingTodo = await db
        .select()
        .from(simpleTodos)
        .where(and(eq(simpleTodos.id, todoId), eq(simpleTodos.userId, userId)))
        .limit(1);

      if (existingTodo.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Simple todo not found',
          },
          404,
        );
      }

      const [updatedTodo] = await db
        .update(simpleTodos)
        .set({
          isCompleted: data.isCompleted,
          completedAt: data.isCompleted ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(simpleTodos.id, todoId))
        .returning({
          id: simpleTodos.id,
          description: simpleTodos.description,
          isCompleted: simpleTodos.isCompleted,
          completedAt: simpleTodos.completedAt,
          createdAt: simpleTodos.createdAt,
          updatedAt: simpleTodos.updatedAt,
        });

      const formattedTodo: SimpleTodoResponse = {
        id: updatedTodo.id,
        description: updatedTodo.description,
        isCompleted: updatedTodo.isCompleted,
        completedAt: updatedTodo.completedAt?.toISOString() || null,
        createdAt: updatedTodo.createdAt.toISOString(),
        updatedAt: updatedTodo.updatedAt.toISOString(),
      };

      return c.json({
        success: true,
        data: formattedTodo,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to complete simple todo');
    }
  })

  // Delete a simple todo
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const todoId = c.req.param('id');

      // Check if todo exists and belongs to the user
      const existingTodo = await db
        .select()
        .from(simpleTodos)
        .where(and(eq(simpleTodos.id, todoId), eq(simpleTodos.userId, userId)))
        .limit(1);

      if (existingTodo.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Simple todo not found',
          },
          404,
        );
      }

      await db.delete(simpleTodos).where(eq(simpleTodos.id, todoId));

      return c.json({
        success: true,
        data: { id: todoId },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete simple todo');
    }
  });

export default app;
