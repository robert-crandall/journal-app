import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { tasks, stats, focuses, users, createTaskSchema, completeTaskSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';
import { generateDailyTasks, getTodaysFocus, getOrGenerateTodaysTask, type TaskGenerationContext } from '../utils/gptTaskGenerator';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const tasksRouter = new Hono<{ Variables: Variables }>();

// Get all tasks for user
tasksRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const userTasks = await db.query.tasks.findMany({
    where: eq(tasks.userId, user.id),
    with: {
      focus: true,
      stat: true,
      familyMember: true,
    },
    orderBy: [desc(tasks.createdAt)],
  });
  
  return c.json({ tasks: userTasks });
});

// Get or generate today's tasks
tasksRouter.get('/daily', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  try {
    const todaysTasks = await getOrGenerateTodaysTask(user.id);
    return c.json({ tasks: todaysTasks });
  } catch (error) {
    console.error('Failed to get or generate daily tasks:', error);
    return c.json({ error: 'Failed to get or generate daily tasks' }, 500);
  }
});

// Create task
tasksRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const { 
    title, 
    description, 
    dueDate, 
    taskDate,
    source,
    linkedStatIds,
    linkedFamilyMemberIds,
    focusId, 
    statId, 
    familyMemberId 
  } = c.req.valid('json');
  
  const [task] = await db.insert(tasks).values({
    userId: user.id,
    title,
    description,
    dueDate: dueDate || null,
    taskDate: taskDate || null,
    source,
    linkedStatIds: linkedStatIds || [],
    linkedFamilyMemberIds: linkedFamilyMemberIds || [],
    focusId,
    statId,
    familyMemberId,
    origin: 'user',
    status: 'pending',
  }).returning();
  
  return c.json({ task });
});

// Get specific task
tasksRouter.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const taskId = c.req.param('id');
  
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, user.id)),
    with: {
      focus: true,
      stat: true,
      familyMember: true,
    },
  });
  
  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  return c.json({ task });
});

// Update task
tasksRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', createTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const taskId = c.req.param('id');
  const { 
    title, 
    description, 
    dueDate,
    taskDate,
    source,
    linkedStatIds,
    linkedFamilyMemberIds,
    focusId, 
    statId, 
    familyMemberId 
  } = c.req.valid('json');
  
  const [updatedTask] = await db.update(tasks)
    .set({
      title,
      description,
      dueDate: dueDate || null,
      taskDate: taskDate || null,
      source,
      linkedStatIds: linkedStatIds || [],
      linkedFamilyMemberIds: linkedFamilyMemberIds || [],
      focusId,
      statId,
      familyMemberId,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
    .returning();
  
  if (!updatedTask) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  return c.json({ task: updatedTask });
});

// Complete task (now supports status, feedback, emotion)
tasksRouter.post('/:id/complete', jwtMiddleware, userMiddleware, zValidator('json', completeTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const taskId = c.req.param('id');
  const { status, completionSummary, feedback, emotionTag } = c.req.valid('json');
  
  const [completedTask] = await db.update(tasks)
    .set({
      status,
      completedAt: status === 'complete' ? new Date() : null,
      completionSummary,
      feedback,
      emotionTag,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
    .returning();
  
  if (!completedTask) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  // Only award XP if task was marked as complete
  if (status === 'complete') {
    let statIdsToAward: string[] = [];
    
    // Collect stat IDs from linkedStatIds array (new primary method)
    if (completedTask.linkedStatIds && Array.isArray(completedTask.linkedStatIds)) {
      statIdsToAward = [...completedTask.linkedStatIds];
    }
    
    // Also include legacy single stat ID for backward compatibility
    if (completedTask.statId) {
      statIdsToAward.push(completedTask.statId);
    }
    
    // Include stat from focus if exists (legacy)
    if (completedTask.focusId) {
      const taskWithFocus = await db.query.tasks.findFirst({
        where: eq(tasks.id, completedTask.id),
        with: {
          focus: true
        }
      });
      
      if (taskWithFocus?.focus?.statId) {
        statIdsToAward.push(taskWithFocus.focus.statId);
      }
    }
    
    // Remove duplicates
    statIdsToAward = Array.from(new Set(statIdsToAward));
    
    // Award 25 XP to each linked stat
    for (const statId of statIdsToAward) {
      await db.update(stats)
        .set({
          xp: sql`${stats.xp} + 25`,
          updatedAt: new Date(),
        })
        .where(eq(stats.id, statId));
    }
  }
  
  return c.json({ task: completedTask });
});

// Delete task
tasksRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const taskId = c.req.param('id');
  
  const [deletedTask] = await db.delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
    .returning();
  
  if (!deletedTask) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  return c.json({ message: 'Task deleted successfully' });
});

export default tasksRouter;
