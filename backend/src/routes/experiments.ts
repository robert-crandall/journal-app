import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc, gte, lte, between } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { experiments, experimentTasks, experimentTaskCompletions } from '../db/schema/experiments';
import { journalEntries } from '../db/schema/journal';
import { xpGrants, characterStats } from '../db/schema/stats';
import {
  createExperimentSchema,
  updateExperimentSchema,
  createExperimentTaskSchema,
  updateExperimentTaskSchema,
  completeExperimentTaskSchema,
} from '../validation/experiments';
import { handleApiError } from '../utils/logger';
import type {
  CreateExperimentRequest,
  UpdateExperimentRequest,
  CreateExperimentTaskRequest,
  UpdateExperimentTaskRequest,
  CompleteExperimentTaskRequest,
  ExperimentResponse,
  ExperimentTaskResponse,
  ExperimentTaskCompletionResponse,
  ExperimentWithTasksResponse,
  ExperimentTaskWithCompletionsResponse,
  ExperimentDashboardResponse,
} from '../types/experiments';

// Helper function to serialize experiment dates
const serializeExperiment = (experiment: any): ExperimentResponse => ({
  ...experiment,
  createdAt: experiment.createdAt.toISOString(),
  updatedAt: experiment.updatedAt.toISOString(),
});

// Helper function to serialize experiment task dates
const serializeExperimentTask = (task: any): ExperimentTaskResponse => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});

// Helper function to serialize experiment task completion dates
const serializeExperimentTaskCompletion = (completion: any): ExperimentTaskCompletionResponse => ({
  ...completion,
  createdAt: completion.createdAt.toISOString(),
});

const app = new Hono()
  // Get user's experiments
  .get('/', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);

      const userExperiments = await db.select().from(experiments).where(eq(experiments.userId, userId)).orderBy(desc(experiments.createdAt));

      const serializedExperiments = userExperiments.map(serializeExperiment);

      return c.json({
        success: true,
        data: serializedExperiments,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch experiments');
    }
  })

  // Get a specific experiment by ID with tasks
  .get('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');

      // Get experiment
      const experiment = await db
        .select()
        .from(experiments)
        .where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (experiment.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Experiment not found',
          },
          404,
        );
      }

      // Get experiment tasks
      const tasks = await db.select().from(experimentTasks).where(eq(experimentTasks.experimentId, experimentId)).orderBy(asc(experimentTasks.createdAt));

      const response: ExperimentWithTasksResponse = {
        ...serializeExperiment(experiment[0]),
        tasks: tasks.map(serializeExperimentTask),
      };

      return c.json({
        success: true,
        data: response,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch experiment');
    }
  })

  // Create a new experiment
  .post('/', jwtAuth, zValidator('json', createExperimentSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as CreateExperimentRequest;

      // Create experiment
      const newExperiment = await db
        .insert(experiments)
        .values({
          userId,
          title: data.title,
          description: data.description || null,
          startDate: data.startDate,
          endDate: data.endDate,
        })
        .returning();

      // Create tasks if provided
      const tasks: ExperimentTaskResponse[] = [];
      if (data.tasks && data.tasks.length > 0) {
        const taskValues = data.tasks.map((task) => ({
          experimentId: newExperiment[0].id,
          description: task.description,
          successMetric: task.successMetric ?? 1,
          xpReward: task.xpReward ?? 0,
          statId: task.statId || null,
        }));

        const newTasks = await db.insert(experimentTasks).values(taskValues).returning();

        tasks.push(...newTasks.map(serializeExperimentTask));
      }

      const response: ExperimentWithTasksResponse = {
        ...serializeExperiment(newExperiment[0]),
        tasks,
      };

      return c.json(
        {
          success: true,
          data: response,
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create experiment');
    }
  })

  // Update a specific experiment
  .put('/:id', jwtAuth, zValidator('json', updateExperimentSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');
      const data = c.req.valid('json') as UpdateExperimentRequest;

      // Check if experiment exists and belongs to the user
      const existingExperiment = await db
        .select()
        .from(experiments)
        .where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (existingExperiment.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Experiment not found',
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
      if (data.startDate !== undefined) {
        updateData.startDate = data.startDate;
      }
      if (data.endDate !== undefined) {
        updateData.endDate = data.endDate;
      }

      const updatedExperiment = await db
        .update(experiments)
        .set(updateData)
        .where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)))
        .returning();

      return c.json({
        success: true,
        data: serializeExperiment(updatedExperiment[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update experiment');
    }
  })

  // Delete a specific experiment
  .delete('/:id', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');

      // Check if experiment exists and belongs to the user
      const existingExperiment = await db
        .select()
        .from(experiments)
        .where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (existingExperiment.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Experiment not found',
          },
          404,
        );
      }

      // Delete the experiment (cascade will handle tasks and completions)
      await db.delete(experiments).where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)));

      return c.json({
        success: true,
        data: { id: experimentId },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete experiment');
    }
  })

  // Get experiment tasks with completion status
  .get('/:id/tasks', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');

      // Verify experiment belongs to user
      const experiment = await db
        .select({ id: experiments.id })
        .from(experiments)
        .where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (experiment.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Experiment not found',
          },
          404,
        );
      }

      // Get tasks with completion information
      const tasks = await db.select().from(experimentTasks).where(eq(experimentTasks.experimentId, experimentId)).orderBy(asc(experimentTasks.createdAt));

      const tasksWithCompletions: ExperimentTaskWithCompletionsResponse[] = [];

      for (const task of tasks) {
        // Get completions for this task
        const completions = await db
          .select()
          .from(experimentTaskCompletions)
          .where(and(eq(experimentTaskCompletions.taskId, task.id), eq(experimentTaskCompletions.userId, userId)))
          .orderBy(desc(experimentTaskCompletions.completedDate));

        // Check if completed today
        const today = new Date().toISOString().split('T')[0];
        const isCompleteToday = completions.some((c) => c.completedDate === today);

        tasksWithCompletions.push({
          ...serializeExperimentTask(task),
          completions: completions.map(serializeExperimentTaskCompletion),
          completionCount: completions.length,
          isCompleteToday,
        });
      }

      return c.json({
        success: true,
        data: tasksWithCompletions,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch experiment tasks');
    }
  })

  // Create a new task for an experiment
  .post('/:id/tasks', jwtAuth, zValidator('json', createExperimentTaskSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');
      const data = c.req.valid('json') as CreateExperimentTaskRequest;

      // Verify experiment belongs to user
      const experiment = await db
        .select({ id: experiments.id })
        .from(experiments)
        .where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (experiment.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Experiment not found',
          },
          404,
        );
      }

      const newTask = await db
        .insert(experimentTasks)
        .values({
          experimentId,
          description: data.description,
          successMetric: data.successMetric ?? 1,
          xpReward: data.xpReward ?? 0,
          statId: data.statId || null,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeExperimentTask(newTask[0]),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create experiment task');
    }
  })

  // Update an experiment task
  .put('/:id/tasks/:taskId', jwtAuth, zValidator('json', updateExperimentTaskSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');
      const taskId = c.req.param('taskId');
      const data = c.req.valid('json') as UpdateExperimentTaskRequest;

      // Verify experiment belongs to user and task belongs to experiment
      const task = await db
        .select()
        .from(experimentTasks)
        .innerJoin(experiments, eq(experiments.id, experimentTasks.experimentId))
        .where(and(eq(experimentTasks.id, taskId), eq(experimentTasks.experimentId, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (task.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Task not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.successMetric !== undefined) {
        updateData.successMetric = data.successMetric;
      }
      if (data.xpReward !== undefined) {
        updateData.xpReward = data.xpReward;
      }
      if (data.statId !== undefined) {
        updateData.statId = data.statId || null;
      }

      const updatedTask = await db.update(experimentTasks).set(updateData).where(eq(experimentTasks.id, taskId)).returning();

      return c.json({
        success: true,
        data: serializeExperimentTask(updatedTask[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update experiment task');
    }
  })

  // Delete an experiment task
  .delete('/:id/tasks/:taskId', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');
      const taskId = c.req.param('taskId');

      // Verify experiment belongs to user and task belongs to experiment
      const task = await db
        .select()
        .from(experimentTasks)
        .innerJoin(experiments, eq(experiments.id, experimentTasks.experimentId))
        .where(and(eq(experimentTasks.id, taskId), eq(experimentTasks.experimentId, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (task.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Task not found',
          },
          404,
        );
      }

      await db.delete(experimentTasks).where(eq(experimentTasks.id, taskId));

      return c.json({
        success: true,
        data: { id: taskId },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete experiment task');
    }
  })

  // Complete an experiment task
  .post('/:id/tasks/:taskId/complete', jwtAuth, zValidator('json', completeExperimentTaskSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');
      const taskId = c.req.param('taskId');
      const data = c.req.valid('json') as CompleteExperimentTaskRequest;

      // Verify experiment belongs to user and task belongs to experiment
      const task = await db
        .select()
        .from(experimentTasks)
        .innerJoin(experiments, eq(experiments.id, experimentTasks.experimentId))
        .where(and(eq(experimentTasks.id, taskId), eq(experimentTasks.experimentId, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (task.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Task not found',
          },
          404,
        );
      }

      // Check if already completed for this date
      const existingCompletion = await db
        .select()
        .from(experimentTaskCompletions)
        .where(
          and(
            eq(experimentTaskCompletions.taskId, taskId),
            eq(experimentTaskCompletions.userId, userId),
            eq(experimentTaskCompletions.completedDate, data.completedDate),
          ),
        )
        .limit(1);

      if (existingCompletion.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Task already completed for this date',
          },
          400,
        );
      }

      // Create completion record
      const completion = await db
        .insert(experimentTaskCompletions)
        .values({
          taskId,
          userId,
          completedDate: data.completedDate,
          notes: data.notes || null,
        })
        .returning();

      // Award XP if configured
      if (task[0]?.experiment_tasks.xpReward && task[0].experiment_tasks.xpReward > 0) {
        const entityType = task[0].experiment_tasks.statId ? 'character_stat' : 'experiment_task';
        const entityId = task[0].experiment_tasks.statId || taskId;

        await db.insert(xpGrants).values({
          userId,
          entityType,
          entityId,
          xpAmount: task[0].experiment_tasks.xpReward,
          sourceType: 'task',
          sourceId: completion[0].id,
          reason: `Completed experiment task: ${task[0].experiment_tasks.description}`,
        });

        // If linked to a stat, update the stat's totalXp and level
        if (task[0].experiment_tasks.statId) {
          // Get current stat data
          const currentStat = await db.select().from(characterStats).where(eq(characterStats.id, task[0].experiment_tasks.statId)).limit(1);

          if (currentStat.length > 0) {
            const newTotalXp = currentStat[0].totalXp + task[0].experiment_tasks.xpReward;
            const newLevel = Math.floor(newTotalXp / 100) + 1; // Simple leveling formula

            await db
              .update(characterStats)
              .set({
                totalXp: newTotalXp,
                currentLevel: newLevel,
                updatedAt: new Date(),
              })
              .where(eq(characterStats.id, task[0].experiment_tasks.statId));
          }
        }
      }

      return c.json(
        {
          success: true,
          data: serializeExperimentTaskCompletion(completion[0]),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to complete experiment task');
    }
  })

  // Get experiment dashboard data
  .get('/:id/dashboard', jwtAuth, async (c) => {
    try {
      const userId = getUserId(c);
      const experimentId = c.req.param('id');

      // Get experiment with date validation
      const experiment = await db
        .select()
        .from(experiments)
        .where(and(eq(experiments.id, experimentId), eq(experiments.userId, userId)))
        .limit(1);

      if (experiment.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Experiment not found',
          },
          404,
        );
      }

      const exp = experiment[0];
      const startDate = new Date(exp.startDate);
      const endDate = new Date(exp.endDate);
      const today = new Date();

      // Calculate total days and completed days
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysElapsed = Math.max(0, Math.min(Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1, totalDays));

      // Get tasks with completion information
      const tasks = await db.select().from(experimentTasks).where(eq(experimentTasks.experimentId, experimentId)).orderBy(asc(experimentTasks.createdAt));

      const tasksWithCompletions: ExperimentTaskWithCompletionsResponse[] = [];
      let totalTaskCompletions = 0;
      let totalXpFromTasks = 0;

      for (const task of tasks) {
        const completions = await db
          .select()
          .from(experimentTaskCompletions)
          .where(
            and(
              eq(experimentTaskCompletions.taskId, task.id),
              eq(experimentTaskCompletions.userId, userId),
              gte(experimentTaskCompletions.completedDate, exp.startDate),
              lte(experimentTaskCompletions.completedDate, exp.endDate),
            ),
          )
          .orderBy(desc(experimentTaskCompletions.completedDate));

        const today = new Date().toISOString().split('T')[0];
        const isCompleteToday = completions.some((c) => c.completedDate === today);

        totalTaskCompletions += completions.length;
        totalXpFromTasks += completions.length * (task.xpReward ?? 0);

        tasksWithCompletions.push({
          ...serializeExperimentTask(task),
          completions: completions.map(serializeExperimentTaskCompletion),
          completionCount: completions.length,
          isCompleteToday,
        });
      }

      // Get journal entries during experiment
      const journalEntriesInRange = await db
        .select({
          id: journalEntries.id,
          title: journalEntries.title,
          synopsis: journalEntries.synopsis,
          createdAt: journalEntries.createdAt,
        })
        .from(journalEntries)
        .where(and(eq(journalEntries.userId, userId), between(journalEntries.createdAt, startDate, endDate)))
        .orderBy(desc(journalEntries.createdAt));

      // Get XP from journals during experiment
      const xpFromJournals = await db
        .select()
        .from(xpGrants)
        .where(and(eq(xpGrants.userId, userId), eq(xpGrants.sourceType, 'journal'), between(xpGrants.createdAt, startDate, endDate)));

      const totalXpFromJournals = xpFromJournals.reduce((sum, grant) => sum + grant.xpAmount, 0);
      const totalXpEarned = totalXpFromTasks + totalXpFromJournals;

      // Calculate total possible task instances (days * tasks)
      const totalTaskInstances = totalDays * tasks.length;

      const response: ExperimentDashboardResponse = {
        experiment: serializeExperiment(exp),
        stats: {
          daysCompleted: daysElapsed,
          totalDays,
          completionPercentage: totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0,
          totalXpEarned,
          tasksCompleted: totalTaskCompletions,
          totalTaskInstances,
        },
        tasks: tasksWithCompletions,
        journalEntries: journalEntriesInRange.map((entry) => ({
          id: entry.id,
          title: entry.title,
          synopsis: entry.synopsis,
          createdAt: entry.createdAt.toISOString(),
        })),
        xpBreakdown: {
          fromTasks: totalXpFromTasks,
          fromJournals: totalXpFromJournals,
          total: totalXpEarned,
        },
      };

      return c.json({
        success: true,
        data: response,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch experiment dashboard');
    }
  });

export default app;
