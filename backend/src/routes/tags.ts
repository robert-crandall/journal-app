import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { tags, tagAssociations, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const tagsRouter = new Hono<{ Variables: Variables }>();

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(50),
});

// Get all tags for user
tagsRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const userTags = await db.query.tags.findMany({
    where: eq(tags.userId, user.id),
    orderBy: [desc(tags.createdAt)],
    with: {
      associations: true,
    },
  });
  
  return c.json({ tags: userTags });
});

// Create a new tag
tagsRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createTagSchema), async (c) => {
  const user = c.get('user') as User;
  const { name } = c.req.valid('json');
  
  // Check if tag already exists for this user
  const existingTag = await db.query.tags.findFirst({
    where: and(eq(tags.userId, user.id), eq(tags.name, name.toLowerCase())),
  });
  
  if (existingTag) {
    return c.json({ error: 'Tag already exists' }, 400);
  }
  
  const [tag] = await db.insert(tags).values({
    userId: user.id,
    name: name.toLowerCase(),
  }).returning();
  
  return c.json({ tag });
});

// Update a tag
tagsRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', updateTagSchema), async (c) => {
  const user = c.get('user') as User;
  const tagId = c.req.param('id');
  const { name } = c.req.valid('json');
  
  // Check if another tag with this name already exists
  const existingTag = await db.query.tags.findFirst({
    where: and(
      eq(tags.userId, user.id), 
      eq(tags.name, name.toLowerCase()),
      // Not the current tag being updated
      // Note: Using ne() would be ideal but let's check differently
    ),
  });
  
  if (existingTag && existingTag.id !== tagId) {
    return c.json({ error: 'Tag name already exists' }, 400);
  }
  
  const [updatedTag] = await db.update(tags)
    .set({
      name: name.toLowerCase(),
      updatedAt: new Date(),
    })
    .where(and(eq(tags.id, tagId), eq(tags.userId, user.id)))
    .returning();
  
  if (!updatedTag) {
    return c.json({ error: 'Tag not found' }, 404);
  }
  
  return c.json({ tag: updatedTag });
});

// Delete a tag
tagsRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const tagId = c.req.param('id');
  
  // Delete tag associations first (cascade will handle this, but let's be explicit)
  await db.delete(tagAssociations)
    .where(eq(tagAssociations.tagId, tagId));
  
  const [deletedTag] = await db.delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, user.id)))
    .returning();
  
  if (!deletedTag) {
    return c.json({ error: 'Tag not found' }, 404);
  }
  
  return c.json({ message: 'Tag deleted successfully' });
});

// Get tags for a specific entity (journal or task)
tagsRouter.get('/entity/:entityType/:entityId', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const entityType = c.req.param('entityType');
  const entityId = c.req.param('entityId');
  
  if (!['journal', 'task'].includes(entityType)) {
    return c.json({ error: 'Invalid entity type' }, 400);
  }
  
  // Get tag associations for this entity
  const associations = await db.query.tagAssociations.findMany({
    where: and(
      eq(tagAssociations.entityType, entityType as 'journal' | 'task'),
      eq(tagAssociations.entityId, entityId)
    ),
    with: {
      tag: true,
    },
  });
  
  // Filter to only tags owned by this user
  const entityTags = associations
    .filter(assoc => assoc.tag.userId === user.id)
    .map(assoc => assoc.tag);
  
  return c.json({ tags: entityTags });
});

export default tagsRouter;