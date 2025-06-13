import { z } from 'zod'

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
})

// Character stats schemas
export const CreateCharacterStatSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export const UpdateCharacterStatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
})

// Experiment schemas
export const CreateExperimentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  dailyTaskDescription: z.string().min(1),
  xpRewards: z.array(z.object({
    statId: z.string().uuid(),
    xp: z.number().int().min(1),
  })).optional().default([]),
})

export const UpdateExperimentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  dailyTaskDescription: z.string().min(1).optional(),
})

// Daily task schemas
export const CompleteDailyTaskSchema = z.object({
  completed: z.boolean(),
  date: z.string().datetime(),
})

// Journal entry schemas
export const CreateJournalEntrySchema = z.object({
  entryDate: z.string().datetime(),
  initialMessage: z.string().min(1),
  experimentIds: z.array(z.string().uuid()).optional().default([]),
})

export const ContinueConversationSchema = z.object({
  message: z.string().min(1),
})

export const UpdateJournalEntrySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  summary: z.string().optional(),
  synopsis: z.string().optional(),
  entryDate: z.string().datetime().optional(),
})

// Content tag schemas
export const CreateContentTagSchema = z.object({
  name: z.string().min(1).max(100),
})

// Types inferred from schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export type CreateCharacterStatInput = z.infer<typeof CreateCharacterStatSchema>
export type UpdateCharacterStatInput = z.infer<typeof UpdateCharacterStatSchema>

export type CreateExperimentInput = z.infer<typeof CreateExperimentSchema>
export type UpdateExperimentInput = z.infer<typeof UpdateExperimentSchema>

export type CompleteDailyTaskInput = z.infer<typeof CompleteDailyTaskSchema>

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>
export type ContinueConversationInput = z.infer<typeof ContinueConversationSchema>
export type UpdateJournalEntryInput = z.infer<typeof UpdateJournalEntrySchema>

export type CreateContentTagInput = z.infer<typeof CreateContentTagSchema>

// Database entity types
export interface User {
  id: string
  email: string
  name?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CharacterStat {
  id: string
  userId: string
  name: string
  description?: string | null
  currentXp: number
  createdAt: Date
  updatedAt: Date
}

export interface Experiment {
  id: string
  userId: string
  title: string
  description?: string | null
  startDate: Date
  endDate: Date
  dailyTaskDescription: string
  createdAt: Date
  updatedAt: Date
}

export interface DailyTask {
  id: string
  experimentId: string
  date: Date
  completed: boolean
  completedAt?: Date | null
  xpRewards: { statId: string; xp: number }[] | null
  createdAt: Date
  updatedAt: Date
}

export interface ContentTag {
  id: string
  userId: string
  name: string
  createdAt: Date
}

export interface ToneTag {
  id: string
  name: string
  description?: string | null
  createdAt: Date
}

export interface JournalEntry {
  id: string
  userId: string
  title?: string | null
  summary?: string | null
  synopsis?: string | null
  conversationData: {
    messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[]
    isComplete: boolean
  }
  entryDate: Date
  createdAt: Date
  updatedAt: Date
}

// Extended types with relations
export interface JournalEntryWithTags extends JournalEntry {
  contentTags: ContentTag[]
  toneTags: ToneTag[]
  characterStats: (CharacterStat & { xpGained: number })[]
  experiments: Experiment[]
}

export interface ExperimentWithStats extends Experiment {
  dailyTasks: DailyTask[]
  journalEntries: JournalEntryWithTags[]
  completionRate: number
  totalXpGained: { [statId: string]: number }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
  }
  error?: string
}

// JWT payload type
export interface JwtPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}
