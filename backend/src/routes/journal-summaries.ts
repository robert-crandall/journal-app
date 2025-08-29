import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { journalSummaries, journals } from '../db/schema';
import {
  createJournalSummarySchema,
  updateJournalSummarySchema,
  listJournalSummariesSchema,
  journalSummaryIdSchema,
  generateJournalSummarySchema,
} from '../validation/journal-summaries';
import { handleApiError } from '../utils/logger';
import { generatePeriodSummary } from '../utils/gpt/periodSummary';
import type {
  CreateJournalSummaryRequest,
  UpdateJournalSummaryRequest,
  ListJournalSummariesRequest,
  GenerateJournalSummaryRequest,
  JournalSummaryResponse,
  ListJournalSummariesResponse,
} from '../../../shared/types/journal-summaries';

/**
 * Helper function to serialize journal summary to response format
 */
const serializeJournalSummary = (summary: typeof journalSummaries.$inferSelect): JournalSummaryResponse => {
  return {
    id: summary.id,
    userId: summary.userId,
    period: summary.period as 'week' | 'month',
    startDate: summary.startDate,
    endDate: summary.endDate,
    summary: summary.summary,
    tags: summary.tags as string[] | null,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
  };
};

// Chain methods for RPC compatibility
const app = new Hono()
  // Get user's journal summaries with filtering
  .get('/', jwtAuth, zValidator('query', listJournalSummariesSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const filters = c.req.valid('query') as ListJournalSummariesRequest;

      // Build where conditions
      const conditions = [eq(journalSummaries.userId, userId)];

      if (filters.period) {
        conditions.push(eq(journalSummaries.period, filters.period));
      }

      if (filters.year) {
        // Filter by year in startDate
        const yearStart = `${filters.year}-01-01`;
        const yearEnd = `${filters.year}-12-31`;
        conditions.push(gte(journalSummaries.startDate, yearStart));
        conditions.push(lte(journalSummaries.startDate, yearEnd));
      }

      // Get total count
      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(journalSummaries)
        .where(and(...conditions));

      // Get summaries with pagination
      const summaries = await db
        .select()
        .from(journalSummaries)
        .where(and(...conditions))
        .orderBy(desc(journalSummaries.startDate))
        .limit(filters.limit || 20)
        .offset(filters.offset || 0);

      const hasMore = (filters.offset || 0) + (filters.limit || 20) < totalCount;

      const response: ListJournalSummariesResponse = {
        summaries: summaries.map(serializeJournalSummary),
        total: totalCount,
        hasMore,
      };

      return c.json({
        success: true,
        data: response,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to list journal summaries');
    }
  })

  // Get specific journal summary by ID
  .get('/:id', jwtAuth, zValidator('param', journalSummaryIdSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');

      const summary = await db
        .select()
        .from(journalSummaries)
        .where(and(eq(journalSummaries.id, id), eq(journalSummaries.userId, userId)))
        .limit(1);

      if (summary.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal summary not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: serializeJournalSummary(summary[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch journal summary');
    }
  })

  // Create a new journal summary (manual creation)
  .post('/', jwtAuth, zValidator('json', createJournalSummarySchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as CreateJournalSummaryRequest;

      // Check if summary already exists for this period and date range
      const existingSummary = await db
        .select()
        .from(journalSummaries)
        .where(
          and(
            eq(journalSummaries.userId, userId),
            eq(journalSummaries.period, data.period),
            eq(journalSummaries.startDate, data.startDate),
            eq(journalSummaries.endDate, data.endDate),
          ),
        )
        .limit(1);

      if (existingSummary.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Journal summary for this period already exists',
          },
          409,
        );
      }

      const newSummary = await db
        .insert(journalSummaries)
        .values({
          userId,
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate,
          summary: data.summary,
          tags: data.tags || null,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeJournalSummary(newSummary[0]),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create journal summary');
    }
  })

  // Generate a journal summary using GPT
  .post('/generate', jwtAuth, zValidator('json', generateJournalSummarySchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as GenerateJournalSummaryRequest;

      // Check if summary already exists for this period and date range
      const existingSummary = await db
        .select()
        .from(journalSummaries)
        .where(
          and(
            eq(journalSummaries.userId, userId),
            eq(journalSummaries.period, data.period),
            eq(journalSummaries.startDate, data.startDate),
            eq(journalSummaries.endDate, data.endDate),
          ),
        )
        .limit(1);

      if (existingSummary.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Journal summary for this period already exists. Use PUT to update it.',
          },
          409,
        );
      }

      // Get journals in the date range
      const journalsInPeriod = await db
        .select()
        .from(journals)
        .where(
          and(
            eq(journals.userId, userId),
            gte(journals.date, data.startDate),
            lte(journals.date, data.endDate),
            eq(journals.status, 'complete'), // Only include completed journals
          ),
        )
        .orderBy(journals.date);

      if (journalsInPeriod.length === 0) {
        return c.json(
          {
            success: false,
            error: 'No completed journal entries found for this period',
          },
          400,
        );
      }

      // Generate summary using GPT
      const { summary, tags } = await generatePeriodSummary(journalsInPeriod, data.period, userId);

      // Create the summary record
      const newSummary = await db
        .insert(journalSummaries)
        .values({
          userId,
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate,
          summary,
          tags,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeJournalSummary(newSummary[0]),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to generate journal summary');
    }
  })

  // Update an existing journal summary
  .put('/:id', jwtAuth, zValidator('param', journalSummaryIdSchema as any), zValidator('json', updateJournalSummarySchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      const data = c.req.valid('json') as UpdateJournalSummaryRequest;

      // Check if summary exists and belongs to the user
      const existingSummary = await db
        .select()
        .from(journalSummaries)
        .where(and(eq(journalSummaries.id, id), eq(journalSummaries.userId, userId)))
        .limit(1);

      if (existingSummary.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal summary not found',
          },
          404,
        );
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only update provided fields
      if (data.summary !== undefined) {
        updateData.summary = data.summary;
      }
      if (data.tags !== undefined) {
        updateData.tags = data.tags;
      }

      const updatedSummary = await db
        .update(journalSummaries)
        .set(updateData)
        .where(and(eq(journalSummaries.id, id), eq(journalSummaries.userId, userId)))
        .returning();

      return c.json({
        success: true,
        data: serializeJournalSummary(updatedSummary[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update journal summary');
    }
  })

  // Delete a journal summary
  .delete('/:id', jwtAuth, zValidator('param', journalSummaryIdSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');

      // Get summary before deletion for response
      const summaryToDelete = await db
        .select()
        .from(journalSummaries)
        .where(and(eq(journalSummaries.id, id), eq(journalSummaries.userId, userId)))
        .limit(1);

      if (summaryToDelete.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Journal summary not found',
          },
          404,
        );
      }

      // Delete the summary
      await db.delete(journalSummaries).where(and(eq(journalSummaries.id, id), eq(journalSummaries.userId, userId)));

      return c.json({
        success: true,
        data: serializeJournalSummary(summaryToDelete[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete journal summary');
    }
  });

export default app;
