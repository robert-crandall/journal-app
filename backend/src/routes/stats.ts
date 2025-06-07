import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db/index.js';
import { stats, insertStatSchema, updateStatSchema, type User } from '../db/schema.js';
import { jwtMiddleware, userMiddleware } from '../middleware/auth.js';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const app = new Hono<{ Variables: Variables }>();

// Get all stats for user
app.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const userStats = await db.select().from(stats)
    .where(eq(stats.userId, user.id))
    .orderBy(stats.name);
  
  return c.json(userStats);
});

// Get single stat
app.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  
  const stat = await db.select().from(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .limit(1);
  
  if (stat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  return c.json(stat[0]);
});

// Create new stat
app.post('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validation = insertStatSchema.safeParse({ ...body, userId: user.id });
  if (!validation.success) {
    return c.json({ error: 'Invalid data', details: validation.error }, 400);
  }
  
  const newStat = await db.insert(stats)
    .values(validation.data)
    .returning();
  
  return c.json(newStat[0], 201);
});

// Update stat
app.put('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();
  
  const validation = updateStatSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Invalid data', details: validation.error }, 400);
  }
  
  const updatedStat = await db.update(stats)
    .set(validation.data)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .returning();
  
  if (updatedStat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  return c.json(updatedStat[0]);
});

// Delete stat
app.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  
  // Check if stat is system default
  const stat = await db.select().from(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .limit(1);
    
  if (stat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  if (stat[0].systemDefault) {
    return c.json({ error: 'Cannot delete system default stats. You can disable them instead.' }, 400);
  }
  
  const deletedStat = await db.delete(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .returning();
  
  return c.json({ message: 'Stat deleted successfully' });
});

// Increment stat value
app.post('/:id/increment', jwtMiddleware, userMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();
  const amount = body.amount || 1;
  
  // First get the current stat
  const currentStat = await db.select().from(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .limit(1);
  
  if (currentStat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  const newValue = Math.min(99, currentStat[0].value + amount); // Cap at 99
  
  const updatedStat = await db.update(stats)
    .set({ value: newValue })
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .returning();
  
  return c.json(updatedStat[0]);
});

export default app;
