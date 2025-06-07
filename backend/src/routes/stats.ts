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

// Restore default stats endpoint
app.post('/restore-defaults', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  try {
    // Define default stat configurations
    const statConfigs: Record<string, { category: 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy'; emoji: string; color: string; description: string }> = {
      // BODY
      'Strength': { category: 'body', emoji: '💪', color: 'red', description: 'Physical health, energy, resilience, and capacity to take physical action' },
      'Dexterity': { category: 'body', emoji: '🤸', color: 'orange', description: 'Agility, coordination, body control, and adaptability under pressure' },
      'Vitality': { category: 'body', emoji: '⚡', color: 'yellow', description: 'Your overall life force: sleep, mood, stress regulation, libido, sense of aliveness' },
      
      // MIND
      'Intellect': { category: 'mind', emoji: '🧠', color: 'blue', description: 'Creative problem-solving, mental clarity, strategic thinking, and curiosity' },
      'Wisdom': { category: 'mind', emoji: '🦉', color: 'indigo', description: 'Emotional intelligence, reflection, insight, and making grounded decisions' },
      'Discipline': { category: 'mind', emoji: '🎯', color: 'purple', description: 'Habits, follow-through, structure, and resistance to impulse or distraction' },
      'Clarity': { category: 'mind', emoji: '💎', color: 'cyan', description: 'Mental focus, clear thinking, and ability to see situations objectively' },
      
      // CONNECTION
      'Charisma': { category: 'connection', emoji: '✨', color: 'pink', description: 'Confidence, emotional presence, social engagement, and ability to influence others' },
      'Intimacy': { category: 'connection', emoji: '💝', color: 'rose', description: 'Capacity for closeness, emotional openness, and authentic connection (with self or others)' },
      'Courage': { category: 'connection', emoji: '🦁', color: 'amber', description: 'Willingness to confront hard truths, speak up, or act in uncertainty' },
      'Craft': { category: 'connection', emoji: '🔨', color: 'emerald', description: 'Practical skill-building: making, fixing, building — external proof of internal mastery' },
      'Presence': { category: 'connection', emoji: '🌸', color: 'pink', description: 'Full attention and awareness in relationships and interactions' },
      
      // SHADOW
      'Avoidance': { category: 'shadow', emoji: '🌫️', color: 'slate', description: 'Tendency to withdraw, procrastinate, or numb out when overwhelmed' },
      'Reactivity': { category: 'shadow', emoji: '⚡', color: 'red', description: 'Emotional impulsiveness or defensiveness in response to stress' },
      'Burnout': { category: 'shadow', emoji: '🔥', color: 'orange', description: 'Energy depletion due to overcommitment or misaligned effort' },
      'Disconnection': { category: 'shadow', emoji: '🔌', color: 'gray', description: 'Feeling emotionally cut off from yourself or others' },
      
      // SPIRIT
      'Alignment': { category: 'spirit', emoji: '🎯', color: 'violet', description: 'Living in accordance with personal values and truth' },
      'Stillness': { category: 'spirit', emoji: '🧘', color: 'blue', description: 'Capacity for presence, meditation, and quiet awareness' },
      'Faith': { category: 'spirit', emoji: '🙏', color: 'cyan', description: 'Trust in process, purpose, or something greater than oneself' },
      'Meaning': { category: 'spirit', emoji: '🌟', color: 'yellow', description: 'Clarity about your "why," purpose, or role in life\'s story' },
      
      // LEGACY
      'Mentorship': { category: 'legacy', emoji: '👥', color: 'green', description: 'Efforts to guide, teach, or support others (especially children)' },
      'Stewardship': { category: 'legacy', emoji: '🌱', color: 'emerald', description: 'Care for your environment, projects, or community over time' },
      'Creatorship': { category: 'legacy', emoji: '🛠️', color: 'purple', description: 'Building things that outlive you (music, code, systems, rituals)' },
      'Lineage': { category: 'legacy', emoji: '🌳', color: 'lime', description: 'Honoring ancestry, traditions, or shaping generational values' }
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
            emoji: config.emoji,
            color: config.color,
            category: config.category,
            enabled: true,
            systemDefault: true,
            value: 0
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
