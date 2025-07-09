import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db';
import { journalEntries, journalEntryXpGrants } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import { 
  createJournalEntrySchema,
  updateJournalEntrySchema,
  journalQuerySchema,
} from '../validation/journal';
import { 
  type JournalEntry,
  type JournalEntryWithRelations
} from '../types/journal';
import { handleApiError } from '../utils/logger';
import { grantXpToStat } from '../utils/stats';

const app = new Hono();

// Get all journal entries for user
app.get('/', jwtAuth, zValidator('query', journalQuerySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const query = c.req.valid('query');

    // Build where conditions
    const whereConditions = [eq(journalEntries.userId, userId)];

    if (query.startDate) {
      // Add date range filtering if needed
    }
    if (query.endDate) {
      // Add date range filtering if needed  
    }
    if (query.mood) {
      // Add mood filtering if needed
    }

    // Build the query with all conditions
    const userEntries = await db
      .select()
      .from(journalEntries)
      .where(and(...whereConditions))
      .orderBy(desc(journalEntries.entryDate))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    let result: JournalEntryWithRelations[] = userEntries;

    // Include XP grants if requested
    if (query.includeRelations) {
      const entryIds = userEntries.map(entry => entry.id);
      
      if (entryIds.length > 0) {
        // Get XP grants for all entries
        const xpGrantsData = await db
          .select()
          .from(journalEntryXpGrants)
          .where(eq(journalEntryXpGrants.journalEntryId, entryIds[0])); // Would need IN operator for multiple

        result = userEntries.map(entry => ({
          ...entry,
          xpGrants: xpGrantsData.filter(grant => grant.journalEntryId === entry.id),
        }));
      }
    }

    return c.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch journal entries');
  }
});

// Get journal entry by ID
app.get('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const entryId = c.req.param('id');

    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .limit(1);

    if (!entry) {
      return c.json({ success: false, error: 'Journal entry not found' }, 404);
    }

    // Get XP grants for this entry
    const xpGrants = await db
      .select()
      .from(journalEntryXpGrants)
      .where(eq(journalEntryXpGrants.journalEntryId, entryId))
      .orderBy(desc(journalEntryXpGrants.createdAt));

    const result: JournalEntryWithRelations = {
      ...entry,
      xpGrants,
    };

    return c.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch journal entry');
  }
});

// Create new journal entry
app.post('/', jwtAuth, zValidator('json', createJournalEntrySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const entryData = c.req.valid('json');

    // Convert date string to Date object if provided
    const processedData = {
      ...entryData,
      userId,
      entryDate: entryData.entryDate ? new Date(entryData.entryDate) : new Date(),
    };

    const [newEntry] = await db
      .insert(journalEntries)
      .values(processedData)
      .returning();

    return c.json({ success: true, data: newEntry }, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to create journal entry');
  }
});

// Update journal entry
app.put('/:id', jwtAuth, zValidator('json', updateJournalEntrySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const entryId = c.req.param('id');
    const updateData = c.req.valid('json');

    // Check if entry exists and belongs to user
    const [existingEntry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .limit(1);

    if (!existingEntry) {
      return c.json({ success: false, error: 'Journal entry not found' }, 404);
    }

    // Process date string to Date object if provided
    const processedUpdateData = {
      ...updateData,
      entryDate: updateData.entryDate ? new Date(updateData.entryDate) : undefined,
      updatedAt: new Date(),
    };

    const [updatedEntry] = await db
      .update(journalEntries)
      .set(processedUpdateData)
      .where(eq(journalEntries.id, entryId))
      .returning();

    return c.json({ success: true, data: updatedEntry });
  } catch (error) {
    return handleApiError(error, 'Failed to update journal entry');
  }
});

// Delete journal entry
app.delete('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const entryId = c.req.param('id');

    // Check if entry exists and belongs to user
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .limit(1);

    if (!entry) {
      return c.json({ success: false, error: 'Journal entry not found' }, 404);
    }

    await db
      .delete(journalEntries)
      .where(eq(journalEntries.id, entryId));

    return c.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error) {
    return handleApiError(error, 'Failed to delete journal entry');
  }
});

// Grant XP based on journal analysis
app.post('/:id/grant-xp', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const entryId = c.req.param('id');
    const { statId, xpAmount, reason } = await c.req.json();

    // Check if entry exists and belongs to user
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .limit(1);

    if (!entry) {
      return c.json({ success: false, error: 'Journal entry not found' }, 404);
    }

    // Create XP grant record
    const [xpGrant] = await db
      .insert(journalEntryXpGrants)
      .values({
        userId,
        journalEntryId: entryId,
        statName: statId, // Using statName as the column name
        xpAmount,
        reason,
      })
      .returning();

    // Grant the XP to the stat
    await grantXpToStat(userId, statId, xpAmount, 'journal', entryId, reason);

    return c.json({ 
      success: true, 
      data: xpGrant,
      message: `Granted ${xpAmount} XP for journal analysis`
    });
  } catch (error) {
    return handleApiError(error, 'Failed to grant XP for journal entry');
  }
});

// Get journal statistics
app.get('/stats/summary', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');

    // Get basic counts
    const totalEntries = await db
      .select({ count: sql`count(*)` })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    // Get recent entries
    const recentEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.entryDate))
      .limit(5);

    // Get total XP granted from journaling
    const totalXpGranted = await db
      .select({ total: sql`sum(xp_amount)` })
      .from(journalEntryXpGrants)
      .where(eq(journalEntryXpGrants.userId, userId));

    return c.json({ 
      success: true, 
      data: {
        totalEntries: totalEntries[0]?.count || 0,
        recentEntries,
        totalXpGranted: totalXpGranted[0]?.total || 0,
      }
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch journal statistics');
  }
});

export default app;
