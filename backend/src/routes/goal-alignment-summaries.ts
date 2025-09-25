import { zodValidatorWithErrorHandler } from '../utils/validation';
import { Hono } from 'hono';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { goalAlignmentSummaries, journals, goals } from '../db/schema';
import {
  createGoalAlignmentSummarySchema,
  updateGoalAlignmentSummarySchema,
  listGoalAlignmentSummariesSchema,
  goalAlignmentSummaryIdSchema,
  generateGoalAlignmentSummarySchema,
} from '../validation/goal-alignment-summaries';
import { handleApiError } from '../utils/logger';
import { generateGoalAlignmentSummary } from '../utils/gpt/goalAlignmentSummary';
import type {
  CreateGoalAlignmentSummaryRequest,
  UpdateGoalAlignmentSummaryRequest,
  ListGoalAlignmentSummariesRequest,
  GenerateGoalAlignmentSummaryRequest,
  GoalAlignmentSummaryResponse,
  ListGoalAlignmentSummariesResponse,
} from '../../../shared/types/goal-alignment-summaries';

/**
 * Helper function to serialize goal alignment summary to response format
 */
const serializeGoalAlignmentSummary = (summary: typeof goalAlignmentSummaries.$inferSelect): GoalAlignmentSummaryResponse => {
  return {
    id: summary.id,
    userId: summary.userId,
    periodStartDate: summary.periodStartDate,
    periodEndDate: summary.periodEndDate,
    alignmentScore: summary.alignmentScore,
    alignedGoals: summary.alignedGoals || [],
    neglectedGoals: summary.neglectedGoals || [],
    suggestedNextSteps: summary.suggestedNextSteps || [],
    summary: summary.summary,
    totalPointsEarned: summary.totalPointsEarned,
    totalPossiblePoints: summary.totalPossiblePoints,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
  };
};

// Chain methods for RPC compatibility
const app = new Hono()
  // Get user's goal alignment summaries with filtering
  .get('/', jwtAuth, zodValidatorWithErrorHandler('query', listGoalAlignmentSummariesSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const filters = c.req.valid('query') as ListGoalAlignmentSummariesRequest;

      // Build where conditions
      const conditions = [eq(goalAlignmentSummaries.userId, userId)];

      if (filters.year) {
        // Filter by year in periodStartDate
        const yearStart = `${filters.year}-01-01`;
        const yearEnd = `${filters.year}-12-31`;
        conditions.push(gte(goalAlignmentSummaries.periodStartDate, yearStart));
        conditions.push(lte(goalAlignmentSummaries.periodStartDate, yearEnd));
      }

      // Get total count
      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(goalAlignmentSummaries)
        .where(and(...conditions));

      // Get summaries with pagination
      const summaries = await db
        .select()
        .from(goalAlignmentSummaries)
        .where(and(...conditions))
        .orderBy(desc(goalAlignmentSummaries.periodStartDate))
        .limit(filters.limit || 20)
        .offset(filters.offset || 0);

      const hasMore = (filters.offset || 0) + (filters.limit || 20) < totalCount;

      const response: ListGoalAlignmentSummariesResponse = {
        summaries: summaries.map(serializeGoalAlignmentSummary),
        total: totalCount,
        hasMore,
      };

      return c.json({
        success: true,
        data: response,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to list goal alignment summaries');
    }
  })

  // Get specific goal alignment summary by ID
  .get('/:id', jwtAuth, zodValidatorWithErrorHandler('param', goalAlignmentSummaryIdSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');

      const summary = await db
        .select()
        .from(goalAlignmentSummaries)
        .where(and(eq(goalAlignmentSummaries.id, id), eq(goalAlignmentSummaries.userId, userId)))
        .limit(1);

      if (summary.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Goal alignment summary not found',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: serializeGoalAlignmentSummary(summary[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch goal alignment summary');
    }
  })

  // Create a new goal alignment summary (manual creation)
  .post('/', jwtAuth, zodValidatorWithErrorHandler('json', createGoalAlignmentSummarySchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as CreateGoalAlignmentSummaryRequest;

      // Check if summary already exists for this date range
      const existingSummary = await db
        .select()
        .from(goalAlignmentSummaries)
        .where(
          and(
            eq(goalAlignmentSummaries.userId, userId),
            eq(goalAlignmentSummaries.periodStartDate, data.startDate),
            eq(goalAlignmentSummaries.periodEndDate, data.endDate),
          ),
        )
        .limit(1);

      if (existingSummary.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Goal alignment summary for this period already exists',
          },
          409,
        );
      }

      const newSummary = await db
        .insert(goalAlignmentSummaries)
        .values({
          userId,
          periodStartDate: data.startDate,
          periodEndDate: data.endDate,
          alignmentScore: data.alignmentScore || null,
          alignedGoals: data.alignedGoals || [],
          neglectedGoals: data.neglectedGoals || [],
          suggestedNextSteps: data.suggestedNextSteps || [],
          summary: data.summary,
          totalPointsEarned: data.totalPointsEarned || 0,
          totalPossiblePoints: data.totalPossiblePoints || 0,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeGoalAlignmentSummary(newSummary[0]),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create goal alignment summary');
    }
  })

  // Generate a goal alignment summary using GPT
  .post('/generate', jwtAuth, zodValidatorWithErrorHandler('json', generateGoalAlignmentSummarySchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as GenerateGoalAlignmentSummaryRequest;

      // Check if summary already exists for this date range
      const existingSummary = await db
        .select()
        .from(goalAlignmentSummaries)
        .where(
          and(
            eq(goalAlignmentSummaries.userId, userId),
            eq(goalAlignmentSummaries.periodStartDate, data.startDate),
            eq(goalAlignmentSummaries.periodEndDate, data.endDate),
          ),
        )
        .limit(1);

      if (existingSummary.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Goal alignment summary for this period already exists. Use PUT to update it.',
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

      // Get user's active goals
      const userGoals = await db
        .select()
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.isActive, true), eq(goals.isArchived, false)));

      if (userGoals.length === 0) {
        return c.json(
          {
            success: false,
            error: 'No active goals found for analysis',
          },
          400,
        );
      }

      // Generate goal alignment summary using GPT
      const { alignmentScore, alignedGoals, neglectedGoals, suggestedNextSteps, summary, totalPointsEarned, totalPossiblePoints } =
        await generateGoalAlignmentSummary(journalsInPeriod, userGoals, data.startDate, data.endDate, userId);

      // Create the summary record
      const newSummary = await db
        .insert(goalAlignmentSummaries)
        .values({
          userId,
          periodStartDate: data.startDate,
          periodEndDate: data.endDate,
          alignmentScore,
          alignedGoals,
          neglectedGoals,
          suggestedNextSteps,
          summary,
          totalPointsEarned,
          totalPossiblePoints,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeGoalAlignmentSummary(newSummary[0]),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to generate goal alignment summary');
    }
  })

  // Update an existing goal alignment summary
  .put(
    '/:id',
    jwtAuth,
    zodValidatorWithErrorHandler('param', goalAlignmentSummaryIdSchema as any),
    zodValidatorWithErrorHandler('json', updateGoalAlignmentSummarySchema as any),
    async (c) => {
      try {
        const userId = getUserId(c);
        const { id } = c.req.valid('param');
        const data = c.req.valid('json') as UpdateGoalAlignmentSummaryRequest;

        // Check if summary exists and belongs to the user
        const existingSummary = await db
          .select()
          .from(goalAlignmentSummaries)
          .where(and(eq(goalAlignmentSummaries.id, id), eq(goalAlignmentSummaries.userId, userId)))
          .limit(1);

        if (existingSummary.length === 0) {
          return c.json(
            {
              success: false,
              error: 'Goal alignment summary not found',
            },
            404,
          );
        }

        const updateData: any = {
          updatedAt: new Date(),
        };

        // Only update provided fields
        if (data.alignmentScore !== undefined) {
          updateData.alignmentScore = data.alignmentScore;
        }
        if (data.alignedGoals !== undefined) {
          updateData.alignedGoals = data.alignedGoals;
        }
        if (data.neglectedGoals !== undefined) {
          updateData.neglectedGoals = data.neglectedGoals;
        }
        if (data.suggestedNextSteps !== undefined) {
          updateData.suggestedNextSteps = data.suggestedNextSteps;
        }
        if (data.summary !== undefined) {
          updateData.summary = data.summary;
        }
        if (data.totalPointsEarned !== undefined) {
          updateData.totalPointsEarned = data.totalPointsEarned;
        }
        if (data.totalPossiblePoints !== undefined) {
          updateData.totalPossiblePoints = data.totalPossiblePoints;
        }

        const updatedSummary = await db
          .update(goalAlignmentSummaries)
          .set(updateData)
          .where(and(eq(goalAlignmentSummaries.id, id), eq(goalAlignmentSummaries.userId, userId)))
          .returning();

        return c.json({
          success: true,
          data: serializeGoalAlignmentSummary(updatedSummary[0]),
        });
      } catch (error) {
        return handleApiError(error, 'Failed to update goal alignment summary');
      }
    },
  )

  // Delete a goal alignment summary
  .delete('/:id', jwtAuth, zodValidatorWithErrorHandler('param', goalAlignmentSummaryIdSchema as any), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');

      // Get summary before deletion for response
      const summaryToDelete = await db
        .select()
        .from(goalAlignmentSummaries)
        .where(and(eq(goalAlignmentSummaries.id, id), eq(goalAlignmentSummaries.userId, userId)))
        .limit(1);

      if (summaryToDelete.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Goal alignment summary not found',
          },
          404,
        );
      }

      // Delete the summary
      await db.delete(goalAlignmentSummaries).where(and(eq(goalAlignmentSummaries.id, id), eq(goalAlignmentSummaries.userId, userId)));

      return c.json({
        success: true,
        data: serializeGoalAlignmentSummary(summaryToDelete[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete goal alignment summary');
    }
  });

export default app;
