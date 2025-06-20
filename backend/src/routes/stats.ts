import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db/index.js';
import { stats, insertStatSchema, createStatSchema, updateStatSchema, type User } from '../db/schema.js';
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
  
  const validation = createStatSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Invalid data', details: validation.error }, 400);
  }
  
  const newStat = await db.insert(stats)
    .values({
      userId: user.id,
      name: validation.data.name,
      description: validation.data.description,
      icon: validation.data.icon,
      category: validation.data.category,
      enabled: validation.data.enabled ?? true,
      xp: 0,
      level: 1
    })
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
  
  // Check if stat exists
  const stat = await db.select().from(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .limit(1);
    
  if (stat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  const deletedStat = await db.delete(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .returning();
  
  return c.json({ message: 'Stat deleted successfully' });
});

// Add XP to stat (used by task completion)
app.post('/:id/add-xp', jwtMiddleware, userMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();
  const xpAmount = body.amount || 25; // Default 25 XP per task
  
  // First get the current stat
  const currentStat = await db.select().from(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .limit(1);
  
  if (currentStat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  const stat = currentStat[0];
  const newXp = stat.xp + xpAmount;
  
  // Calculate if level up is available
  // Level up available if XP > ((level-1) * 100)
  const levelUpThreshold = (stat.level - 1) * 100;
  const canLevelUp = newXp > levelUpThreshold;
  
  const updatedStat = await db.update(stats)
    .set({ 
      xp: newXp,
      updatedAt: new Date()
    })
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .returning();
  
  return c.json({
    ...updatedStat[0],
    canLevelUp,
    xpToNextLevel: levelUpThreshold + 100 - newXp
  });
});

// Level up stat (manual action by user)
app.post('/:id/level-up', jwtMiddleware, userMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  
  // First get the current stat
  const currentStat = await db.select().from(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .limit(1);
  
  if (currentStat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  const stat = currentStat[0];
  const levelUpThreshold = (stat.level - 1) * 100;
  
  // Check if level up is available
  if (stat.xp <= levelUpThreshold) {
    return c.json({ 
      error: 'Level up not available yet',
      xpNeeded: levelUpThreshold + 1 - stat.xp
    }, 400);
  }
  
  const updatedStat = await db.update(stats)
    .set({ 
      level: stat.level + 1,
      updatedAt: new Date()
    })
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .returning();
  
  return c.json(updatedStat[0]);
});

// Legacy increment endpoint for backward compatibility (now adds XP)
app.post('/:id/increment', jwtMiddleware, userMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();
  const amount = body.amount || 1;
  
  // Convert to XP (25 XP per "increment")
  const xpAmount = amount * 25;
  
  // First get the current stat
  const currentStat = await db.select().from(stats)
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .limit(1);
  
  if (currentStat.length === 0) {
    return c.json({ error: 'Stat not found' }, 404);
  }
  
  const stat = currentStat[0];
  const newXp = stat.xp + xpAmount;
  
  // Calculate if level up is available
  const levelUpThreshold = (stat.level - 1) * 100;
  const canLevelUp = newXp > levelUpThreshold;
  
  const updatedStat = await db.update(stats)
    .set({ 
      xp: newXp,
      updatedAt: new Date()
    })
    .where(and(eq(stats.id, id), eq(stats.userId, user.id)))
    .returning();
  
  return c.json({
    ...updatedStat[0],
    canLevelUp,
    xpToNextLevel: levelUpThreshold + 100 - newXp
  });
});
export default app;
