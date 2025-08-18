import { z } from 'zod';

// Validation schema for timeframe export options
export const timeframeExportOptionsSchema = z.object({
  includeDailyEntries: z.boolean().default(true),
  includeWeeklyAnalyses: z.boolean().default(true),
  includeMonthlyAnalyses: z.boolean().default(true),
  includeGoals: z.boolean().default(true),
  includePlans: z.boolean().default(true),
  includeQuests: z.boolean().default(true),
  includeExperiments: z.boolean().default(true),
});

// Validation schema for timeframe export request
export const timeframeExportRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  options: timeframeExportOptionsSchema,
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);