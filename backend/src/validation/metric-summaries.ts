import { z } from 'zod';

export const generateMetricsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

export const listMetricSummariesSchema = z.object({
  type: z.enum(['journal', 'experiment']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  sortBy: z.enum(['totalXp', 'avgDayRating', 'daysLogged', 'tasksCompleted', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  minAvgDayRating: z.coerce.number().min(1).max(5).optional(),
  mostCommonTone: z.string().optional(),
  minTotalXp: z.coerce.number().min(0).optional(),
});

export const metricSummaryIdSchema = z.object({
  id: z.string().uuid('Invalid metric summary ID'),
});
