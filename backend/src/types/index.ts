// Shared types for the Journal App API
// These types are imported directly by the frontend for end-to-end type safety

import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  userContextSchema,
  updateUserContextSchema,
  userPreferencesSchema,
  updateProfileSchema,
  createTaskSchema,
  updateTaskSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
} from '../lib/validation';

// Re-export validation schemas
export {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  userContextSchema,
  updateUserContextSchema,
  userPreferencesSchema,
  updateProfileSchema,
  createTaskSchema,
  updateTaskSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
};

// Infer types from schemas for frontend use
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;
export type UserContext = z.infer<typeof userContextSchema>;
export type UpdateUserContext = z.infer<typeof updateUserContextSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type CreateJournalEntry = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntry = z.infer<typeof updateJournalEntrySchema>;

// Response wrapper type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Entity types (inferred from database schema)
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  isAnalyzed: boolean;
  summary?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserContextItem {
  id: string;
  userId: string;
  key: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPrefs {
  id: string;
  userId: string;
  theme: string;
  accentColor: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard data
export interface DashboardData {
  user: User;
  tasksToday: Task[];
  recentJournalEntries: JournalEntry[];
  totalTasks: number;
  completedTasks: number;
  totalJournalEntries: number;
}

// Authentication response
export interface AuthResponse {
  user: User;
  token: string;
}
