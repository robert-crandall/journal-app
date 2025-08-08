import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, gte, lte, desc, count, inArray } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { weeklyAnalyses, journals, goals } from '../db/schema';
import { photos } from '../db/schema/photos';
import {
  createWeeklyAnalysisSchema,
  updateWeeklyAnalysisSchema,
  listWeeklyAnalysesSchema,
  weeklyAnalysisIdSchema,
  generateWeeklyAnalysisSchema,
} from '../validation/weekly-analyses';
import { handleApiError } from '../utils/logger';
import { generateCombinedWeeklyAnalysis } from '../utils/gpt/combinedWeeklyAnalysis';
import { calculateWeeklyMetrics } from '../services/weeklyAnalysisService';
import type {
  CreateWeeklyAnalysisRequest,
  UpdateWeeklyAnalysisRequest,
  ListWeeklyAnalysesRequest,
  GenerateWeeklyAnalysisRequest,
  WeeklyAnalysisResponse,
  ListWeeklyAnalysesResponse,
} from '../../../shared/types/weekly-analyses';

/**
 * Helper function to serialize weekly analysis to response format
 */
const serializeWeeklyAnalysis = (analysis: typeof weeklyAnalyses.$inferSelect): WeeklyAnalysisResponse => {
  return {
    id: analysis.id,
    userId: analysis.userId,
    analysisType: analysis.analysisType as any, // Cast from DB type
    periodStartDate: analysis.periodStartDate,
    periodEndDate: analysis.periodEndDate,
    journalSummary: analysis.journalSummary,
    journalTags: analysis.journalTags || [],
    totalXpGained: analysis.totalXpGained,
    tasksCompleted: analysis.tasksCompleted,
    avgDayRating: analysis.avgDayRating,
    xpByStats: analysis.xpByStats || [],
    toneFrequency: analysis.toneFrequency || [],
    contentTagFrequency: analysis.contentTagFrequency || [],
    alignmentScore: analysis.alignmentScore,
    alignedGoals: analysis.alignedGoals || [],
    neglectedGoals: analysis.neglectedGoals || [],
    suggestedNextSteps: analysis.suggestedNextSteps || [],
    goalAlignmentSummary: analysis.goalAlignmentSummary,
    combinedReflection: analysis.combinedReflection || undefined,
    photos: [], // Will be populated by caller if needed
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.updatedAt.toISOString(),
  };
};

/**
 * Helper function to serialize weekly analysis with photos
 */
const serializeWeeklyAnalysisWithPhotos = (
  analysis: typeof weeklyAnalyses.$inferSelect,
  analysisPhotos: Array<{
    id: string;
    journalId: string | null;
    journalDate: string | null;
    filePath: string;
    thumbnailPath: string;
    originalFilename: string;
    caption: string | null;
    createdAt: Date;
  }>,
): WeeklyAnalysisResponse => {
  return {
    id: analysis.id,
    userId: analysis.userId,
    analysisType: analysis.analysisType as any, // Cast from DB type
    periodStartDate: analysis.periodStartDate,
    periodEndDate: analysis.periodEndDate,
    journalSummary: analysis.journalSummary,
    journalTags: analysis.journalTags || [],
    totalXpGained: analysis.totalXpGained,
    tasksCompleted: analysis.tasksCompleted,
    avgDayRating: analysis.avgDayRating,
    xpByStats: analysis.xpByStats || [],
    toneFrequency: analysis.toneFrequency || [],
    contentTagFrequency: analysis.contentTagFrequency || [],
    alignmentScore: analysis.alignmentScore,
    alignedGoals: analysis.alignedGoals || [],
    neglectedGoals: analysis.neglectedGoals || [],
    suggestedNextSteps: analysis.suggestedNextSteps || [],
    goalAlignmentSummary: analysis.goalAlignmentSummary,
    combinedReflection: analysis.combinedReflection || undefined,
    photos: analysisPhotos
      .filter((photo) => photo.journalId && photo.journalDate) // Filter out invalid photos
      .map((photo) => ({
        id: photo.id,
        journalId: photo.journalId!,
        journalDate: photo.journalDate!,
        filePath: photo.filePath,
        thumbnailPath: photo.thumbnailPath,
        originalFilename: photo.originalFilename,
        caption: photo.caption,
        createdAt: photo.createdAt.toISOString(),
      })),
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.updatedAt.toISOString(),
  };
};

// Chain methods for RPC compatibility
const app = new Hono()
  // Get user's weekly analyses with filtering
  .get('/', jwtAuth, zValidator('query', listWeeklyAnalysesSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const filters = c.req.valid('query') as ListWeeklyAnalysesRequest;

      // Build where conditions
      const conditions = [eq(weeklyAnalyses.userId, userId)];

      if (filters.year) {
        // Filter by year in periodStartDate
        const yearStart = `${filters.year}-01-01`;
        const yearEnd = `${filters.year}-12-31`;
        conditions.push(gte(weeklyAnalyses.periodStartDate, yearStart));
        conditions.push(lte(weeklyAnalyses.periodStartDate, yearEnd));
      }

      if (filters.analysisType) {
        conditions.push(eq(weeklyAnalyses.analysisType, filters.analysisType));
      }

      // Get total count
      const [{ totalCount }] = await db
        .select({ totalCount: count() })
        .from(weeklyAnalyses)
        .where(and(...conditions));

      // Get analyses with pagination
      const analyses = await db
        .select()
        .from(weeklyAnalyses)
        .where(and(...conditions))
        .orderBy(desc(weeklyAnalyses.periodStartDate))
        .limit(filters.limit || 20)
        .offset(filters.offset || 0);

      const hasMore = (filters.offset || 0) + (filters.limit || 20) < totalCount;

      const response: ListWeeklyAnalysesResponse = {
        analyses: analyses.map(serializeWeeklyAnalysis),
        total: totalCount,
        hasMore,
      };

      return c.json({
        success: true,
        data: response,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to list weekly analyses');
    }
  })

  // Get specific weekly analysis by ID
  .get('/:id', jwtAuth, zValidator('param', weeklyAnalysisIdSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');

      const analysis = await db
        .select()
        .from(weeklyAnalyses)
        .where(and(eq(weeklyAnalyses.id, id), eq(weeklyAnalyses.userId, userId)))
        .limit(1);

      if (analysis.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Weekly analysis not found',
          },
          404,
        );
      }

      // Get photos for journal entries in this analysis period
      const analysisData = analysis[0];
      const photosInPeriod = await db
        .select({
          id: photos.id,
          journalId: photos.journalId,
          journalDate: journals.date,
          filePath: photos.filePath,
          thumbnailPath: photos.thumbnailPath,
          originalFilename: photos.originalFilename,
          caption: photos.caption,
          createdAt: photos.createdAt,
        })
        .from(photos)
        .leftJoin(journals, eq(photos.journalId, journals.id))
        .where(
          and(
            eq(photos.userId, userId),
            eq(photos.linkedType, 'journal'),
            gte(journals.date, analysisData.periodStartDate),
            lte(journals.date, analysisData.periodEndDate),
          ),
        )
        .orderBy(photos.createdAt);

      return c.json({
        success: true,
        data: serializeWeeklyAnalysisWithPhotos(analysisData, photosInPeriod),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to get weekly analysis');
    }
  })

  // Create a new weekly analysis (manual creation)
  .post('/', jwtAuth, zValidator('json', createWeeklyAnalysisSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as CreateWeeklyAnalysisRequest;

      // Check if analysis already exists for this date range
      const existingAnalysis = await db
        .select()
        .from(weeklyAnalyses)
        .where(
          and(
            eq(weeklyAnalyses.userId, userId),
            eq(weeklyAnalyses.periodStartDate, data.periodStartDate),
            eq(weeklyAnalyses.periodEndDate, data.periodEndDate),
          ),
        )
        .limit(1);

      if (existingAnalysis.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Weekly analysis for this period already exists. Use PUT to update it.',
          },
          409,
        );
      }

      const newAnalysis = await db
        .insert(weeklyAnalyses)
        .values({
          userId,
          analysisType: data.analysisType || 'weekly',
          periodStartDate: data.periodStartDate,
          periodEndDate: data.periodEndDate,
          journalSummary: data.journalSummary,
          journalTags: data.journalTags || [],
          totalXpGained: data.totalXpGained || 0,
          tasksCompleted: data.tasksCompleted || 0,
          avgDayRating: data.avgDayRating || null,
          xpByStats: data.xpByStats || [],
          toneFrequency: data.toneFrequency || [],
          contentTagFrequency: data.contentTagFrequency || [],
          alignmentScore: data.alignmentScore || null,
          alignedGoals: data.alignedGoals || [],
          neglectedGoals: data.neglectedGoals || [],
          suggestedNextSteps: data.suggestedNextSteps || [],
          goalAlignmentSummary: data.goalAlignmentSummary,
          combinedReflection: data.combinedReflection,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeWeeklyAnalysis(newAnalysis[0]),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to create weekly analysis');
    }
  })

  // Generate a weekly analysis using GPT
  .post('/generate', jwtAuth, zValidator('json', generateWeeklyAnalysisSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const data = c.req.valid('json') as GenerateWeeklyAnalysisRequest;

      // Check if analysis already exists for this date range
      const existingAnalysis = await db
        .select()
        .from(weeklyAnalyses)
        .where(and(eq(weeklyAnalyses.userId, userId), eq(weeklyAnalyses.periodStartDate, data.startDate), eq(weeklyAnalyses.periodEndDate, data.endDate)))
        .limit(1);

      if (existingAnalysis.length > 0) {
        return c.json(
          {
            success: false,
            error: 'Weekly analysis for this period already exists. Use PUT to update it.',
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

      // Get photos for all journal entries in this period
      const journalIds = journalsInPeriod.map((j) => j.id);
      const photosInPeriod =
        journalIds.length > 0
          ? await db
              .select({
                id: photos.id,
                journalId: photos.journalId,
                journalDate: journals.date,
                filePath: photos.filePath,
                thumbnailPath: photos.thumbnailPath,
                originalFilename: photos.originalFilename,
                caption: photos.caption,
                createdAt: photos.createdAt,
              })
              .from(photos)
              .leftJoin(journals, eq(photos.journalId, journals.id))
              .where(and(eq(photos.userId, userId), eq(photos.linkedType, 'journal'), inArray(photos.journalId, journalIds)))
              .orderBy(photos.createdAt)
          : [];

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

      // Calculate weekly metrics
      const metrics = await calculateWeeklyMetrics({
        userId,
        startDate: data.startDate,
        endDate: data.endDate,
      });

      // Generate combined weekly analysis using GPT
      const { journalSummary, journalTags, alignmentScore, alignedGoals, neglectedGoals, suggestedNextSteps, goalAlignmentSummary, combinedReflection } =
        await generateCombinedWeeklyAnalysis(journalsInPeriod, userGoals, metrics, data.startDate, data.endDate, userId);

      // Create the analysis record
      const newAnalysis = await db
        .insert(weeklyAnalyses)
        .values({
          userId,
          analysisType: data.analysisType || 'weekly',
          periodStartDate: data.startDate,
          periodEndDate: data.endDate,
          journalSummary,
          journalTags,
          totalXpGained: metrics.totalXpGained,
          tasksCompleted: metrics.tasksCompleted,
          avgDayRating: metrics.avgDayRating,
          xpByStats: metrics.xpByStats,
          toneFrequency: metrics.toneFrequency,
          contentTagFrequency: metrics.contentTagFrequency,
          alignmentScore,
          alignedGoals,
          neglectedGoals,
          suggestedNextSteps,
          goalAlignmentSummary,
          combinedReflection,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: serializeWeeklyAnalysisWithPhotos(newAnalysis[0], photosInPeriod),
        },
        201,
      );
    } catch (error) {
      return handleApiError(error, 'Failed to generate weekly analysis');
    }
  })

  // Update an existing weekly analysis
  .put('/:id', jwtAuth, zValidator('param', weeklyAnalysisIdSchema), zValidator('json', updateWeeklyAnalysisSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');
      const data = c.req.valid('json') as UpdateWeeklyAnalysisRequest;

      // Check if analysis exists and belongs to the user
      const existingAnalysis = await db
        .select()
        .from(weeklyAnalyses)
        .where(and(eq(weeklyAnalyses.id, id), eq(weeklyAnalyses.userId, userId)))
        .limit(1);

      if (existingAnalysis.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Weekly analysis not found',
          },
          404,
        );
      }

      // Update the analysis
      const updatedAnalysis = await db
        .update(weeklyAnalyses)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(weeklyAnalyses.id, id))
        .returning();

      return c.json({
        success: true,
        data: serializeWeeklyAnalysis(updatedAnalysis[0]),
      });
    } catch (error) {
      return handleApiError(error, 'Failed to update weekly analysis');
    }
  })

  // Delete a weekly analysis
  .delete('/:id', jwtAuth, zValidator('param', weeklyAnalysisIdSchema), async (c) => {
    try {
      const userId = getUserId(c);
      const { id } = c.req.valid('param');

      // Check if analysis exists and belongs to the user
      const existingAnalysis = await db
        .select()
        .from(weeklyAnalyses)
        .where(and(eq(weeklyAnalyses.id, id), eq(weeklyAnalyses.userId, userId)))
        .limit(1);

      if (existingAnalysis.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Weekly analysis not found',
          },
          404,
        );
      }

      // Delete the analysis
      await db.delete(weeklyAnalyses).where(eq(weeklyAnalyses.id, id));

      return c.json({
        success: true,
        message: 'Weekly analysis deleted successfully',
      });
    } catch (error) {
      return handleApiError(error, 'Failed to delete weekly analysis');
    }
  });

export default app;
