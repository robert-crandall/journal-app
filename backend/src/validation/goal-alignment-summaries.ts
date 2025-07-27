import { z } from 'zod';

// Base validation schemas for goal alignment types
const alignedGoalSchema = z.object({
  goalId: z.string().uuid('Goal ID must be a valid UUID'),
  goalTitle: z.string(),
  evidence: z.array(z.string()),
});

const neglectedGoalSchema = z.object({
  goalId: z.string().uuid('Goal ID must be a valid UUID'),
  goalTitle: z.string(),
  reason: z.string().optional(),
});

export const createGoalAlignmentSummarySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  alignmentScore: z.number().min(0).max(100).optional(),
  alignedGoals: z.array(alignedGoalSchema).optional(),
  neglectedGoals: z.array(neglectedGoalSchema).optional(),
  suggestedNextSteps: z.array(z.string()).optional(),
  summary: z.string().min(1, 'Summary is required'),
});

export const updateGoalAlignmentSummarySchema = z.object({
  alignmentScore: z.number().min(0).max(100).nullable().optional(),
  alignedGoals: z.array(alignedGoalSchema).optional(),
  neglectedGoals: z.array(neglectedGoalSchema).optional(),
  suggestedNextSteps: z.array(z.string()).optional(),
  summary: z.string().min(1).optional(),
});

export const listGoalAlignmentSummariesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
  year: z.coerce.number().min(2020).max(2050).optional(),
});

export const generateGoalAlignmentSummarySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const goalAlignmentSummaryIdSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});
