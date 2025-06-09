import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Journal schemas
export const journalReplySchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  message: z.string().min(1, 'Message cannot be empty'),
})

export const journalSubmitSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
})

export const journalUpdateSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  finalizedText: z.string().optional(),
})

export type RegisterRequest = z.infer<typeof registerSchema>
export type LoginRequest = z.infer<typeof loginSchema>
export type JournalReplyRequest = z.infer<typeof journalReplySchema>
export type JournalSubmitRequest = z.infer<typeof journalSubmitSchema>
export type JournalUpdateRequest = z.infer<typeof journalUpdateSchema>
