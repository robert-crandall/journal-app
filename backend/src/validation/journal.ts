import { z } from 'zod';

export const startJournalSessionSchema = z.object({
  // No fields needed for starting a session
});

export const sendJournalMessageSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

export const saveJournalEntrySchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),
});

export const getJournalEntrySchema = z.object({
  entryId: z.string().uuid('Entry ID must be a valid UUID'),
});
