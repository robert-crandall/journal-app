import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { jwtAuth, getUserId } from '../middleware/auth';
import { db } from '../db';
import { metricSummaries } from '../db/schema/metric-summaries';
import { journalSummaries } from '../db/schema/journal-summaries';
import { experiments } from '../db/schema/experiments';
import { calculatePeriodMetrics } from '../services/metricsService';
import { generateMetricsSchema, listMetricSummariesSchema, metricSummaryIdSchema } from '../validation/metric-summaries';
import { handleApiError } from '../utils/logger';
import type {
  GenerateMetricsRequest,
  ListMetricSummariesRequest,
  ListMetricSummariesResponse,
  MetricSummaryResponse,
} from '../../../shared/types/metric-summaries';

const app = new Hono();

// Helper function to serialize metric summary for API response
function serializeMetricSummary(summary: typeof metricSummaries.$inferSelect): MetricSummaryResponse {
  return {
    id: summary.id,
    userId: summary.userId,
    type: summary.type as 'journal' | 'experiment' | 'custom',
    sourceId: summary.sourceId,
    startDate: summary.startDate,
    endDate: summary.endDate,
    totalXp: summary.totalXp,
    avgDayRating: summary.avgDayRating,
    daysLogged: summary.daysLogged,
    tasksCompleted: summary.tasksCompleted,
    averageTasksPerDay: summary.averageTasksPerDay,
    toneTagCounts: summary.toneTagCounts || {},
    mostCommonTone: summary.mostCommonTone,
    xpByStat: summary.xpByStat || {},
    logStreak: summary.logStreak,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
  };
}

// Generate and save metrics for a specific time period
app.post('/generate', jwtAuth, zValidator('json', generateMetricsSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { startDate, endDate } = c.req.valid('json') as GenerateMetricsRequest;

    const metrics = await calculatePeriodMetrics({
      userId,
      startDate,
      endDate,
    });

    // Save the metrics to database
    const [savedMetrics] = await db
      .insert(metricSummaries)
      .values({
        userId,
        type: 'custom',
        sourceId: null,
        startDate,
        endDate,
        totalXp: metrics.totalXp,
        avgDayRating: metrics.avgDayRating,
        daysLogged: metrics.daysLogged,
        tasksCompleted: metrics.tasksCompleted,
        averageTasksPerDay: metrics.averageTasksPerDay,
        toneTagCounts: metrics.toneTagCounts || {},
        mostCommonTone: metrics.mostCommonTone,
        xpByStat: metrics.xpByStat || {},
        logStreak: metrics.logStreak,
      })
      .returning();

    if (!savedMetrics) {
      return c.json({ success: false, error: 'Failed to save metrics' }, 500);
    }

    return c.json({
      success: true,
      data: serializeMetricSummary(savedMetrics),
    });
  } catch (error) {
    return handleApiError(error, 'Failed to generate metrics');
  }
});

// Auto-generate and save metrics for a journal summary
app.post('/journal-summary/:sourceId', jwtAuth, async (c) => {
  try {
    const userId = getUserId(c);
    const sourceId = c.req.param('sourceId');

    // Verify the journal summary exists and belongs to the user
    const [journalSummary] = await db
      .select()
      .from(journalSummaries)
      .where(and(eq(journalSummaries.id, sourceId), eq(journalSummaries.userId, userId)));

    if (!journalSummary) {
      return c.json({ success: false, error: 'Journal summary not found' }, 404);
    }

    // Check if metrics already exist for this journal summary
    const existingMetrics = await db
      .select()
      .from(metricSummaries)
      .where(and(eq(metricSummaries.sourceId, sourceId), eq(metricSummaries.type, 'journal')));

    if (existingMetrics.length > 0) {
      return c.json({ success: false, error: 'Metrics already exist for this journal summary' }, 400);
    }

    // Calculate metrics for the journal summary period
    const metrics = await calculatePeriodMetrics({
      userId,
      startDate: journalSummary.startDate,
      endDate: journalSummary.endDate,
    });

    // Save the metrics
    const [savedMetrics] = await db
      .insert(metricSummaries)
      .values({
        userId,
        type: 'journal',
        sourceId,
        startDate: journalSummary.startDate,
        endDate: journalSummary.endDate,
        totalXp: metrics.totalXp,
        avgDayRating: metrics.avgDayRating,
        daysLogged: metrics.daysLogged,
        tasksCompleted: metrics.tasksCompleted,
        averageTasksPerDay: metrics.averageTasksPerDay,
        toneTagCounts: metrics.toneTagCounts,
        mostCommonTone: metrics.mostCommonTone,
        xpByStat: metrics.xpByStat,
        logStreak: metrics.logStreak,
      })
      .returning();

    return c.json(
      {
        success: true,
        data: serializeMetricSummary(savedMetrics),
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, 'Failed to generate journal summary metrics');
  }
});

// Auto-generate and save metrics for an experiment
app.post('/experiment/:sourceId', jwtAuth, async (c) => {
  try {
    const userId = getUserId(c);
    const sourceId = c.req.param('sourceId');

    // Verify the experiment exists and belongs to the user
    const [experiment] = await db
      .select()
      .from(experiments)
      .where(and(eq(experiments.id, sourceId), eq(experiments.userId, userId)));

    if (!experiment) {
      return c.json({ success: false, error: 'Experiment not found' }, 404);
    }

    // Check if metrics already exist for this experiment
    const existingMetrics = await db
      .select()
      .from(metricSummaries)
      .where(and(eq(metricSummaries.sourceId, sourceId), eq(metricSummaries.type, 'experiment')));

    if (existingMetrics.length > 0) {
      return c.json({ success: false, error: 'Metrics already exist for this experiment' }, 400);
    }

    // Calculate metrics for the experiment period
    const metrics = await calculatePeriodMetrics({
      userId,
      startDate: experiment.startDate, // startDate and endDate are already strings in YYYY-MM-DD format
      endDate: experiment.endDate,
    });

    // Save the metrics
    const [savedMetrics] = await db
      .insert(metricSummaries)
      .values({
        userId,
        type: 'experiment',
        sourceId,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        totalXp: metrics.totalXp,
        avgDayRating: metrics.avgDayRating,
        daysLogged: metrics.daysLogged,
        tasksCompleted: metrics.tasksCompleted,
        averageTasksPerDay: metrics.averageTasksPerDay,
        toneTagCounts: metrics.toneTagCounts,
        mostCommonTone: metrics.mostCommonTone,
        xpByStat: metrics.xpByStat,
        logStreak: metrics.logStreak,
      })
      .returning();

    return c.json(
      {
        success: true,
        data: serializeMetricSummary(savedMetrics),
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, 'Failed to generate experiment metrics');
  }
});

// List all metric summaries with filtering and sorting
app.get('/', jwtAuth, zValidator('query', listMetricSummariesSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const {
      type,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minAvgDayRating,
      mostCommonTone,
      minTotalXp,
    } = c.req.valid('query') as ListMetricSummariesRequest;

    // Build filters
    const filters = [eq(metricSummaries.userId, userId)];

    if (type) {
      filters.push(eq(metricSummaries.type, type));
    }

    if (minAvgDayRating !== undefined) {
      filters.push(gte(metricSummaries.avgDayRating, minAvgDayRating));
    }

    if (mostCommonTone) {
      filters.push(eq(metricSummaries.mostCommonTone, mostCommonTone));
    }

    if (minTotalXp !== undefined) {
      filters.push(gte(metricSummaries.totalXp, minTotalXp));
    }

    // Determine sort column
    let sortColumn;
    switch (sortBy) {
      case 'totalXp':
        sortColumn = metricSummaries.totalXp;
        break;
      case 'avgDayRating':
        sortColumn = metricSummaries.avgDayRating;
        break;
      case 'daysLogged':
        sortColumn = metricSummaries.daysLogged;
        break;
      case 'tasksCompleted':
        sortColumn = metricSummaries.tasksCompleted;
        break;
      default:
        sortColumn = metricSummaries.createdAt;
    }

    // Apply sorting
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Build and execute query
    const summaries = await db
      .select()
      .from(metricSummaries)
      .where(and(...filters))
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(metricSummaries)
      .where(and(...filters));

    const response: ListMetricSummariesResponse = {
      summaries: summaries.map(serializeMetricSummary),
      total,
      limit,
      offset,
    };

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to list metric summaries');
  }
});

// Get a specific metric summary by ID
app.get('/:id', jwtAuth, zValidator('param', metricSummaryIdSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { id } = c.req.valid('param');

    const [summary] = await db
      .select()
      .from(metricSummaries)
      .where(and(eq(metricSummaries.id, id), eq(metricSummaries.userId, userId)));

    if (!summary) {
      return c.json({ success: false, error: 'Metric summary not found' }, 404);
    }

    return c.json({
      success: true,
      data: serializeMetricSummary(summary),
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get metric summary');
  }
});

// Delete a metric summary
app.delete('/:id', jwtAuth, zValidator('param', metricSummaryIdSchema), async (c) => {
  try {
    const userId = getUserId(c);
    const { id } = c.req.valid('param');

    const [deletedSummary] = await db
      .delete(metricSummaries)
      .where(and(eq(metricSummaries.id, id), eq(metricSummaries.userId, userId)))
      .returning();

    if (!deletedSummary) {
      return c.json({ success: false, error: 'Metric summary not found' }, 404);
    }

    return c.json({
      success: true,
      data: { message: 'Metric summary deleted successfully' },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to delete metric summary');
  }
});

export default app;
