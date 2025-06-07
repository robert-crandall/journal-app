import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { users, attributes, createFamilyMemberSchema, createAttributeSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const family = new Hono<{ Variables: Variables }>();

// Get all family members
family.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const familyMembers = await db.query.users.findMany({
    where: and(eq(users.type, 'family')),
    with: {
      attributes: true,
    },
  });
  
  return c.json({ familyMembers });
});

// Create family member
family.post('/', jwtMiddleware, userMiddleware, zValidator('json', createFamilyMemberSchema), async (c) => {
  const user = c.get('user') as User;
  const { name, className, classDescription } = c.req.valid('json');
  
  const [familyMember] = await db.insert(users).values({
    name,
    className,
    classDescription,
    type: 'family',
    isFamily: true,
  }).returning();
  
  return c.json({ familyMember });
});

// Get specific family member
family.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  
  const familyMember = await db.query.users.findFirst({
    where: and(eq(users.id, familyMemberId), eq(users.type, 'family')),
    with: {
      attributes: true,
    },
  });
  
  if (!familyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  return c.json({ familyMember });
});

// Update family member
family.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', createFamilyMemberSchema), async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  const { name, className, classDescription } = c.req.valid('json');
  
  const [updatedFamilyMember] = await db.update(users)
    .set({ name, className, classDescription, updatedAt: new Date() })
    .where(and(eq(users.id, familyMemberId), eq(users.type, 'family')))
    .returning();
  
  if (!updatedFamilyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  return c.json({ familyMember: updatedFamilyMember });
});

// Delete family member
family.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  
  const [deletedFamilyMember] = await db.delete(users)
    .where(and(eq(users.id, familyMemberId), eq(users.type, 'family')))
    .returning();
  
  if (!deletedFamilyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  return c.json({ message: 'Family member deleted successfully' });
});

// Add attribute to family member
family.post('/:id/attributes', jwtMiddleware, userMiddleware, zValidator('json', createAttributeSchema), async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  const { key, value } = c.req.valid('json');
  
  // Verify family member exists
  const familyMember = await db.query.users.findFirst({
    where: and(eq(users.id, familyMemberId), eq(users.type, 'family')),
  });
  
  if (!familyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  const [attribute] = await db.insert(attributes).values({
    userId: familyMemberId,
    key,
    value,
  }).returning();
  
  return c.json({ attribute });
});

export default family;
