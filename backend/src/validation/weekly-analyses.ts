import { z } from 'zod';

// Weekly analysis validation schemas

const analysisTypeSchema = z.enum(['weekly', 'monthly', 'quarterly']);

const xpByStatsSchema = z.array(
  z.object({
    statId: z.string().uuid('Invalid stat ID'),
    statName: z.string().min(1, 'Stat name is required'),
    xpGained: z.number().int().min(0, 'XP gained must be non-negative'),
  }),
);

const toneFrequencySchema = z.array(
  z.object({
    tone: z.string().min(1, 'Tone is required'),
    count: z.number().int().min(1, 'Count must be at least 1'),
  }),
);

const contentTagFrequencySchema = z.array(
  z.object({
    tag: z.string().min(1, 'Tag is required'),
    count: z.number().int().min(1, 'Count must be at least 1'),
  }),
);

const alignedGoalSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  goalTitle: z.string().min(1, 'Goal title is required'),
  evidence: z.array(z.string()).min(1, 'At least one piece of evidence is required'),
});

const neglectedGoalSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  goalTitle: z.string().min(1, 'Goal title is required'),
  reason: z.string().optional(),
});

// Base schema for weekly analysis data
const weeklyAnalysisBaseSchema = z.object({
  analysisType: analysisTypeSchema.default('weekly'),
  periodStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  periodEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  journalSummary: z.string().min(1, 'Journal summary is required').max(10000, 'Journal summary is too long'),
  journalTags: z.array(z.string()).default([]),
  totalXpGained: z.number().int().min(0, 'Total XP gained must be non-negative').default(0),
  tasksCompleted: z.number().int().min(0, 'Tasks completed must be non-negative').default(0),
  avgDayRating: z.number().min(1).max(5).nullable().optional(), // Average daily rating (1-5 scale, nullable if no ratings)
  xpByStats: xpByStatsSchema.default([]),
  toneFrequency: toneFrequencySchema.default([]),
  contentTagFrequency: contentTagFrequencySchema.default([]),
  alignmentScore: z.number().int().min(0).max(100).nullable().optional(),
  alignedGoals: z.array(alignedGoalSchema).default([]),
  neglectedGoals: z.array(neglectedGoalSchema).default([]),
  suggestedNextSteps: z.array(z.string()).default([]),
  goalAlignmentSummary: z.string().min(1, 'Goal alignment summary is required').max(10000, 'Goal alignment summary is too long'),
  combinedReflection: z.string().max(10000, 'Combined reflection is too long').optional(),
});

// Create weekly analysis schema
export const createWeeklyAnalysisSchema = weeklyAnalysisBaseSchema;

// Update weekly analysis schema (all fields optional except required ones made optional)
export const updateWeeklyAnalysisSchema = weeklyAnalysisBaseSchema
  .omit({ periodStartDate: true, periodEndDate: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Generate weekly analysis schema
export const generateWeeklyAnalysisSchema = z.object({
  analysisType: analysisTypeSchema.default('weekly'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
});

// List weekly analyses query schema
export const listWeeklyAnalysesSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val > 0 && val <= 100), {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: 'Offset must be non-negative',
    }),
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 2020 && val <= 2030), {
      message: 'Year must be between 2020 and 2030',
    }),
  analysisType: z
    .string()
    .optional()
    .refine((val) => val === undefined || ['weekly', 'monthly', 'quarterly'].includes(val), {
      message: 'Analysis type must be weekly, monthly, or quarterly',
    }),
});

// Weekly analysis ID parameter schema
export const weeklyAnalysisIdSchema = z.object({
  id: z.string().uuid('Invalid weekly analysis ID'),
});
