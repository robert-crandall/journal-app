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
  const { name, description, emoji, color, dayOfWeek, sampleActivities, statId, gptContext } = c.req.valid('json');
  
  const [focus] = await db.insert(focuses).values({
    userId: user.id,
    name,
    description,
    emoji,
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
  const { name, description, emoji, color, dayOfWeek, sampleActivities, statId, gptContext } = c.req.valid('json');
  
  const [updatedFocus] = await db.update(focuses)
    .set({
      name,
      description,
      emoji,
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

// Restore default focuses endpoint
focusesRouter.post('/restore-defaults', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  
  try {
    // Get the user's stats to find the IDs we need to reference
    const userStats = await db.query.stats.findMany({
      where: eq(stats.userId, user.id)
    });
    
    // Create a map for easy stat ID lookup
    const statIdMap: Record<string, string> = {};
    userStats.forEach(stat => {
      statIdMap[stat.name] = stat.id;
    });

    // Define default focus configurations
    const focusConfigs = [
      {
        name: 'Anchor',
        description: 'Begin the week grounded in movement and emotional clarity',
        emoji: '⚓',
        color: 'blue',
        dayOfWeek: 'Monday' as const,
        statName: 'Vitality',
        sampleActivities: ['Morning walk or run', 'Breathing exercises', 'Stretching routine', 'Cold shower']
      },
      {
        name: 'Creative Fire',
        description: 'Build or express something uniquely yours',
        emoji: '🔥',
        color: 'orange',
        dayOfWeek: 'Tuesday' as const,
        statName: 'Intellect',
        sampleActivities: ['Writing or journaling', 'Art or music creation', 'Problem-solving project', 'Learning new skill']
      },
      {
        name: 'Reset',
        description: 'Get into nature, unplug, breathe — let the nervous system soften',
        emoji: '🌿',
        color: 'green',
        dayOfWeek: 'Wednesday' as const,
        statName: 'Stillness',
        sampleActivities: ['Nature walk', 'Meditation', 'Digital detox time', 'Gentle yoga']
      },
      {
        name: 'Bridge',
        description: 'Deepen a connection with someone you care about (or with yourself)',
        emoji: '🌉',
        color: 'purple',
        dayOfWeek: 'Thursday' as const,
        statName: 'Presence',
        sampleActivities: ['Quality time with loved ones', 'Deep conversation', 'Active listening practice', 'Self-reflection']
      },
      {
        name: 'Power',
        description: 'Channel energy into physical intensity and embodied release',
        emoji: '💥',
        color: 'red',
        dayOfWeek: 'Friday' as const,
        statName: 'Strength',
        sampleActivities: ['Intense workout', 'Martial arts', 'Heavy lifting', 'Dance or movement']
      },
      {
        name: 'Forge',
        description: 'Fix, tinker, or build something real with your hands (and maybe your kids)',
        emoji: '🔨',
        color: 'amber',
        dayOfWeek: 'Saturday' as const,
        statName: 'Stewardship',
        sampleActivities: ['Home improvement', 'Crafting project', 'Gardening', 'Repair something broken']
      },
      {
        name: 'Mirror',
        description: 'Reflect, journal, visualize — prepare emotionally for what\'s next',
        emoji: '🪞',
        color: 'indigo',
        dayOfWeek: 'Sunday' as const,
        statName: 'Clarity',
        sampleActivities: ['Weekly review', 'Goal setting', 'Visualization', 'Journaling session']
      }
    ];

    // Get existing focuses to avoid duplicates (check by name and dayOfWeek combination)
    const existingFocuses = await db.query.focuses.findMany({
      where: eq(focuses.userId, user.id)
    });
    
    const existingKeys = new Set(
      existingFocuses.map(focus => `${focus.name}-${focus.dayOfWeek}`)
    );
    
    let createdCount = 0;

    // Create missing default focuses
    for (const focusConfig of focusConfigs) {
      const key = `${focusConfig.name}-${focusConfig.dayOfWeek}`;
      
      if (!existingKeys.has(key)) {
        try {
          const statId = statIdMap[focusConfig.statName];
          
          await db.insert(focuses).values({
            userId: user.id,
            name: focusConfig.name,
            description: focusConfig.description,
            emoji: focusConfig.emoji,
            color: focusConfig.color,
            dayOfWeek: focusConfig.dayOfWeek,
            statId: statId || null, // Use null if stat not found
            sampleActivities: focusConfig.sampleActivities
          });
          createdCount++;
        } catch (error) {
          console.error(`Failed to create default focus ${focusConfig.name} for user ${user.id}:`, error);
        }
      }
    }
    
    return c.json({ message: `Restored ${createdCount} default focuses`, createdCount });
    
  } catch (error) {
    console.error('Failed to restore default focuses:', error);
    return c.json({ error: 'Failed to restore default focuses' }, 500);
  }
});

export default focusesRouter;
