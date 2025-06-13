// Import shared types from backend
import type {
  User as BackendUser,
  JournalEntry as BackendJournalEntry,
  Experiment as BackendExperiment,
  CharacterStat as BackendCharacterStat,
  ContentTag as BackendContentTag,
  ToneTag as BackendToneTag,
  DailyTask as BackendDailyTask,
  JournalEntryWithTags as BackendJournalEntryWithTags,
  ExperimentWithStats as BackendExperimentWithStats,
  ApiResponse as BackendApiResponse,
  AuthResponse as BackendAuthResponse,
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  CreateCharacterStatInput,
  UpdateCharacterStatInput,
  CreateExperimentInput,
  UpdateExperimentInput,
  CompleteDailyTaskInput,
  CreateJournalEntryInput,
  ContinueConversationInput,
  UpdateJournalEntryInput,
  CreateContentTagInput,
  JwtPayload,
} from '@backend/types'

// Re-export backend types with cleaner names
export type User = BackendUser
export type JournalEntry = BackendJournalEntry
export type Experiment = BackendExperiment
export type CharacterStat = BackendCharacterStat
export type ContentTag = BackendContentTag
export type ToneTag = BackendToneTag
export type DailyTask = BackendDailyTask
export type JournalEntryWithTags = BackendJournalEntryWithTags
export type ExperimentWithStats = BackendExperimentWithStats
export type ApiResponse<T = any> = BackendApiResponse<T>
export type AuthResponse = BackendAuthResponse

// Re-export input types
export type {
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  CreateCharacterStatInput,
  UpdateCharacterStatInput,
  CreateExperimentInput,
  UpdateExperimentInput,
  CompleteDailyTaskInput,
  CreateJournalEntryInput,
  ContinueConversationInput,
  UpdateJournalEntryInput,
  CreateContentTagInput,
  JwtPayload,
}

// Frontend-specific types
export interface Theme {
  name: string
  value: 'light' | 'dark' | 'dracula'
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export interface JournalState {
  entries: JournalEntry[]
  currentEntry: JournalEntry | null
  isLoading: boolean
  error: string | null
}

export interface ExperimentState {
  experiments: Experiment[]
  activeExperiment: Experiment | null
  isLoading: boolean
  error: string | null
}

export interface CharacterStatState {
  stats: CharacterStat[]
  isLoading: boolean
  error: string | null
}

// UI Component Props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}
