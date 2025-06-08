import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { 
  adhocTasks, 
  tasks, 
  stats, 
  potions,
  createAdhocTaskSchema, 
  updateAdhocTaskSchema,
  executeAdhocTaskSchema,
  type User 
} from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const adhocTasksRouter = new Hono<{ Variables: Variables }>();

// Get all ad hoc tasks for user
adhocTasksRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const userAdhocTasks = await db.query.adhocTasks.findMany({
    where: eq(adhocTasks.userId, user.id),
    with: {
      linkedStat: true,
    },
    orderBy: [desc(adhocTasks.createdAt)],
  });
  
  return c.json({ adhocTasks: userAdhocTasks });
});

// Create ad hoc task
adhocTasksRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createAdhocTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const { name, description, linkedStatId, xpValue, iconId, category } = c.req.valid('json');
  
  const [adhocTask] = await db.insert(adhocTasks).values({
    userId: user.id,
    name,
    description,
    linkedStatId,
    xpValue,
    iconId,
    category,
  }).returning();
  
  return c.json({ adhocTask });
});

// Get specific ad hoc task
adhocTasksRouter.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const adhocTaskId = c.req.param('id');
  
  const adhocTask = await db.query.adhocTasks.findFirst({
    where: and(eq(adhocTasks.id, adhocTaskId), eq(adhocTasks.userId, user.id)),
    with: {
      linkedStat: true,
    },
  });
  
  if (!adhocTask) {
    return c.json({ error: 'Ad hoc task not found' }, 404);
  }
  
  return c.json({ adhocTask });
});

// Update ad hoc task
adhocTasksRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', updateAdhocTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const adhocTaskId = c.req.param('id');
  const updateData = c.req.valid('json');
  
  const [updatedAdhocTask] = await db.update(adhocTasks)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(and(eq(adhocTasks.id, adhocTaskId), eq(adhocTasks.userId, user.id)))
    .returning();
  
  if (!updatedAdhocTask) {
    return c.json({ error: 'Ad hoc task not found' }, 404);
  }
  
  return c.json({ adhocTask: updatedAdhocTask });
});

// Execute ad hoc task (create completed task and award XP)
adhocTasksRouter.post('/:id/execute', jwtMiddleware, userMiddleware, zValidator('json', executeAdhocTaskSchema), async (c) => {
  const user = c.get('user') as User;
  const adhocTaskId = c.req.param('id');
  const { feedback, emotionTag, moodScore } = c.req.valid('json');
  
  // Get the ad hoc task
  const adhocTask = await db.query.adhocTasks.findFirst({
    where: and(eq(adhocTasks.id, adhocTaskId), eq(adhocTasks.userId, user.id)),
    with: {
      linkedStat: true,
    },
  });
  
  if (!adhocTask) {
    return c.json({ error: 'Ad hoc task not found' }, 404);
  }
  
  // Get active potions to link this task completion
  const activePotionIds = await getActivePotions(user.id);
  const potionId = activePotionIds.length > 0 ? activePotionIds[0] : null;
  
  // Create a completed task record
  const [completedTask] = await db.insert(tasks).values({
    userId: user.id,
    adhocTaskId: adhocTask.id,
    title: adhocTask.name,
    description: adhocTask.description,
    origin: 'adhoc',
    status: 'complete',
    completedAt: new Date(),
    feedback,
    emotionTag,
    moodScore,
    potionId,
  }).returning();
  
  // Award XP to the linked stat
  await db.update(stats)
    .set({
      xp: sql`${stats.xp} + ${adhocTask.xpValue}`,
      updatedAt: new Date(),
    })
    .where(eq(stats.id, adhocTask.linkedStatId));
  
  return c.json({ 
    task: completedTask,
    xpAwarded: adhocTask.xpValue,
    stat: adhocTask.linkedStat 
  });
});

// Delete ad hoc task
adhocTasksRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const adhocTaskId = c.req.param('id');
  
  const [deletedAdhocTask] = await db.delete(adhocTasks)
    .where(and(eq(adhocTasks.id, adhocTaskId), eq(adhocTasks.userId, user.id)))
    .returning();
  
  if (!deletedAdhocTask) {
    return c.json({ error: 'Ad hoc task not found' }, 404);
  }
  
  return c.json({ message: 'Ad hoc task deleted successfully' });
});

// Helper function to get active potions for a user
async function getActivePotions(userId: string): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const activePotions = await db.query.potions.findMany({
    where: and(
      eq(potions.userId, userId),
      eq(potions.isActive, true),
    ),
  });
  
  return activePotions.map(potion => potion.id);
}

export default adhocTasksRouter;