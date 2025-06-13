// Copy your backend types here for frontend use
// This file imports all the types from your backend client

// For now, we'll copy the essential types from your backend
// TODO: Set up proper type sharing once the build system is configured

// Core entity types (copied from backend)
export interface User {
  id: string
  email: string
  username: string
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: string
  userId: string
  title: string | null
  summary: string | null
  synopsis: string | null
  conversationData: {
    messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[]
    isComplete: boolean
  }
  entryDate: string
  createdAt: string
  updatedAt: string
}

export interface Experiment {
  id: string
  userId: string
  title: string
  description: string
  startDate: string
  endDate: string
  dailyTaskDescription: string
  createdAt: string
  updatedAt: string
}

export interface CharacterStat {
  id: string
  userId: string
  name: string
  description: string
  currentXp: number
  createdAt: string
  updatedAt: string
}

export interface ContentTag {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ToneTag {
  id: string
  name: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
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
