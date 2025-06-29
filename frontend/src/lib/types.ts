// Import types directly from backend (single source of truth)
import type { 
  users, 
  characters, 
  characterStats, 
  familyMembers, 
  tasks, 
  taskCompletions,
  journalConversations,
  journalEntries,
  quests,
  experiments
} from '../../../backend/src/db/schema'

// Inferred types from Drizzle schema
export type User = typeof users.$inferSelect
export type Character = typeof characters.$inferSelect
export type CharacterStat = typeof characterStats.$inferSelect
export type FamilyMember = typeof familyMembers.$inferSelect
export type Task = typeof tasks.$inferSelect
export type TaskCompletion = typeof taskCompletions.$inferSelect
export type JournalConversation = typeof journalConversations.$inferSelect
export type JournalEntry = typeof journalEntries.$inferSelect
export type Quest = typeof quests.$inferSelect
export type Experiment = typeof experiments.$inferSelect

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard data structure
export interface DashboardData {
  user: User
  character: Character
  stats: CharacterStat[]
  todaysTasks: Task[]
  activeQuest?: Quest
  activeExperiment?: Experiment
  xpProgress: {
    currentLevel: number
    currentXp: number
    xpToNextLevel: number
    totalXp: number
  }
  journalPrompt?: string
}
