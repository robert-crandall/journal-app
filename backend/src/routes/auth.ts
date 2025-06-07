import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { users, stats, loginSchema, registerSchema, type User } from '../db/schema';
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
    'Craft': { category: 'connection', emoji: '🔨', color: 'emerald', description: 'Practical skill-building: making, fixing, building — external proof of internal mastery' },
    
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
  
  // Create ALL stats for the new user (not just from a template)
  for (const [statName, config] of Object.entries(statConfigs)) {
    try {
      await db.insert(stats).values({
        userId: userId,
        name: statName,
        description: config.description,
        emoji: config.emoji,
        color: config.color,
        category: config.category,
        enabled: true,
        systemDefault: true,
        value: 0
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
  const { password: _, ...userWithoutPassword } = user;
  return c.json({ user: userWithoutPassword });
});

export default auth;
