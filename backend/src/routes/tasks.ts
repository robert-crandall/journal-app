import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc, isNull, or, gte, lt } from 'drizzle-orm';
import { db } from '../db/index';
import { tasks, taskCompletions, characterStats, familyMembers, characterStatXpGrants } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import logger, { handleApiError } from '../utils/logger';
import {
  createTaskSchema,
  updateTaskSchema,
  completeTaskSchema,
  tasksQuerySchema,
} from '../validation/tasks';
import type {
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  TaskWithRelations,
  DailyTaskView,
} from '../types/tasks';

const app = new Hono();

// GET /tasks - Get tasks for user with optional filtering
app.get('/', jwtAuth, zValidator('query', tasksQuerySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const query = c.req.valid('query');

    // Build where conditions
    const whereConditions = [eq(tasks.userId, userId)];

    if (query.sourceType) {
      whereConditions.push(eq(tasks.sourceType, query.sourceType));
    }
    if (query.sourceId) {
      whereConditions.push(eq(tasks.sourceId, query.sourceId));
    }
    if (query.isCompleted !== undefined) {
      whereConditions.push(eq(tasks.isCompleted, query.isCompleted));
    }
    if (query.dueDate) {
      const dueDate = new Date(query.dueDate);
      whereConditions.push(eq(tasks.dueDate, dueDate));
    }

    // Build the query with all conditions
    const queryOptions = {
      where: and(...whereConditions),
      orderBy: [desc(tasks.priority), asc(tasks.dueDate), asc(tasks.createdAt)],
      ...(query.limit && { limit: query.limit }),
      ...(query.offset && { offset: query.offset }),
    };

    const userTasks = await db
      .select()
      .from(tasks)
      .where(queryOptions.where)
      .orderBy(...queryOptions.orderBy)
      .limit(query.limit || 1000) // Default limit to prevent unbounded queries
      .offset(query.offset || 0);

    let result: TaskWithRelations[] = userTasks;

    // Include relations if requested
    if (query.includeRelations) {
      const taskIds = userTasks.map(task => task.id);
      
      if (taskIds.length > 0) {
        // Get stats for tasks
        const taskStats = await db
          .select({ taskId: tasks.id, stat: characterStats })
          .from(tasks)
          .leftJoin(characterStats, eq(tasks.statId, characterStats.id))
          .where(and(eq(tasks.userId, userId), or(...taskIds.map(id => eq(tasks.id, id)))));

        // Get family members for tasks
        const taskFamilyMembers = await db
          .select({ taskId: tasks.id, familyMember: familyMembers })
          .from(tasks)
          .leftJoin(familyMembers, eq(tasks.familyMemberId, familyMembers.id))
          .where(and(eq(tasks.userId, userId), or(...taskIds.map(id => eq(tasks.id, id)))));

        // Get completions for tasks
        const taskCompletionsData = await db
          .select()
          .from(taskCompletions)
          .where(and(eq(taskCompletions.userId, userId), or(...taskIds.map(id => eq(taskCompletions.taskId, id)))))
          .orderBy(desc(taskCompletions.completedAt));

        // Map relations to tasks
        result = userTasks.map(task => {
          const stat = taskStats.find(ts => ts.taskId === task.id)?.stat;
          const familyMember = taskFamilyMembers.find(tfm => tfm.taskId === task.id)?.familyMember;
          const completions = taskCompletionsData.filter(tc => tc.taskId === task.id);

          return {
            ...task,
            stat: stat ? { id: stat.id, name: stat.name } : undefined,
            familyMember: familyMember ? { id: familyMember.id, name: familyMember.name } : undefined,
            completions,
          };
        });
      }
    }

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch tasks');
  }
});

// GET /tasks/daily - Get today's tasks formatted for daily view
app.get('/daily', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyTasks = await db
      .select({
        task: tasks,
        stat: characterStats,
        familyMember: familyMembers,
      })
      .from(tasks)
      .leftJoin(characterStats, eq(tasks.statId, characterStats.id))
      .leftJoin(familyMembers, eq(tasks.familyMemberId, familyMembers.id))        .where(
          and(
            eq(tasks.userId, userId),
            or(
              and(gte(tasks.dueDate, today), lt(tasks.dueDate, tomorrow)),
              isNull(tasks.dueDate)
            )
          )
        )
      .orderBy(desc(tasks.priority), asc(tasks.dueDate));

    const result: DailyTaskView[] = dailyTasks.map(({ task, stat, familyMember }) => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      sourceType: task.sourceType,
      priority: task.priority || 1,
      xpReward: task.xpReward || 0,
      dueDate: task.dueDate || undefined,
      isCompleted: task.isCompleted,
      stat: stat ? { id: stat.id, name: stat.name } : undefined,
      familyMember: familyMember ? { id: familyMember.id, name: familyMember.name } : undefined,
    }));

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch daily tasks');
  }
});

// GET /tasks/:id - Get specific task
app.get('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const taskId = c.req.param('id');

    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (task.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: task[0],
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch task');
  }
});

// POST /tasks - Create new task
app.post('/', jwtAuth, zValidator('json', createTaskSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const data = c.req.valid('json') as CreateTaskRequest;

    const newTask = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        description: data.description,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority || 1,
        statId: data.statId,
        xpReward: data.xpReward || 0,
        familyMemberId: data.familyMemberId,
        isRecurring: data.isRecurring || false,
        recurringType: data.recurringType,
        recurringDays: data.recurringDays ? JSON.stringify(data.recurringDays) : null,
      })
      .returning();

    logger.info(`Task created: ${data.title} for user ${userId}`);

    return c.json(
      {
        success: true,
        data: newTask[0],
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create task');
  }
});

// PUT /tasks/:id - Update task
app.put('/:id', jwtAuth, zValidator('json', updateTaskSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const taskId = c.req.param('id');
    const data = c.req.valid('json') as UpdateTaskRequest;

    // Verify task exists and belongs to user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (existingTask.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.statId !== undefined) updateData.statId = data.statId;
    if (data.xpReward !== undefined) updateData.xpReward = data.xpReward;
    if (data.familyMemberId !== undefined) updateData.familyMemberId = data.familyMemberId;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.recurringType !== undefined) updateData.recurringType = data.recurringType;
    if (data.recurringDays !== undefined) updateData.recurringDays = data.recurringDays ? JSON.stringify(data.recurringDays) : null;

    const updatedTask = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    logger.info(`Task updated: ${taskId} for user ${userId}`);

    return c.json({
      success: true,
      data: updatedTask[0],
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update task');
  }
});

// POST /tasks/:id/complete - Mark task as complete
app.post('/:id/complete', jwtAuth, zValidator('json', completeTaskSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const taskId = c.req.param('id');
    const data = c.req.valid('json') as CompleteTaskRequest;

    // Verify task exists and belongs to user
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (task.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    if (task[0].isCompleted) {
      return c.json(
        {
          success: false,
          error: 'Task is already completed',
        },
        400
      );
    }

    const completedAt = new Date();

    // Mark task as completed
    await db
      .update(tasks)
      .set({
        isCompleted: true,
        completedAt,
        updatedAt: completedAt,
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    // Create completion record
    const completion = await db
      .insert(taskCompletions)
      .values({
        userId,
        taskId,
        completedAt,
        xpGranted: task[0].xpReward || 0,
        notes: data.notes,
      })
      .returning();

    // Grant XP if task has stat and XP reward
    if (task[0].statId && task[0].xpReward && task[0].xpReward > 0) {
      // Import XP granting logic from stats utils
      const { grantXpToStat } = await import('../utils/stats');
      await grantXpToStat(userId, task[0].statId, task[0].xpReward, 'task', taskId, `Completed task: ${task[0].title}`);
    }

    logger.info(`Task completed: ${task[0].title} for user ${userId}, XP granted: ${task[0].xpReward}`);

    return c.json({
      success: true,
      data: {
        completion: completion[0],
        xpGranted: task[0].xpReward || 0,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to complete task');
  }
});

// DELETE /tasks/:id - Delete task
app.delete('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const taskId = c.req.param('id');

    // Verify task exists and belongs to user
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (task.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    // Delete task (completions will be cascade deleted)
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    logger.info(`Task deleted: ${taskId} for user ${userId}`);

    return c.json({
      success: true,
      data: { id: taskId },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to delete task');
  }
});

export default app;
