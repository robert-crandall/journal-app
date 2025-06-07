import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db/index.js';
import { stats, statTemplates, insertStatSchema, updateStatSchema, applyTemplateSchema, type User } from '../db/schema.js';
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
    .where(and(eq(stats.userId, user.id), eq(stats.enabled, true)))
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

// Get all templates
app.get('/templates', async (c) => {
  const templates = await db.select().from(statTemplates)
    .orderBy(statTemplates.name);
  
  return c.json(templates);
});

// Apply a template
app.post('/templates/:templateId/apply', jwtMiddleware, userMiddleware, async (c) => {
  const templateId = c.req.param('templateId');
  const user = c.get('user');
  
  // Get the template
  const template = await db.select().from(statTemplates)
    .where(eq(statTemplates.id, templateId))
    .limit(1);
    
  if (template.length === 0) {
    return c.json({ error: 'Template not found' }, 404);
  }
  
  const recommendedStats = template[0].recommendedStats;
  
  // Define stat configurations
  const statConfigs: Record<string, { category: 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy'; emoji: string; color: string; description: string }> = {
    // BODY
    'Strength': { category: 'body', emoji: '💪', color: 'red', description: 'Physical health, energy, resilience, and capacity to take physical action' },
    'Dexterity': { category: 'body', emoji: '🤸', color: 'orange', description: 'Agility, coordination, body control, and adaptability under pressure' },
    'Vitality': { category: 'body', emoji: '⚡', color: 'yellow', description: 'Your overall life force: sleep, mood, stress regulation, libido, sense of aliveness' },
    
    // MIND
    'Intellect': { category: 'mind', emoji: '🧠', color: 'blue', description: 'Creative problem-solving, mental clarity, strategic thinking, and curiosity' },
    'Wisdom': { category: 'mind', emoji: '🦉', color: 'indigo', description: 'Emotional intelligence, reflection, insight, and making grounded decisions' },
    'Discipline': { category: 'mind', emoji: '🎯', color: 'purple', description: 'Habits, follow-through, structure, and resistance to impulse or distraction' },
    
    // CONNECTION
    'Charisma': { category: 'connection', emoji: '✨', color: 'pink', description: 'Confidence, emotional presence, social engagement, and ability to influence others' },
    'Intimacy': { category: 'connection', emoji: '💝', color: 'rose', description: 'Capacity for closeness, emotional openness, and authentic connection (with self or others)' },
    'Courage': { category: 'connection', emoji: '🦁', color: 'amber', description: 'Willingness to confront hard truths, speak up, or act in uncertainty' },
    'Craft': { category: 'connection', emoji: '🔨', color: 'emerald', description: 'Practical skill-building: making, fixing, building — external proof of internal mastery' }
  };
  
  const newStats = [];
  
  for (const statName of recommendedStats) {
    const config = statConfigs[statName];
    if (!config) continue;
    
    // Check if stat already exists for user
    const existingStat = await db.select().from(stats)
      .where(and(eq(stats.userId, user.id), eq(stats.name, statName)))
      .limit(1);
      
    if (existingStat.length === 0) {
      // Create new stat
      const newStat = await db.insert(stats)
        .values({
          userId: user.id,
          name: statName,
          description: config.description,
          emoji: config.emoji,
          color: config.color,
          category: config.category,
          enabled: true,
          systemDefault: true,
          value: 0
        })
        .returning();
        
      newStats.push(newStat[0]);
    } else {
      // Enable existing stat and mark as system default
      const updatedStat = await db.update(stats)
        .set({ enabled: true, systemDefault: true })
        .where(and(eq(stats.id, existingStat[0].id), eq(stats.userId, user.id)))
        .returning();
        
      newStats.push(updatedStat[0]);
    }
  }
  
  return c.json({ 
    message: 'Template applied successfully',
    stats: newStats,
    template: template[0]
  });
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
