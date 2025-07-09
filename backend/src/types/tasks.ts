import type { tasks, taskCompletions } from '../db/schema/tasks';

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskUpdate = Partial<Omit<NewTask, 'id' | 'userId' | 'createdAt'>>;

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type NewTaskCompletion = typeof taskCompletions.$inferInsert;

// Request/Response types for API
export interface CreateTaskRequest {
  title: string;
  description?: string;
  sourceType: 'track_task' | 'initiative_task' | 'manual' | 'todo';
  sourceId?: string;
  dueDate?: string; // ISO date string
  priority?: number;
  statId?: string;
  xpReward?: number;
  familyMemberId?: string;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: number[]; // For weekly recurrence
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: number;
  statId?: string;
  xpReward?: number;
  familyMemberId?: string;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: number[];
}

export interface CompleteTaskRequest {
  notes?: string;
}

// Enhanced types with related data
export interface TaskWithRelations extends Task {
  stat?: {
    id: string;
    name: string;
  };
  familyMember?: {
    id: string;
    name: string;
  };
  completions?: TaskCompletion[];
}

export interface DailyTaskView {
  id: string;
  title: string;
  description?: string;
  sourceType: string;
  priority: number;
  xpReward: number;
  dueDate?: Date;
  isCompleted: boolean;
  stat?: {
    id: string;
    name: string;
  };
  familyMember?: {
    id: string;
    name: string;
  };
}
