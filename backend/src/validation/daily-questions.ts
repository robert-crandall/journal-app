import { z } from 'zod';

// Validation schemas for daily questions
export const createDailyQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(500, 'Question text must be less than 500 characters'),
  dateAssigned: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  contextSource: z.string().max(1000, 'Context source must be less than 1000 characters').optional(),
});

export const updateDailyQuestionSchema = z.object({
  answered: z.boolean().optional(),
});

export const dailyQuestionIdSchema = z.object({
  id: z.string().uuid('Invalid question ID'),
});

export const getTodayQuestionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});
