import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { goals } from '../db/schema/goals';
import { createGoalSchema, updateGoalSchema } from '../validation/goals';
import { HTTPException } from 'hono/http-exception';
import { handleApiError } from '../utils/logger';
import type { GoalWithParsedTags, CreateGoalWithTags, UpdateGoalWithTags } from '../types/goals';

// Helper function to parse tags from JSON string and serialize dates
const parseGoalTags = (goal: any): GoalWithParsedTags => ({
  ...goal,
  tags: goal.tags ? JSON.parse(goal.tags) : [],
  createdAt: goal.createdAt.toISOString(),
  updatedAt: goal.updatedAt.toISOString(),
});

// Helper function to serialize tags to JSON string
const serializeGoalTags = (tags?: string[]): string | null => {
  return tags && tags.length > 0 ? JSON.stringify(tags) : null;
};

// Chain methods for RPC compatibility
const app = new Hono()
  // Get user's goals
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));

      // Parse tags from JSON strings
      const goalsWithParsedTags = userGoals.map(parseGoalTags);

      return c.json({
        success: true,
        data: goalsWithParsedTags,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch goals');
      return; // This should never be reached, but added for completeness
    }
  })

  // Get a specific goal by ID
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const goalId = c.req.param('id');

      const goal = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .limit(1);

      if (goal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Goal not found',
          },
          404,
        );
      }

      const goalWithParsedTags = parseGoalTags(goal[0]);

      return c.json({
        success: true,
        data: goalWithParsedTags,
      });
    } catch (error) {
      handleApiError(error, 'Failed to fetch goal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Create a new goal
  .post('/', jwtAuth, zValidator('json', createGoalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as CreateGoalWithTags;

      const newGoal = await db
        .insert(goals)
        .values({
          userId,
          title: data.title,
          description: data.description || null,
          tags: serializeGoalTags(data.tags),
          isActive: data.isActive ?? true,
          isArchived: data.isArchived ?? false,
        })
        .returning();

      const goalWithParsedTags = parseGoalTags(newGoal[0]);

      return c.json(
        {
          success: true,
          data: goalWithParsedTags,
        },
        201,
      );
    } catch (error) {
      handleApiError(error, 'Failed to create goal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Update a specific goal
  .put('/:id', jwtAuth, zValidator('json', updateGoalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const goalId = c.req.param('id');
      const data = c.req.valid('json') as UpdateGoalWithTags;

      // Check if goal exists and belongs to the user
      const existingGoal = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .limit(1);

      if (existingGoal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Goal not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only update provided fields
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (data.description !== undefined) {
        updateData.description = data.description || null;
      }
      if (data.tags !== undefined) {
        updateData.tags = serializeGoalTags(data.tags);
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }
      if (data.isArchived !== undefined) {
        updateData.isArchived = data.isArchived;
      }

      const updatedGoal = await db
        .update(goals)
        .set(updateData)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .returning();

      const goalWithParsedTags = parseGoalTags(updatedGoal[0]);

      return c.json({
        success: true,
        data: goalWithParsedTags,
      });
    } catch (error) {
      handleApiError(error, 'Failed to update goal');
      return; // This should never be reached, but added for completeness
    }
  })

  // Delete a specific goal
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const goalId = c.req.param('id');

      const deletedGoal = await db
        .delete(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .returning();

      if (deletedGoal.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Goal not found',
          },
          404,
        );
      }

      const goalWithParsedTags = parseGoalTags(deletedGoal[0]);

      return c.json({
        success: true,
        data: goalWithParsedTags,
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete goal');
      return; // This should never be reached, but added for completeness
    }
  });

export default app;
