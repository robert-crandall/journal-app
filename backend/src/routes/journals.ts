import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and } from 'drizzle-orm';
import type { JwtVariables } from 'hono/jwt';
import { db } from '../db';
import { journals, createJournalSchema, type User } from '../db/schema';
import { jwtMiddleware, userMiddleware } from '../middleware/auth';

// Define the variables type for this route
type Variables = JwtVariables & {
  user: User;
};

const journalsRouter = new Hono<{ Variables: Variables }>();

// Get all journals for user
journalsRouter.get('/', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user');
  
  const userJournals = await db.query.journals.findMany({
    where: eq(journals.userId, user.id),
    orderBy: [desc(journals.date)],
  });
  
  return c.json({ journals: userJournals });
});

// Create journal entry
journalsRouter.post('/', jwtMiddleware, userMiddleware, zValidator('json', createJournalSchema), async (c) => {
  const user = c.get('user') as User;
  const { content, date } = c.req.valid('json');
  
  const [journal] = await db.insert(journals).values({
    userId: user.id,
    content,
    date: date || new Date().toISOString().split('T')[0],
  }).returning();
  
  return c.json({ journal });
});

// Get specific journal
journalsRouter.get('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  
  const journal = await db.query.journals.findFirst({
    where: and(eq(journals.id, journalId), eq(journals.userId, user.id)),
  });
  
  if (!journal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  return c.json({ journal });
});

// Update journal
journalsRouter.put('/:id', jwtMiddleware, userMiddleware, zValidator('json', createJournalSchema), async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  const { content, date } = c.req.valid('json');
  
  const [updatedJournal] = await db.update(journals)
    .set({
      content,
      date: date ? new Date(date) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(journals.id, journalId), eq(journals.userId, user.id)))
    .returning();
  
  if (!updatedJournal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  return c.json({ journal: updatedJournal });
});

// Delete journal
journalsRouter.delete('/:id', jwtMiddleware, userMiddleware, async (c) => {
  const user = c.get('user') as User;
  const journalId = c.req.param('id');
  
  const [deletedJournal] = await db.delete(journals)
    .where(and(eq(journals.id, journalId), eq(journals.userId, user.id)))
    .returning();
  
  if (!deletedJournal) {
    return c.json({ error: 'Journal not found' }, 404);
  }
  
  return c.json({ message: 'Journal deleted successfully' });
});

export default journalsRouter;
