import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { users, attributes, stats, focuses, loginSchema, registerSchema, createAttributeSchema, type User } from '../db/schema';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const auth = new Hono<{ Variables: Variables }>();

// Helper function to populate default stats for new users
async function populateDefaultStatsForUser(userId: string) {
  // Define stat configurations (same as in stats.ts)
  const statConfigs: Record<string, { category: 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy'; icon: string; color: string; description: string }> = {
    // BODY
    'Strength': { category: 'body', icon: 'dumbbell', color: 'red', description: 'Physical health, energy, resilience, and capacity to take physical action' },
    'Dexterity': { category: 'body', icon: 'move', color: 'orange', description: 'Agility, coordination, body control, and adaptability under pressure' },
    'Vitality': { category: 'body', icon: 'heart-pulse', color: 'yellow', description: 'Your overall life force: sleep, mood, stress regulation, libido, sense of aliveness' },
    
    // MIND
    'Intellect': { category: 'mind', icon: 'brain', color: 'blue', description: 'Creative problem-solving, mental clarity, strategic thinking, and curiosity' },
    'Wisdom': { category: 'mind', icon: 'book-open', color: 'indigo', description: 'Emotional intelligence, reflection, insight, and making grounded decisions' },
    'Discipline': { category: 'mind', icon: 'check-circle', color: 'purple', description: 'Habits, follow-through, structure, and resistance to impulse or distraction' },
    'Clarity': { category: 'mind', icon: 'target', color: 'cyan', description: 'Mental focus, clear thinking, and ability to see situations objectively' },
    
    // CONNECTION
    'Charisma': { category: 'connection', icon: 'megaphone', color: 'pink', description: 'Confidence, emotional presence, social engagement, and ability to influence others' },
    'Intimacy': { category: 'connection', icon: 'handshake', color: 'rose', description: 'Capacity for closeness, emotional openness, and authentic connection (with self or others)' },
    'Courage': { category: 'connection', icon: 'shield', color: 'amber', description: 'Willingness to confront hard truths, speak up, or act in uncertainty' },
    'Craft': { category: 'connection', icon: 'hammer', color: 'emerald', description: 'Practical skill-building: making, fixing, building — external proof of internal mastery' },
    'Presence': { category: 'connection', icon: 'radar', color: 'pink', description: 'Full attention and awareness in relationships and interactions' },
    
    // SHADOW
    'Avoidance': { category: 'shadow', icon: 'arrow-left', color: 'slate', description: 'Tendency to withdraw, procrastinate, or numb out when overwhelmed' },
    'Reactivity': { category: 'shadow', icon: 'zap', color: 'red', description: 'Emotional impulsiveness or defensiveness in response to stress' },
    'Burnout': { category: 'shadow', icon: 'flame', color: 'orange', description: 'Energy depletion due to overcommitment or misaligned effort' },
    'Disconnection': { category: 'shadow', icon: 'ban', color: 'gray', description: 'Feeling emotionally cut off from yourself or others' },
    
    // SPIRIT
    'Alignment': { category: 'spirit', icon: 'compass', color: 'violet', description: 'Living in accordance with personal values and truth' },
    'Stillness': { category: 'spirit', icon: 'moon', color: 'blue', description: 'Capacity for presence, meditation, and quiet awareness' },
    'Faith': { category: 'spirit', icon: 'infinity', color: 'cyan', description: 'Trust in process, purpose, or something greater than oneself' },
    'Meaning': { category: 'spirit', icon: 'lightbulb', color: 'yellow', description: 'Clarity about your "why," purpose, or role in life\'s story' },
    
    // LEGACY
    'Mentorship': { category: 'legacy', icon: 'users', color: 'green', description: 'Efforts to guide, teach, or support others (especially children)' },
    'Stewardship': { category: 'legacy', icon: 'tree-deciduous', color: 'emerald', description: 'Care for your environment, projects, or community over time' },
    'Creatorship': { category: 'legacy', icon: 'hammer', color: 'purple', description: 'Building things that outlive you (music, code, systems, rituals)' },
    'Lineage': { category: 'legacy', icon: 'archive', color: 'lime', description: 'Honoring ancestry, traditions, or shaping generational values' }
  };
  
  // Create ALL stats for the new user (not just from a template)
  for (const [statName, config] of Object.entries(statConfigs)) {
    try {
      await db.insert(stats).values({
        userId: userId,
        name: statName,
        description: config.description,
        icon: config.icon,
        color: config.color,
        category: config.category,
        enabled: true,
        xp: 0,
        level: 1
      });
    } catch (error) {
      console.error(`Failed to create default stat ${statName} for user ${userId}:`, error);
    }
  }
}

// Helper function to populate default focuses for new users
async function populateDefaultFocusesForUser(userId: string) {
  // Get the user's stats to find the IDs we need to reference
  const userStats = await db.query.stats.findMany({
    where: eq(stats.userId, userId)
  });
  
  // Create a map for easy stat ID lookup
  const statIdMap: Record<string, string> = {};
  userStats.forEach(stat => {
    statIdMap[stat.name] = stat.id;
  });    // Define default focus configurations
    const focusConfigs = [
      {
        name: 'Anchor',
        description: 'Begin the week grounded in movement and emotional clarity',
        icon: 'anchor',
        color: 'blue',
        dayOfWeek: 'Monday' as const,
        statName: 'Vitality',
        sampleActivities: ['Morning walk or run', 'Breathing exercises', 'Stretching routine', 'Cold shower']
      },
      {
        name: 'Creative Fire',
        description: 'Build or express something uniquely yours',
        icon: 'paintbrush',
        color: 'orange',
        dayOfWeek: 'Tuesday' as const,
        statName: 'Intellect',
        sampleActivities: ['Writing or journaling', 'Art or music creation', 'Problem-solving project', 'Learning new skill']
      },
      {
        name: 'Reset',
        description: 'Get into nature, unplug, breathe — let the nervous system soften',
        icon: 'wind',
        color: 'green',
        dayOfWeek: 'Wednesday' as const,
        statName: 'Stillness',
        sampleActivities: ['Nature walk', 'Meditation', 'Digital detox time', 'Gentle yoga']
      },
      {
        name: 'Bridge',
        description: 'Deepen a connection with someone you care about (or with yourself)',
        icon: 'handshake',
        color: 'purple',
        dayOfWeek: 'Thursday' as const,
        statName: 'Presence',
        sampleActivities: ['Quality time with loved ones', 'Deep conversation', 'Active listening practice', 'Self-reflection']
      },
      {
        name: 'Power',
        description: 'Channel energy into physical intensity and embodied release',
        icon: 'bolt',
        color: 'red',
        dayOfWeek: 'Friday' as const,
        statName: 'Strength',
        sampleActivities: ['Intense workout', 'Martial arts', 'Heavy lifting', 'Dance or movement']
      },
      {
        name: 'Forge',
        description: 'Fix, tinker, or build something real with your hands (and maybe your kids)',
        icon: 'hammer',
        color: 'amber',
        dayOfWeek: 'Saturday' as const,
        statName: 'Stewardship',
        sampleActivities: ['Home improvement', 'Crafting project', 'Gardening', 'Repair something broken']
      },
      {
        name: 'Mirror',
        description: 'Reflect, journal, visualize — prepare emotionally for what\'s next',
        icon: 'mirror',
        color: 'indigo',
        dayOfWeek: 'Sunday' as const,
        statName: 'Clarity',
        sampleActivities: ['Weekly review', 'Goal setting', 'Visualization', 'Journaling session']
      }
    ];

  // Create all default focuses for the new user
  for (const focusConfig of focusConfigs) {
    try {
      const statId = statIdMap[focusConfig.statName];
      
      await db.insert(focuses).values({
        userId: userId,
        name: focusConfig.name,
        description: focusConfig.description,
        icon: focusConfig.icon,
        color: focusConfig.color,
        dayOfWeek: focusConfig.dayOfWeek,
        statId: statId || null, // Use null if stat not found
        sampleActivities: focusConfig.sampleActivities
      });
    } catch (error) {
      console.error(`Failed to create default focus ${focusConfig.name} for user ${userId}:`, error);
    }
  }
}

// Register
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');
  
  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  
  if (existingUser) {
    return c.json({ error: 'User already exists' }, 400);
  }
  
  // Create user
  const hashedPassword = await hashPassword(password);
  const [newUser] = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    type: 'user',
    isFamily: false,
  }).returning();
  
  // Populate default stats for the new user
  try {
    await populateDefaultStatsForUser(newUser.id);
  } catch (error) {
    console.error('Failed to populate default stats for new user:', error);
    // Continue with registration even if stat population fails
  }
  
  // Populate default focuses for the new user
  try {
    await populateDefaultFocusesForUser(newUser.id);
  } catch (error) {
    console.error('Failed to populate default focuses for new user:', error);
    // Continue with registration even if focus population fails
  }
  
  // Generate JWT token
  const token = await generateToken(newUser.id);
  
  // Set cookie
  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  return c.json({ user: userWithoutPassword, token });
});

// Login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  
  if (!user || !user.password) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  // Verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  // Generate JWT token
  const token = await generateToken(user.id);
  
  // Set cookie
  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return c.json({ user: userWithoutPassword, token });
});

// Logout
auth.post('/logout', async (c) => {
  deleteCookie(c, 'session');
  return c.json({ message: 'Logged out successfully' });
});

// Get current user - protected route
auth.get('/me', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  // Get user with attributes
  const userWithAttributes = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: {
      attributes: true,
    },
  });
  
  if (!userWithAttributes) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const { password: _, ...userWithoutPassword } = userWithAttributes;
  return c.json({ user: userWithoutPassword });
});

// Add attribute to current user
auth.post('/me/attributes', jwtMiddleware, userMiddleware, zValidator('json', createAttributeSchema), async (c) => {
  const user = c.get('user') as User;
  const { key, value } = c.req.valid('json');
  
  const [attribute] = await db.insert(attributes).values({
    userId: user.id,
    key,
    value,
  }).returning();
  
  return c.json({ attribute });
});

export default auth;
