import { z } from 'zod';

// Validation schema for creating a journal
export const createJournalSchema = z.object({
  content: z.string().min(1, 'Journal content cannot be empty'),
  journalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Journal date must be in the format YYYY-MM-DD'),
});

// Validation schema for updating a journal
export const updateJournalSchema = z.object({
  content: z.string().min(1, 'Journal content cannot be empty').optional(),
  journalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Journal date must be in the format YYYY-MM-DD')
    .optional(),
});

// Validation schema for finalizing a journal
export const finalizeJournalSchema = z.object({
  id: z.string().uuid('Invalid journal ID'),
});

// Validation schema for creating a content tag
export const createContentTagSchema = z.object({
  journalId: z.string().uuid('Invalid journal ID'),
  tag: z.string().min(1, 'Tag cannot be empty').max(100, 'Tag is too long'),
});

// Validation schema for creating a tone tag
export const createToneTagSchema = z.object({
  journalId: z.string().uuid('Invalid journal ID'),
  tag: z.string().min(1, 'Tag cannot be empty').max(100, 'Tag is too long'),
});

// Validation schema for creating a stat tag
export const createStatTagSchema = z.object({
  journalId: z.string().uuid('Invalid journal ID'),
  statId: z.string().uuid('Invalid stat ID'),
  xpAmount: z.number().int().positive().max(100, 'XP amount must be between 1 and 100'),
});
