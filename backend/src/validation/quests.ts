import { z } from 'zod';

export const createQuestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  summary: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
});

export const updateQuestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  summary: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  reflection: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export const linkQuestExperimentSchema = z.object({
  experimentId: z.string().uuid('Invalid experiment ID'),
});

export const linkQuestJournalSchema = z.object({
  journalId: z.string().uuid('Invalid journal ID'),
  linkedType: z.enum(['automatic', 'manual']).default('manual'),
});

export const questIdSchema = z.object({
  id: z.string().uuid('Invalid quest ID'),
});

export const questDashboardSchema = z.object({
  id: z.string().uuid('Invalid quest ID'),
});
