import { z } from 'zod';

// Import the tone tags from shared types for validation
const TONE_TAGS = ['happy', 'calm', 'energized', 'overwhelmed', 'sad', 'angry', 'anxious'] as const;

export const createJournalSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  initialMessage: z.string().optional(),
  dayRating: z.number().int().min(1).max(5).optional(),
});

export const updateJournalSchema = z.object({
  initialMessage: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'complete']).optional(),
  chatSession: z.array(z.any()).optional(), // Array of chat messages
  summary: z.string().optional(),
  title: z.string().optional(),
  synopsis: z.string().optional(),
  toneTags: z.array(z.enum(TONE_TAGS)).max(2, 'Maximum 2 tone tags allowed').optional(),
  dayRating: z.number().int().min(1).max(5).optional(),
  inferredDayRating: z.number().int().min(1).max(5).optional(),
});

export const addChatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

export const journalDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// Schema for completing journal (triggers GPT analysis)
export const finishJournalSchema = z.object({
  // No additional fields needed
});

// Schema for listing journals with filters
export const listJournalsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['draft', 'in_review', 'complete']).optional(),
  search: z.string().optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  tagIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        return val.split(',').filter(Boolean);
      }
      return val || [];
    }),
});
