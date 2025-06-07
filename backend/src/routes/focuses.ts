import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { focuses, stats, createFocusSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const focusesRouter = new Hono<{ Variables: Variables }>();

const createStatSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// Get all focuses for user
focusesRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  
  const userFocuses = await db.query.focuses.findMany({
    where: eq(focuses.userId, user.id),
    with: {
      stat: true,
    },
  });
  
  return c.json({ focuses: userFocuses });
});

// Create focus
focusesRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createFocusSchema), async (c) => {
  const user = c.get('user') as User;
  const { name, description, icon, color, dayOfWeek, sampleActivities, statId, gptContext } = c.req.valid('json');
  
  const [focus] = await db.insert(focuses).values({
    userId: user.id,
    name,
    description,
    icon,
    color,
    dayOfWeek,
    sampleActivities,
    statId,
    gptContext,
  }).returning();
  
  return c.json({ focus });
});

// Get specific focus
focusesRouter.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const focusId = c.req.param('id');
  
  const focus = await db.query.focuses.findFirst({
    where: and(eq(focuses.id, focusId), eq(focuses.userId, user.id)),
    with: {
      stat: true,
    },
  });
  
  if (!focus) {
    return c.json({ error: 'Focus not found' }, 404);
  }
  
  return c.json({ focus });
});

// Update focus
focusesRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', createFocusSchema), async (c) => {
  const user = c.get('user') as User;
  const focusId = c.req.param('id');
  const { name, description, icon, color, dayOfWeek, sampleActivities, statId, gptContext } = c.req.valid('json');
  
  const [updatedFocus] = await db.update(focuses)
    .set({
      name,
      description,
      icon,
      color,
      dayOfWeek,
      sampleActivities,
      statId,
      gptContext,
      updatedAt: new Date(),
    })
    .where(and(eq(focuses.id, focusId), eq(focuses.userId, user.id)))
    .returning();
  
  if (!updatedFocus) {
    return c.json({ error: 'Focus not found' }, 404);
  }
  
  return c.json({ focus: updatedFocus });
});

// Delete focus
focusesRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const focusId = c.req.param('id');
  
  const [deletedFocus] = await db.delete(focuses)
    .where(and(eq(focuses.id, focusId), eq(focuses.userId, user.id)))
    .returning();
  
  if (!deletedFocus) {
    return c.json({ error: 'Focus not found' }, 404);
  }
  
  return c.json({ message: 'Focus deleted successfully' });
});

// Create stat for focus
focusesRouter.post('/:id/stats', jwtMiddleware, userMiddleware, zValidator('json', createStatSchema), async (c) => {
  const user = c.get('user') as User;
  const focusId = c.req.param('id');
  const { name, description } = c.req.valid('json');
  
  // Verify focus exists and belongs to user
  const focus = await db.query.focuses.findFirst({
    where: and(eq(focuses.id, focusId), eq(focuses.userId, user.id)),
  });
  
  if (!focus) {
    return c.json({ error: 'Focus not found' }, 404);
  }
  
  const [stat] = await db.insert(stats).values({
    userId: user.id,
    name,
    description,
  }).returning();
  
  // Link the focus to this stat
  await db.update(focuses)
    .set({ statId: stat.id })
    .where(and(eq(focuses.id, focusId), eq(focuses.userId, user.id)));
  
  return c.json({ stat });
});

// Get stats for focus
focusesRouter.get('/:id/stats', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const focusId = c.req.param('id');
  
  // Get the focus with its associated stat
  const focusWithStat = await db.query.focuses.findFirst({
    where: and(eq(focuses.id, focusId), eq(focuses.userId, user.id)),
    with: {
      stat: true,
    },
  });
  
  if (!focusWithStat) {
    return c.json({ error: 'Focus not found' }, 404);
  }
  
  return c.json({ stats: focusWithStat.stat ? [focusWithStat.stat] : [] });
});



export default focusesRouter;
