import { z } from 'zod';

export const createJournalSummarySchema = z.object({
  period: z.enum(['week', 'month']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  summary: z.string().min(1, 'Summary is required'),
  tags: z.array(z.string()).optional(),
});

export const updateJournalSummarySchema = z.object({
  summary: z.string().min(1, 'Summary is required').optional(),
  tags: z.array(z.string()).optional(),
});

export const listJournalSummariesSchema = z.object({
  period: z.enum(['week', 'month']).optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  year: z.coerce.number().min(2020).max(2100).optional(),
});

export const journalSummaryIdSchema = z.object({
  id: z.string().uuid('Invalid summary ID'),
});

export const generateJournalSummarySchema = z.object({
  period: z.enum(['week', 'month']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});
