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

// Register
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name, className, classDescription } = c.req.valid('json');
  
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
    className,
    classDescription,
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
