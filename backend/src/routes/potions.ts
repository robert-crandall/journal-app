import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { potions, createPotionSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const potionsRouter = new Hono<{ Variables: Variables }>();

// Get all potions for user
potionsRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  
  const userPotions = await db.query.potions.findMany({
    where: eq(potions.userId, user.id),
    orderBy: [desc(potions.createdAt)],
  });
  
  return c.json({ potions: userPotions });
});

// Create potion
potionsRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createPotionSchema), async (c) => {
  const user = c.get('user') as User;
  const { title, hypothesis, startDate, endDate } = c.req.valid('json');
  
  const [potion] = await db.insert(potions).values({
    userId: user.id,
    title,
    hypothesis,
    startDate: startDate,
    endDate: endDate || null,
  }).returning();
  
  return c.json({ potion });
});

// Get specific potion
potionsRouter.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const potionId = c.req.param('id');
  
  const potion = await db.query.potions.findFirst({
    where: and(eq(potions.id, potionId), eq(potions.userId, user.id)),
  });
  
  if (!potion) {
    return c.json({ error: 'Potion not found' }, 404);
  }
  
  return c.json({ potion });
});

// Update potion
potionsRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', createPotionSchema), async (c) => {
  const user = c.get('user') as User;
  const potionId = c.req.param('id');
  const { title, hypothesis, startDate, endDate } = c.req.valid('json');
  
  const [updatedPotion] = await db.update(potions)
    .set({
      title,
      hypothesis,
      startDate: startDate,
      endDate: endDate || null,
      updatedAt: new Date(),
    })
    .where(and(eq(potions.id, potionId), eq(potions.userId, user.id)))
    .returning();
  
  if (!updatedPotion) {
    return c.json({ error: 'Potion not found' }, 404);
  }
  
  return c.json({ potion: updatedPotion });
});

// End potion (mark as inactive)
potionsRouter.post('/:id/end', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const potionId = c.req.param('id');
  
  const [endedPotion] = await db.update(potions)
    .set({
      isActive: false,
      endDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    })
    .where(and(eq(potions.id, potionId), eq(potions.userId, user.id)))
    .returning();
  
  if (!endedPotion) {
    return c.json({ error: 'Potion not found' }, 404);
  }
  
  return c.json({ potion: endedPotion });
});

// Delete potion
potionsRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const potionId = c.req.param('id');
  
  const [deletedPotion] = await db.delete(potions)
    .where(and(eq(potions.id, potionId), eq(potions.userId, user.id)))
    .returning();
  
  if (!deletedPotion) {
    return c.json({ error: 'Potion not found' }, 404);
  }
  
  return c.json({ message: 'Potion deleted successfully' });
});

export default potionsRouter;
