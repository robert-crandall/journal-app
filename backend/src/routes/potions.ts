import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { potions, createPotionSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';
import { analyzePotionEffectiveness, runWeeklyPotionAnalysis } from '../utils/potionAnalysis';

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
    endDate: endDate || new Date().toISOString().split('T')[0], // Default to today if not provided
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
      endDate: endDate || startDate, // Default to startDate if not provided
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

// Analyze a specific potion's effectiveness
potionsRouter.post('/:id/analyze', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const potionId = c.req.param('id');
  
  // Verify the potion belongs to the user
  const potion = await db.query.potions.findFirst({
    where: and(eq(potions.id, potionId), eq(potions.userId, user.id)),
  });
  
  if (!potion) {
    return c.json({ error: 'Potion not found' }, 404);
  }
  
  try {
    const analysis = await analyzePotionEffectiveness(potionId);
    
    // Store the analysis in the potion record
    await db.update(potions)
      .set({
        gptAnalysis: JSON.stringify(analysis),
        updatedAt: new Date(),
      })
      .where(eq(potions.id, potionId));
    
    return c.json({ analysis });
  } catch (error) {
    console.error('Failed to analyze potion:', error);
    return c.json({ error: 'Failed to analyze potion effectiveness' }, 500);
  }
});

// Get analysis for a specific potion
potionsRouter.get('/:id/analysis', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const potionId = c.req.param('id');
  
  const potion = await db.query.potions.findFirst({
    where: and(eq(potions.id, potionId), eq(potions.userId, user.id)),
  });
  
  if (!potion) {
    return c.json({ error: 'Potion not found' }, 404);
  }
  
  let analysis = null;
  if (potion.gptAnalysis) {
    try {
      analysis = JSON.parse(potion.gptAnalysis);
    } catch (error) {
      console.error('Error parsing stored analysis:', error);
    }
  }
  
  return c.json({ 
    potion: {
      id: potion.id,
      title: potion.title,
      hypothesis: potion.hypothesis,
      startDate: potion.startDate,
      endDate: potion.endDate,
      isActive: potion.isActive,
    },
    analysis 
  });
});

// Run weekly analysis for all user's active potions
potionsRouter.post('/analyze-all', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  
  try {
    const analyses = await runWeeklyPotionAnalysis(user.id);
    return c.json({ analyses });
  } catch (error) {
    console.error('Failed to run weekly analysis:', error);
    return c.json({ error: 'Failed to run weekly potion analysis' }, 500);
  }
});

export default potionsRouter;
