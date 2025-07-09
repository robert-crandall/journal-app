import type { quests, questStats, questTasks, questTaskStats } from '../db/schema/quests';

// Base quest types
export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;

// Quest stats types
export type QuestStat = typeof questStats.$inferSelect;
export type NewQuestStat = typeof questStats.$inferInsert;

// Quest task types
export type QuestTask = typeof questTasks.$inferSelect;
export type NewQuestTask = typeof questTasks.$inferInsert;

// Quest task stats types
export type QuestTaskStat = typeof questTaskStats.$inferSelect;
export type NewQuestTaskStat = typeof questTaskStats.$inferInsert;

// Enhanced types with related data
export interface QuestWithTasks extends Quest {
  tasks: QuestTask[];
  stats: QuestStat[];
}

export interface QuestTaskWithStats extends QuestTask {
  stats: QuestTaskStat[];
}

export interface QuestWithProgress extends Quest {
  tasks: QuestTaskWithStats[];
  stats: QuestStat[];
  completedTasksCount: number;
  totalTasksCount: number;
  progressPercentage: number;
  xpEarned: number;
  timeRemaining: number; // in milliseconds
  isExpiredDerived: boolean; // calculated based on current time vs endDate
}

// Request/Response types for API
export interface CreateQuestRequest {
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  tasks: CreateQuestTaskRequest[];
  statIds: string[]; // Stats that get bonus XP on quest completion
}

export interface CreateQuestTaskRequest {
  title: string;
  description?: string;
  dueDate?: string; // ISO string
  xpAmount?: number;
  statIds: string[]; // Stats that get XP when this task is completed
  order?: number;
}

export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  isActive?: boolean;
  isArchived?: boolean;
}

export interface UpdateQuestTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string; // ISO string
  xpAmount?: number;
  order?: number;
  isCompleted?: boolean;
}

export interface CreateQuestResponse {
  success: boolean;
  data: QuestWithTasks;
}

export interface GetQuestsResponse {
  success: boolean;
  data: QuestWithProgress[];
}

export interface GetQuestResponse {
  success: boolean;
  data: QuestWithProgress;
}

export interface UpdateQuestResponse {
  success: boolean;
  data: QuestWithTasks;
}

export interface CompleteQuestTaskResponse {
  success: boolean;
  data: {
    task: QuestTask;
    xpGranted: Array<{
      statId: string;
      statName: string;
      xpAmount: number;
    }>;
    questCompleted?: boolean;
    bonusXpGranted?: Array<{
      statId: string;
      statName: string;
      xpAmount: number;
    }>;
  };
}

export interface DeleteQuestResponse {
  success: boolean;
}
