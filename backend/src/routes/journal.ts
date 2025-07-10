import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { jwtAuth, getUserId } from '../middleware/auth';
import { createJournalSchema, updateJournalSchema, finalizeJournalSchema } from '../validation/journals';
import { journals, journalContentTags, journalToneTags, journalStatTags } from '../db/schema/journals';
import { characterStats } from '../db/schema/stats';
import { handleApiError } from '../utils/logger';
import { analyzeJournalEntry, JournalAnalysisRequest } from '../utils/gpt';

// Helper to get journal with tags
async function getJournalWithTags(journalId: string) {
  // Get journal
  const journalResults = await db.select().from(journals).where(eq(journals.id, journalId)).limit(1);
  if (journalResults.length === 0) {
    return null;
  }
  const journal = journalResults[0];

  // Get content tags
  const contentTagsResults = await db
    .select({ tag: journalContentTags.tag })
    .from(journalContentTags)
    .where(eq(journalContentTags.journalId, journalId));
  const contentTags = contentTagsResults.map((t) => t.tag);

  // Get tone tags
  const toneTagsResults = await db
    .select({ tag: journalToneTags.tag })
    .from(journalToneTags)
    .where(eq(journalToneTags.journalId, journalId));
  const toneTags = toneTagsResults.map((t) => t.tag);

  // Get stat tags
  const statTagsResults = await db
    .select({ statId: journalStatTags.statId, xpAmount: journalStatTags.xpAmount })
    .from(journalStatTags)
    .where(eq(journalStatTags.journalId, journalId));
  const statTags = statTagsResults.map((t) => ({ statId: t.statId, xpAmount: t.xpAmount }));

  return {
    ...journal,
    contentTags,
    toneTags,
    statTags,
  };
}

// Chain methods for RPC compatibility
const app = new Hono()
  // Apply JWT auth middleware to all routes
  .use('*', jwtAuth)

  // Create a new journal entry
  .post('/', zValidator('json', createJournalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json');

      // Check if a journal for this date already exists
      const existingJournal = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.journalDate, data.journalDate)))
        .limit(1);

      if (existingJournal.length > 0) {
        return c.json(
          {
            success: false,
            error: 'A journal entry for this date already exists',
            journalId: existingJournal[0].id, // Return the existing journal ID
          },
          409,
        );
      }

      // Create the new journal
      const [newJournal] = await db
        .insert(journals)
        .values({
          userId,
          content: data.content,
          journalDate: data.journalDate,
          isFinalized: false,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: newJournal,
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create journal entry');
    }
  })

  // Get all journals for the authenticated user
  .get('/', async (c) => {
    try {
      const userId = getUserId(c);

      const journalList = await db
        .select()
        .from(journals)
        .where(eq(journals.userId, userId))
        .orderBy(desc(journals.journalDate));

      return c.json({
        success: true,
        data: journalList,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch journals');
    }
  })

  // Get journal by ID
  .get('/:id', async (c) => {
    try {
      const userId = getUserId(c);
      const journalId = c.req.param('id');

      const journalWithTags = await getJournalWithTags(journalId);
      if (!journalWithTags) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      // Verify ownership
      if (journalWithTags.userId !== userId) {
        return c.json(
          {
            success: false,
            error: 'Unauthorized access to journal',
          },
          403,
        );
      }

      return c.json({
        success: true,
        data: journalWithTags,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch journal');
    }
  })

  // Update journal by ID
  .put('/:id', zValidator('json', updateJournalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const journalId = c.req.param('id');
      const data = c.req.valid('json');

      // Check if journal exists and user owns it
      const existingJournals = await db
        .select()
        .from(journals)
        .where(eq(journals.id, journalId))
        .limit(1);

      if (existingJournals.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      const existingJournal = existingJournals[0];
      if (existingJournal.userId !== userId) {
        return c.json(
          {
            success: false,
            error: 'Unauthorized access to journal',
          },
          403,
        );
      }

      // Check if the journal is already finalized
      if (existingJournal.isFinalized) {
        return c.json(
          {
            success: false,
            error: 'Cannot update a finalized journal entry',
          },
          400,
        );
      }

      // Update the journal
      const [updatedJournal] = await db
        .update(journals)
        .set({
          ...(data.content && { content: data.content }),
          ...(data.journalDate && { journalDate: data.journalDate }),
          updatedAt: new Date(),
        })
        .where(eq(journals.id, journalId))
        .returning();

      return c.json({
        success: true,
        data: updatedJournal,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update journal');
    }
  })

  // Delete journal by ID
  .delete('/:id', async (c) => {
    try {
      const userId = getUserId(c);
      const journalId = c.req.param('id');

      // Check if journal exists and user owns it
      const existingJournals = await db
        .select()
        .from(journals)
        .where(eq(journals.id, journalId))
        .limit(1);

      if (existingJournals.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      const existingJournal = existingJournals[0];
      if (existingJournal.userId !== userId) {
        return c.json(
          {
            success: false,
            error: 'Unauthorized access to journal',
          },
          403,
        );
      }

      // Delete associated tags first
      await db.delete(journalContentTags).where(eq(journalContentTags.journalId, journalId));
      await db.delete(journalToneTags).where(eq(journalToneTags.journalId, journalId));
      await db.delete(journalStatTags).where(eq(journalStatTags.journalId, journalId));

      // Delete the journal
      await db.delete(journals).where(eq(journals.id, journalId));

      return c.json({
        success: true,
        message: 'Journal deleted successfully',
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete journal');
    }
  })

  // Get journal for specific date
  .get('/date/:date', async (c) => {
    try {
      const userId = getUserId(c);
      const date = c.req.param('date');

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return c.json(
          {
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD',
          },
          400,
        );
      }

      // Find journal by date
      const journalResults = await db
        .select()
        .from(journals)
        .where(and(eq(journals.userId, userId), eq(journals.journalDate, date)))
        .limit(1);

      if (journalResults.length === 0) {
        return c.json(
          {
            success: false,
            error: 'No journal found for the specified date',
          },
          404,
        );
      }

      const journal = journalResults[0];
      const journalWithTags = await getJournalWithTags(journal.id);

      return c.json({
        success: true,
        data: journalWithTags,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch journal by date');
    }
  })

  // Finalize and analyze a journal entry
  .post('/finalize', zValidator('json', finalizeJournalSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { id: journalId } = c.req.valid('json');

      // Check if journal exists and user owns it
      const journalResults = await db
        .select()
        .from(journals)
        .where(eq(journals.id, journalId))
        .limit(1);

      if (journalResults.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal not found',
          },
          404,
        );
      }

      const journal = journalResults[0];
      if (journal.userId !== userId) {
        return c.json(
          {
            success: false,
            error: 'Unauthorized access to journal',
          },
          403,
        );
      }

      // Check if the journal is already finalized
      if (journal.isFinalized) {
        return c.json(
          {
            success: false,
            error: 'Journal is already finalized',
          },
          400,
        );
      }

      // Get user's stats for analysis
      const userStats = await db.select().from(characterStats).where(eq(characterStats.userId, userId));

      // Prepare data for GPT analysis
      const availableStats = userStats.map((stat) => ({
        id: stat.id,
        name: stat.name,
        description: stat.description,
      }));

      // Call GPT to analyze the journal
      const gptRequest: JournalAnalysisRequest = {
        journalContent: journal.content,
        availableStats,
      };

      const gptResponse = await analyzeJournalEntry(gptRequest);

      // Start a transaction to update the journal and add tags
      // Add XP to stats based on the analysis
      await db.transaction(async (tx) => {
        // Update journal with analysis results
        const [updatedJournal] = await tx
          .update(journals)
          .set({
            title: gptResponse.title,
            summary: gptResponse.summary,
            synopsis: gptResponse.synopsis,
            isFinalized: true,
            analyzedAt: new Date(),
            gptRequest: gptRequest as any,
            gptResponse: gptResponse as any,
          })
          .where(eq(journals.id, journalId))
          .returning();

        // Add content tags
        if (gptResponse.contentTags && gptResponse.contentTags.length > 0) {
          await tx.insert(journalContentTags).values(
            gptResponse.contentTags.map((tag) => ({
              journalId,
              tag,
            })),
          );
        }

        // Add tone tags
        if (gptResponse.toneTags && gptResponse.toneTags.length > 0) {
          await tx.insert(journalToneTags).values(
            gptResponse.toneTags.map((tag) => ({
              journalId,
              tag,
            })),
          );
        }

        // Add stat tags and update stats with XP
        if (gptResponse.statTags && gptResponse.statTags.length > 0) {
          // Add stat tags
          await tx.insert(journalStatTags).values(
            gptResponse.statTags.map((statTag) => ({
              journalId,
              statId: statTag.statId,
              xpAmount: statTag.xp,
            })),
          );

          // Update stats with XP
          for (const statTag of gptResponse.statTags) {
            await tx
              .update(characterStats)
              .set({
                totalXp: sql`${characterStats.totalXp} + ${statTag.xp}`,
                updatedAt: new Date(),
              })
              .where(eq(characterStats.id, statTag.statId));
          }
        }
      });

      // Get the updated journal with all tags
      const finalizedJournal = await getJournalWithTags(journalId);

      return c.json({
        success: true,
        data: finalizedJournal,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to finalize journal');
    }
  })
  
  // Endpoint for analyzing journal entries (maintained for backward compatibility)
  .post('/analyze', zValidator('json', z.object({
    content: z.string().min(1, 'Journal content is required'),
  })), async (c) => {
    try {
      // Get the validated request body
      const { content } = c.req.valid('json');

      // Get the user ID from the context
      const userId = getUserId(c);

      // Get user's stats for analysis
      const userStats = await db.select().from(characterStats).where(eq(characterStats.userId, userId));

      // Prepare data for GPT analysis
      const availableStats = userStats.map((stat) => ({
        id: stat.id,
        name: stat.name,
        description: stat.description,
      }));
      
      const request: JournalAnalysisRequest = {
        journalContent: content,
        availableStats,
      };

      // Call the GPT-powered journal analysis
      const analysis = await analyzeJournalEntry(request);

      // Return the analysis results
      return c.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to analyze journal entry');
    }
  });

export default app;
