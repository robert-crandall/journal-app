import type { quests } from '../db/schema/quests';

export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;
export type QuestUpdate = Partial<Omit<NewQuest, 'id' | 'userId' | 'createdAt'>>;

// Request/Response types for API
export interface CreateQuestRequest {
  title: string;
  description?: string;
  type: 'quest' | 'experiment';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  goalId?: string;
  dailyTaskTitle?: string;
  dailyTaskDescription?: string;
  dailyTaskXpReward?: number;
  includeInAiGeneration?: boolean;
}

export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goalId?: string;
  dailyTaskTitle?: string;
  dailyTaskDescription?: string;
  dailyTaskXpReward?: number;
  includeInAiGeneration?: boolean;
  isActive?: boolean;
}

export interface CompleteQuestRequest {
  conclusion?: string; // For experiments
}

// Enhanced types with related data
export interface QuestWithRelations extends Quest {
  goal?: {
    id: string;
    title: string;
  };
  taskCount?: number;
  completedTaskCount?: number;
  totalXpEarned?: number;
}

export interface QuestDashboard extends QuestWithRelations {
  journalEntries?: Array<{
    id: string;
    title?: string;
    synopsis?: string;
    entryDate: Date;
  }>;
  recentTasks?: Array<{
    id: string;
    title: string;
    completedAt?: Date;
    xpGranted: number;
  }>;
  moodBreakdown?: Record<string, number>;
  tagBreakdown?: Record<string, number>;
  completionRate?: number;
}
