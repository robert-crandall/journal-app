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
      dayOfWeek: validation.data.dayOfWeek,
      sampleTasks: validation.data.sampleTasks,
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

// Restore default stats endpoint
app.post('/restore-defaults', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  try {
    // Define default stat configurations
    const statConfigs: Record<string, { category: 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy'; icon: string; description: string }> = {
      // BODY
      'Strength': { category: 'body', icon: 'dumbbell', description: 'Physical health, energy, resilience, and capacity to take physical action' },
      'Dexterity': { category: 'body', icon: 'move', description: 'Agility, coordination, body control, and adaptability under pressure' },
      'Vitality': { category: 'body', icon: 'heart-pulse', description: 'Your overall life force: sleep, mood, stress regulation, libido, sense of aliveness' },
      
      // MIND
      'Intellect': { category: 'mind', icon: 'brain', description: 'Creative problem-solving, mental clarity, strategic thinking, and curiosity' },
      'Wisdom': { category: 'mind', icon: 'book-open', description: 'Emotional intelligence, reflection, insight, and making grounded decisions' },
      'Discipline': { category: 'mind', icon: 'check-circle', description: 'Habits, follow-through, structure, and resistance to impulse or distraction' },
      'Clarity': { category: 'mind', icon: 'target', description: 'Mental focus, clear thinking, and ability to see situations objectively' },
      
      // CONNECTION
      'Charisma': { category: 'connection', icon: 'megaphone', description: 'Confidence, emotional presence, social engagement, and ability to influence others' },
      'Intimacy': { category: 'connection', icon: 'handshake', description: 'Capacity for closeness, emotional openness, and authentic connection (with self or others)' },
      'Courage': { category: 'connection', icon: 'shield', description: 'Willingness to confront hard truths, speak up, or act in uncertainty' },
      'Craft': { category: 'connection', icon: 'hammer', description: 'Practical skill-building: making, fixing, building — external proof of internal mastery' },
      'Presence': { category: 'connection', icon: 'radar', description: 'Full attention and awareness in relationships and interactions' },
      
      // SHADOW
      'Avoidance': { category: 'shadow', icon: 'arrow-left', description: 'Tendency to withdraw, procrastinate, or numb out when overwhelmed' },
      'Reactivity': { category: 'shadow', icon: 'zap', description: 'Emotional impulsiveness or defensiveness in response to stress' },
      'Burnout': { category: 'shadow', icon: 'flame', description: 'Energy depletion due to overcommitment or misaligned effort' },
      'Disconnection': { category: 'shadow', icon: 'ban', description: 'Feeling emotionally cut off from yourself or others' },
      
      // SPIRIT
      'Alignment': { category: 'spirit', icon: 'compass', description: 'Living in accordance with personal values and truth' },
      'Stillness': { category: 'spirit', icon: 'moon', description: 'Capacity for presence, meditation, and quiet awareness' },
      'Faith': { category: 'spirit', icon: 'infinity', description: 'Trust in process, purpose, or something greater than oneself' },
      'Meaning': { category: 'spirit', icon: 'lightbulb', description: 'Clarity about your "why," purpose, or role in life\'s story' },
      
      // LEGACY
      'Mentorship': { category: 'legacy', icon: 'users', description: 'Efforts to guide, teach, or support others (especially children)' },
      'Stewardship': { category: 'legacy', icon: 'tree-deciduous', description: 'Care for your environment, projects, or community over time' },
      'Creatorship': { category: 'legacy', icon: 'hammer', description: 'Building things that outlive you (music, code, systems, rituals)' },
      'Lineage': { category: 'legacy', icon: 'archive', description: 'Honoring ancestry, traditions, or shaping generational values' }
    };

    // Get existing stats to avoid duplicates
    const existingStats = await db.select().from(stats)
      .where(eq(stats.userId, user.id));
    
    const existingStatNames = new Set(existingStats.map(stat => stat.name));
    
    let createdCount = 0;
    
    // Create missing default stats
    for (const [statName, config] of Object.entries(statConfigs)) {
      if (!existingStatNames.has(statName)) {
        try {
          await db.insert(stats).values({
            userId: user.id,
            name: statName,
            description: config.description,
            icon: config.icon,
            category: config.category,
            enabled: true,
            xp: 0,
            level: 1
          });
          createdCount++;
        } catch (error) {
          console.error(`Failed to create default stat ${statName} for user ${user.id}:`, error);
        }
      }
    }
    
    return c.json({ message: `Restored ${createdCount} default stats`, createdCount });
    
  } catch (error) {
    console.error('Failed to restore default stats:', error);
    return c.json({ error: 'Failed to restore default stats' }, 500);
  }
});

export default app;
