import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { family, attributes, createFamilyMemberSchema, createAttributeSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const familyRouter = new Hono<{ Variables: Variables }>();

// Get all family members
familyRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const familyMembers = await db.query.family.findMany({
    where: eq(family.userId, user.id),
  });
  
  return c.json({ familyMembers });
});

// Create family member
familyRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createFamilyMemberSchema), async (c) => {
  const user = c.get('user') as User;
  const { name, age, className, description } = c.req.valid('json');
  
  const [familyMember] = await db.insert(family).values({
    userId: user.id,
    name,
    age,
    className,
    description,
  }).returning();
  
  return c.json({ familyMember });
});

// Get specific family member
familyRouter.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  
  const familyMember = await db.query.family.findFirst({
    where: and(eq(family.id, familyMemberId), eq(family.userId, user.id)),
  });
  
  if (!familyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  // Get attributes for this family member
  const familyAttributes = await db.query.attributes.findMany({
    where: and(eq(attributes.entityType, 'family'), eq(attributes.entityId, familyMemberId)),
  });
  
  return c.json({ familyMember: { ...familyMember, attributes: familyAttributes } });
});

// Update family member
familyRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', createFamilyMemberSchema), async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  const { name, age, className, description } = c.req.valid('json');
  
  const [updatedFamilyMember] = await db.update(family)
    .set({ name, age, className, description, updatedAt: new Date() })
    .where(and(eq(family.id, familyMemberId), eq(family.userId, user.id)))
    .returning();
  
  if (!updatedFamilyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  return c.json({ familyMember: updatedFamilyMember });
});

// Delete family member
familyRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  
  const [deletedFamilyMember] = await db.delete(family)
    .where(and(eq(family.id, familyMemberId), eq(family.userId, user.id)))
    .returning();
  
  if (!deletedFamilyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  return c.json({ message: 'Family member deleted successfully' });
});

// Add attribute to family member
familyRouter.post('/:id/attributes', jwtMiddleware, userMiddleware, zValidator('json', createAttributeSchema), async (c) => {
  const user = c.get('user') as User;
  const familyMemberId = c.req.param('id');
  const { key, value } = c.req.valid('json');
  
  // Verify family member exists and belongs to user
  const familyMember = await db.query.family.findFirst({
    where: and(eq(family.id, familyMemberId), eq(family.userId, user.id)),
  });
  
  if (!familyMember) {
    return c.json({ error: 'Family member not found' }, 404);
  }
  
  const [attribute] = await db.insert(attributes).values({
    entityType: 'family',
    entityId: familyMemberId,
    key,
    value,
  }).returning();
  
  return c.json({ attribute });
});

export default familyRouter;
