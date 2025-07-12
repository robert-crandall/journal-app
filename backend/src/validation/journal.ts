import { z } from 'zod';

export const startJournalSessionSchema = z.object({
  // No fields needed for starting a session
});

export const startLongFormJournalSchema = z.object({
  // No fields needed for starting a long-form journal entry
});

export const sendJournalMessageSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

export const saveJournalEntrySchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),
});

export const saveLongFormJournalSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(50000, 'Content too long'),
});

export const startReflectionSchema = z.object({
  entryId: z.string().uuid('Entry ID must be a valid UUID'),
});

export const getJournalEntrySchema = z.object({
  entryId: z.string().uuid('Entry ID must be a valid UUID'),
});

export const saveSimpleLongFormJournalSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(50000, 'Content too long'),
  entryId: z.string().uuid('Entry ID must be a valid UUID').optional(),
});

export const updateLongFormJournalSchema = z.object({
  entryId: z.string().uuid('Entry ID must be a valid UUID'),
  content: z.string().min(1, 'Content cannot be empty').max(50000, 'Content too long'),
});
