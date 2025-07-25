import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { goals } from '../db/schema/goals';
import { createGoalSchema, updateGoalSchema } from '../validation/goals';
import { handleApiError } from '../utils/logger';
import { getGoalTags, setGoalTags, serializeGoalWithTags } from '../utils/tags';
import type { GoalWithParsedTags, GoalWithTags, CreateGoalWithTags, UpdateGoalWithTags } from '../../../shared/types/goals';

// Helper function for backwards compatibility - converts GoalWithTags to GoalWithParsedTags
const convertToLegacyFormat = (goalWithTags: GoalWithTags): GoalWithParsedTags => ({
  ...goalWithTags,
  tags: goalWithTags.tags.map((tag) => tag.name), // Convert Tag objects to string array
});

// Chain methods for RPC compatibility
const app = new Hono()
  // Get user's goals
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));

      // Get tags for each goal and serialize
      const goalsWithTags: GoalWithParsedTags[] = [];

      for (const goal of userGoals) {
        const goalTags = await getGoalTags(goal.id);
        const goalWithTags = serializeGoalWithTags(goal, goalTags);
        goalsWithTags.push(convertToLegacyFormat(goalWithTags));
      }

      return c.json({
        success: true,
        data: goalsWithTags,
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

      const goalTags = await getGoalTags(goal[0].id);
      const goalWithTags = serializeGoalWithTags(goal[0], goalTags);

      return c.json({
        success: true,
        data: convertToLegacyFormat(goalWithTags),
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
          isActive: data.isActive ?? true,
          isArchived: data.isArchived ?? false,
        })
        .returning();

      // Set tags for the new goal
      const goalTags = await setGoalTags(newGoal[0].id, userId, data.tags || []);
      const goalWithTags = serializeGoalWithTags(newGoal[0], goalTags);

      return c.json(
        {
          success: true,
          data: convertToLegacyFormat(goalWithTags),
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

      // Update tags if provided
      let goalTags;
      if (data.tags !== undefined) {
        goalTags = await setGoalTags(goalId, userId, data.tags);
      } else {
        goalTags = await getGoalTags(goalId);
      }

      const goalWithTags = serializeGoalWithTags(updatedGoal[0], goalTags);

      return c.json({
        success: true,
        data: convertToLegacyFormat(goalWithTags),
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

      // Get goal with tags before deletion for response
      const goalToDelete = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .limit(1);

      if (goalToDelete.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Goal not found',
          },
          404,
        );
      }

      const goalTags = await getGoalTags(goalId);

      // Delete the goal (cascade will handle goal_tags cleanup)
      await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

      const goalWithTags = serializeGoalWithTags(goalToDelete[0], goalTags);

      return c.json({
        success: true,
        data: convertToLegacyFormat(goalWithTags),
      });
    } catch (error) {
      handleApiError(error, 'Failed to delete goal');
      return; // This should never be reached, but added for completeness
    }
  });

export default app;
