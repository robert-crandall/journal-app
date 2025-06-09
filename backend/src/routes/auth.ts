import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { users, attributes, stats, loginSchema, registerSchema, createAttributeSchema, type User } from '../db/schema';
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
  
  // Create ALL stats for the new user (not just from a template)
  for (const [statName, config] of Object.entries(statConfigs)) {
    try {
      await db.insert(stats).values({
        userId: userId,
        name: statName,
        description: config.description,
        icon: config.icon,
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
  }).returning();
  
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
  });
  
  if (!userWithAttributes) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Get user attributes separately
  const userAttributes = await db.query.attributes.findMany({
    where: and(eq(attributes.entityType, 'user'), eq(attributes.entityId, user.id)),
  });
  
  const { password: _, ...userWithoutPassword } = userWithAttributes;
  return c.json({ user: { ...userWithoutPassword, attributes: userAttributes } });
});

// Add attribute to current user
auth.post('/me/attributes', jwtMiddleware, userMiddleware, zValidator('json', createAttributeSchema), async (c) => {
  const user = c.get('user') as User;
  const { key, value } = c.req.valid('json');
  
  const [attribute] = await db.insert(attributes).values({
    entityType: 'user',
    entityId: user.id,
    key,
    value,
  }).returning();
  
  return c.json({ attribute });
});

// Update user profile (including class fields)
auth.put('/me', jwtMiddleware, userMiddleware, zValidator('json', z.object({
  name: z.string().min(1).optional(),
  className: z.string().optional(),
  classDescription: z.string().optional(),
})), async (c) => {
  const user = c.get('user') as User;
  const updateData = c.req.valid('json');
  
  const [updatedUser] = await db.update(users)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  
  if (!updatedUser) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const { password: _, ...userWithoutPassword } = updatedUser;
  return c.json({ user: userWithoutPassword });
});

export default auth;
