import { z } from 'zod';

// Conversation message validation
export const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant'], {
    required_error: 'Message role is required',
  }),
  content: z.string().min(1, 'Message content is required'),
  timestamp: z.string().datetime('Invalid timestamp format'),
});

// Journal entry creation validation
export const createJournalEntrySchema = z.object({
  rawContent: z.string().min(1, 'Journal content is required').max(10000, 'Journal content must be 10000 characters or less'),
  conversationHistory: z.array(conversationMessageSchema).default([]),
  entryDate: z.string().datetime('Invalid entry date format').optional(),
  questId: z.string().uuid('Invalid quest ID').optional(),
});

// Journal entry update validation
export const updateJournalEntrySchema = createJournalEntrySchema.partial();

// Quick journal entry validation (for dashboard)
export const quickJournalSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be 5000 characters or less'),
  questId: z.string().uuid('Invalid quest ID').optional(),
});

// Journal entry processing validation
export const processJournalEntrySchema = z.object({
  entryId: z.string().uuid('Invalid entry ID'),
});

// GPT analysis result validation
export const journalAnalysisResultSchema = z.object({
  title: z.string().min(1).max(255),
  summary: z.string().min(1).max(5000),
  synopsis: z.string().min(1).max(500),
  contentTags: z.array(z.string().max(50)).max(10),
  moodTags: z.array(z.string().max(50)).max(5),
  statTags: z.array(z.string().max(100)).max(10),
  xpGrants: z.array(
    z.object({
      statName: z.string().max(100),
      xpAmount: z.number().int().min(1).max(500),
      reason: z.string().max(500),
    }),
  ).max(10),
});

// Query validation for journal endpoints
export const journalQuerySchema = z.object({
  questId: z.string().uuid('Invalid quest ID').optional(),
  isProcessed: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
  tags: z.string().optional(), // Comma-separated tags
  mood: z.string().optional(),
  includeRelations: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
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
});
