import { z } from 'zod';
import * as schemas from '../utils/validationSchemas';

// User types
export type UserRegisterInput = z.infer<typeof schemas.userRegisterSchema>;
export type UserLoginInput = z.infer<typeof schemas.userLoginSchema>;

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  createdAt: string;
}

export interface UserAuth {
  id: string;
  email: string;
}

// Character stats types
export type CharacterStatInput = z.infer<typeof schemas.characterStatSchema>;

export interface CharacterStat {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  currentXP: number;
  createdAt: string;
  updatedAt: string;
}

// Family member types
export type FamilyMemberInput = z.infer<typeof schemas.familyMemberSchema>;

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  relationship: string | null;
  createdAt: string;
}

// Tag types
export type TagInput = z.infer<typeof schemas.tagSchema>;

export interface Tag {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

// Quest types
export type QuestInput = z.infer<typeof schemas.questSchema>;

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// Quest milestone types
export type QuestMilestoneInput = z.infer<typeof schemas.questMilestoneSchema>;

export interface QuestMilestone {
  id: string;
  questId: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// Experiment types
export type ExperimentInput = z.infer<typeof schemas.experimentSchema>;

export interface Experiment {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  successCriteria: string | null;
  isSuccessful: boolean | null;
}

// Task types
export type TaskInput = z.infer<typeof schemas.taskSchema>;

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrencePattern: any | null;
  questId: string | null;
  experimentId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  isGptGenerated: boolean;
  familyMembers?: FamilyMember[];
  characterStats?: Array<{
    characterStat: CharacterStat;
    xpAmount: number;
  }>;
}

// Journal entry types
export type JournalEntryInput = z.infer<typeof schemas.journalEntrySchema>;

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  title: string | null;
  synopsis: string | null;
  summary: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  familyMembers?: FamilyMember[];
  characterStats?: Array<{
    characterStat: CharacterStat;
    xpAmount: number;
  }>;
}

// Journal analysis types
export type JournalAnalysisInput = z.infer<typeof schemas.journalAnalysisSchema>;

export interface JournalAnalysisResult {
  title: string | null;
  synopsis: string | null;
  summary: string | null;
  tags: string[];
  characterStats: Array<{
    id: string;
    name: string;
    xpAmount: number;
  }>;
  familyMembers: string[];
}

// Conversation types
export type ConversationInput = z.infer<typeof schemas.conversationSchema>;

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

// Message types
export type MessageInput = z.infer<typeof schemas.messageSchema>;

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

// User context types
export type UserContextInput = z.infer<typeof schemas.userContextSchema>;

export interface UserContext {
  id: string;
  userId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

// Generic API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
