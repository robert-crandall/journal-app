import { zodValidatorWithErrorHandler } from '../utils/validation';
import { Hono } from 'hono';
import { eq, and, desc, asc } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { plans, planSubtasks } from '../db/schema/plans';
import {
  createPlanSchema,
  updatePlanSchema,
  createPlanSubtaskSchema,
  updatePlanSubtaskSchema,
  completePlanSubtaskSchema,
  reorderPlanSubtasksSchema,
} from '../validation/plans';
import { handleApiError } from '../utils/logger';
import type { PlanResponse, PlanSubtaskResponse, PlanWithSubtasksResponse } from '../../../shared/types/plans';

const app = new Hono()
  // Get user's plans
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const userPlans = await db
        .select({
          id: plans.id,
          title: plans.title,
          type: plans.type,
          description: plans.description,
          focusId: plans.focusId,
          isOrdered: plans.isOrdered,
          lastActivityAt: plans.lastActivityAt,
          createdAt: plans.createdAt,
          updatedAt: plans.updatedAt,
        })
        .from(plans)
        .where(eq(plans.userId, userId))
        .orderBy(desc(plans.updatedAt));

      const formattedPlans: PlanResponse[] = userPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: plan.type as any,
        description: plan.description,
        focusId: plan.focusId,
        isOrdered: plan.isOrdered,
        lastActivityAt: plan.lastActivityAt?.toISOString() || null,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      }));

      return c.json({
        success: true,
        data: formattedPlans,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch plans');
    }
  })

  // Create a new plan
  .post('/', jwtAuth, zodValidatorWithErrorHandler('json', createPlanSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json');

      const [newPlan] = await db
        .insert(plans)
        .values({
          userId,
          title: data.title,
          type: data.type,
          description: data.description,
          focusId: data.focusId,
          isOrdered: data.isOrdered || false,
        })
        .returning({
          id: plans.id,
          title: plans.title,
          type: plans.type,
          description: plans.description,
          focusId: plans.focusId,
          isOrdered: plans.isOrdered,
          lastActivityAt: plans.lastActivityAt,
          createdAt: plans.createdAt,
          updatedAt: plans.updatedAt,
        });

      const formattedPlan: PlanResponse = {
        id: newPlan.id,
        title: newPlan.title,
        type: newPlan.type as any,
        description: newPlan.description,
        focusId: newPlan.focusId,
        isOrdered: newPlan.isOrdered,
        lastActivityAt: newPlan.lastActivityAt?.toISOString() || null,
        createdAt: newPlan.createdAt.toISOString(),
        updatedAt: newPlan.updatedAt.toISOString(),
      };

      return c.json(
        {
          success: true,
          data: formattedPlan,
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create plan');
    }
  })

  // Get a specific plan with its subtasks
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('id');

      // Get the plan
      const planResult = await db
        .select({
          id: plans.id,
          title: plans.title,
          type: plans.type,
          description: plans.description,
          focusId: plans.focusId,
          isOrdered: plans.isOrdered,
          lastActivityAt: plans.lastActivityAt,
          createdAt: plans.createdAt,
          updatedAt: plans.updatedAt,
        })
        .from(plans)
        .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
        .limit(1);

      if (planResult.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Plan not found',
          },
          404,
        );
      }

      const plan = planResult[0];

      // Get the plan's subtasks
      const subtasks = await db
        .select({
          id: planSubtasks.id,
          planId: planSubtasks.planId,
          title: planSubtasks.title,
          description: planSubtasks.description,
          isCompleted: planSubtasks.isCompleted,
          completedAt: planSubtasks.completedAt,
          orderIndex: planSubtasks.orderIndex,
          createdAt: planSubtasks.createdAt,
          updatedAt: planSubtasks.updatedAt,
        })
        .from(planSubtasks)
        .where(eq(planSubtasks.planId, planId))
        .orderBy(plan.isOrdered ? asc(planSubtasks.orderIndex) : desc(planSubtasks.createdAt));

      const formattedSubtasks: PlanSubtaskResponse[] = subtasks.map((subtask) => ({
        id: subtask.id,
        planId: subtask.planId,
        title: subtask.title,
        description: subtask.description,
        isCompleted: subtask.isCompleted,
        completedAt: subtask.completedAt?.toISOString() || null,
        orderIndex: subtask.orderIndex,
        createdAt: subtask.createdAt.toISOString(),
        updatedAt: subtask.updatedAt.toISOString(),
      }));

      const formattedPlan: PlanWithSubtasksResponse = {
        id: plan.id,
        title: plan.title,
        type: plan.type as any,
        description: plan.description,
        focusId: plan.focusId,
        isOrdered: plan.isOrdered,
        lastActivityAt: plan.lastActivityAt?.toISOString() || null,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        subtasks: formattedSubtasks,
      };

      return c.json({
        success: true,
        data: formattedPlan,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch plan');
    }
  })

  // Update a plan
  .put('/:id', jwtAuth, zodValidatorWithErrorHandler('json', updatePlanSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('id');
      const data = c.req.valid('json');

      // Check if plan exists and belongs to the user
      const existingPlan = await db
        .select()
        .from(plans)
        .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
        .limit(1);

      if (existingPlan.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Plan not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only update provided fields
      if (data.title !== undefined) updateData.title = data.title;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.focusId !== undefined) updateData.focusId = data.focusId;
      if (data.isOrdered !== undefined) updateData.isOrdered = data.isOrdered;

      const [updatedPlan] = await db.update(plans).set(updateData).where(eq(plans.id, planId)).returning({
        id: plans.id,
        title: plans.title,
        type: plans.type,
        description: plans.description,
        focusId: plans.focusId,
        isOrdered: plans.isOrdered,
        lastActivityAt: plans.lastActivityAt,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      });

      const formattedPlan: PlanResponse = {
        id: updatedPlan.id,
        title: updatedPlan.title,
        type: updatedPlan.type as any,
        description: updatedPlan.description,
        focusId: updatedPlan.focusId,
        isOrdered: updatedPlan.isOrdered,
        lastActivityAt: updatedPlan.lastActivityAt?.toISOString() || null,
        createdAt: updatedPlan.createdAt.toISOString(),
        updatedAt: updatedPlan.updatedAt.toISOString(),
      };

      return c.json({
        success: true,
        data: formattedPlan,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update plan');
    }
  })

  // Delete a plan
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('id');

      // Check if plan exists and belongs to the user
      const existingPlan = await db
        .select()
        .from(plans)
        .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
        .limit(1);

      if (existingPlan.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Plan not found',
          },
          404,
        );
      }

      // Delete the plan (subtasks will be deleted automatically due to cascade)
      await db.delete(plans).where(eq(plans.id, planId));

      return c.json({
        success: true,
        data: { id: planId },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete plan');
    }
  })

  // Create a subtask for a plan
  .post('/:id/subtasks', jwtAuth, zodValidatorWithErrorHandler('json', createPlanSubtaskSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('id');
      const data = c.req.valid('json');

      // Check if plan exists and belongs to the user
      const existingPlan = await db
        .select()
        .from(plans)
        .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
        .limit(1);

      if (existingPlan.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Plan not found',
          },
          404,
        );
      }

      const [newSubtask] = await db
        .insert(planSubtasks)
        .values({
          planId,
          userId,
          title: data.title,
          description: data.description,
          orderIndex: data.orderIndex,
        })
        .returning({
          id: planSubtasks.id,
          planId: planSubtasks.planId,
          title: planSubtasks.title,
          description: planSubtasks.description,
          isCompleted: planSubtasks.isCompleted,
          completedAt: planSubtasks.completedAt,
          orderIndex: planSubtasks.orderIndex,
          createdAt: planSubtasks.createdAt,
          updatedAt: planSubtasks.updatedAt,
        });

      const formattedSubtask: PlanSubtaskResponse = {
        id: newSubtask.id,
        planId: newSubtask.planId,
        title: newSubtask.title,
        description: newSubtask.description,
        isCompleted: newSubtask.isCompleted,
        completedAt: newSubtask.completedAt?.toISOString() || null,
        orderIndex: newSubtask.orderIndex,
        createdAt: newSubtask.createdAt.toISOString(),
        updatedAt: newSubtask.updatedAt.toISOString(),
      };

      return c.json(
        {
          success: true,
          data: formattedSubtask,
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create plan subtask');
    }
  })

  // Update a subtask
  .put('/:planId/subtasks/:subtaskId', jwtAuth, zodValidatorWithErrorHandler('json', updatePlanSubtaskSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('planId');
      const subtaskId = c.req.param('subtaskId');
      const data = c.req.valid('json');

      // Check if subtask exists and belongs to the user's plan
      const existingSubtask = await db
        .select()
        .from(planSubtasks)
        .where(and(eq(planSubtasks.id, subtaskId), eq(planSubtasks.planId, planId), eq(planSubtasks.userId, userId)))
        .limit(1);

      if (existingSubtask.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Subtask not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only update provided fields
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

      if (data.isCompleted !== undefined) {
        updateData.isCompleted = data.isCompleted;
        updateData.completedAt = data.isCompleted ? new Date() : null;

        // Update plan's last activity time when a task is completed
        if (data.isCompleted) {
          await db.update(plans).set({ lastActivityAt: new Date(), updatedAt: new Date() }).where(eq(plans.id, planId));
        }
      }

      const [updatedSubtask] = await db.update(planSubtasks).set(updateData).where(eq(planSubtasks.id, subtaskId)).returning({
        id: planSubtasks.id,
        planId: planSubtasks.planId,
        title: planSubtasks.title,
        description: planSubtasks.description,
        isCompleted: planSubtasks.isCompleted,
        completedAt: planSubtasks.completedAt,
        orderIndex: planSubtasks.orderIndex,
        createdAt: planSubtasks.createdAt,
        updatedAt: planSubtasks.updatedAt,
      });

      const formattedSubtask: PlanSubtaskResponse = {
        id: updatedSubtask.id,
        planId: updatedSubtask.planId,
        title: updatedSubtask.title,
        description: updatedSubtask.description,
        isCompleted: updatedSubtask.isCompleted,
        completedAt: updatedSubtask.completedAt?.toISOString() || null,
        orderIndex: updatedSubtask.orderIndex,
        createdAt: updatedSubtask.createdAt.toISOString(),
        updatedAt: updatedSubtask.updatedAt.toISOString(),
      };

      return c.json({
        success: true,
        data: formattedSubtask,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update subtask');
    }
  })

  // Complete/uncomplete a subtask (convenience endpoint)
  .patch('/:planId/subtasks/:subtaskId/complete', jwtAuth, zodValidatorWithErrorHandler('json', completePlanSubtaskSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('planId');
      const subtaskId = c.req.param('subtaskId');
      const data = c.req.valid('json');

      // Check if subtask exists and belongs to the user's plan
      const existingSubtask = await db
        .select()
        .from(planSubtasks)
        .where(and(eq(planSubtasks.id, subtaskId), eq(planSubtasks.planId, planId), eq(planSubtasks.userId, userId)))
        .limit(1);

      if (existingSubtask.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Subtask not found',
          },
          404,
        );
      }

      const [updatedSubtask] = await db
        .update(planSubtasks)
        .set({
          isCompleted: data.isCompleted,
          completedAt: data.isCompleted ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(planSubtasks.id, subtaskId))
        .returning({
          id: planSubtasks.id,
          planId: planSubtasks.planId,
          title: planSubtasks.title,
          description: planSubtasks.description,
          isCompleted: planSubtasks.isCompleted,
          completedAt: planSubtasks.completedAt,
          orderIndex: planSubtasks.orderIndex,
          createdAt: planSubtasks.createdAt,
          updatedAt: planSubtasks.updatedAt,
        });

      // Update plan's last activity time when a task is completed
      if (data.isCompleted) {
        await db.update(plans).set({ lastActivityAt: new Date(), updatedAt: new Date() }).where(eq(plans.id, planId));
      }

      const formattedSubtask: PlanSubtaskResponse = {
        id: updatedSubtask.id,
        planId: updatedSubtask.planId,
        title: updatedSubtask.title,
        description: updatedSubtask.description,
        isCompleted: updatedSubtask.isCompleted,
        completedAt: updatedSubtask.completedAt?.toISOString() || null,
        orderIndex: updatedSubtask.orderIndex,
        createdAt: updatedSubtask.createdAt.toISOString(),
        updatedAt: updatedSubtask.updatedAt.toISOString(),
      };

      return c.json({
        success: true,
        data: formattedSubtask,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to complete subtask');
    }
  })

  // Delete a subtask
  .delete('/:planId/subtasks/:subtaskId', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('planId');
      const subtaskId = c.req.param('subtaskId');

      // Check if subtask exists and belongs to the user's plan
      const existingSubtask = await db
        .select()
        .from(planSubtasks)
        .where(and(eq(planSubtasks.id, subtaskId), eq(planSubtasks.planId, planId), eq(planSubtasks.userId, userId)))
        .limit(1);

      if (existingSubtask.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Subtask not found',
          },
          404,
        );
      }

      await db.delete(planSubtasks).where(eq(planSubtasks.id, subtaskId));

      return c.json({
        success: true,
        data: { id: subtaskId },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete subtask');
    }
  })

  // Reorder subtasks (for ordered plans)
  .patch('/:id/subtasks/reorder', jwtAuth, zodValidatorWithErrorHandler('json', reorderPlanSubtasksSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const planId = c.req.param('id');
      const data = c.req.valid('json');

      // Check if plan exists, belongs to the user, and is ordered
      const existingPlan = await db
        .select()
        .from(plans)
        .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
        .limit(1);

      if (existingPlan.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Plan not found',
          },
          404,
        );
      }

      if (!existingPlan[0].isOrdered) {
        return c.json(
          {
            success: false,
            error: 'Cannot reorder subtasks for unordered plans',
          },
          400,
        );
      }

      // Update order indices for each subtask
      const updatePromises = data.subtaskIds.map((subtaskId: string, index: number) =>
        db
          .update(planSubtasks)
          .set({ orderIndex: index, updatedAt: new Date() })
          .where(and(eq(planSubtasks.id, subtaskId), eq(planSubtasks.planId, planId), eq(planSubtasks.userId, userId))),
      );

      await Promise.all(updatePromises);

      return c.json({
        success: true,
        data: { message: 'Subtasks reordered successfully' },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to reorder subtasks');
    }
  });

export default app;
