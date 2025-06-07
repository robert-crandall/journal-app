import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { tasks, stats, createTaskSchema, completeTaskSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

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

// Create task
tasksRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const { title, description, dueDate, focusId, statId, familyMemberId } = c.req.valid('json');
  
  const [task] = await db.insert(tasks).values({
    userId: user.id,
    title,
    description,
    dueDate: dueDate ? new Date(dueDate) : null,
    focusId,
    statId,
    familyMemberId,
    origin: 'user',
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
  const { title, description, dueDate, focusId, statId, familyMemberId } = c.req.valid('json');
  
  const [updatedTask] = await db.update(tasks)
    .set({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
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

// Complete task
tasksRouter.post('/:id/complete', jwtMiddleware, userMiddleware, zValidator('json', completeTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const taskId = c.req.param('id');
  const { completionSummary } = c.req.valid('json');
  
  const [completedTask] = await db.update(tasks)
    .set({
      completedAt: new Date(),
      completionSummary,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
    .returning();
  
  if (!completedTask) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  // If task has a stat, increment its value
  if (completedTask.statId) {
    await db.update(stats)
      .set({
        currentValue: sql`${stats.currentValue} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(stats.id, completedTask.statId));
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
