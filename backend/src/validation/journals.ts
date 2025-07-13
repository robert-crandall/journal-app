import { z } from 'zod';

export const createJournalSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  initialMessage: z.string().optional(),
});

export const updateJournalSchema = z.object({
  initialMessage: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'complete']).optional(),
  chatSession: z.array(z.any()).optional(), // Array of chat messages
  summary: z.string().optional(),
  title: z.string().optional(),
  synopsis: z.string().optional(),
  toneTags: z.array(z.string()).optional(),
  contentTags: z.array(z.string()).optional(),
  statTags: z.array(z.string()).optional(),
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
