import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { experiments, experimentTasks, experimentTaskCompletions } from '../db/schema/experiments';

// Base types from database schema
export type Experiment = InferSelectModel<typeof experiments>;
export type CreateExperiment = InferInsertModel<typeof experiments>;
export type UpdateExperiment = Partial<Omit<CreateExperiment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export type ExperimentTask = InferSelectModel<typeof experimentTasks>;
export type CreateExperimentTask = InferInsertModel<typeof experimentTasks>;
export type UpdateExperimentTask = Partial<Omit<CreateExperimentTask, 'id' | 'experimentId' | 'createdAt' | 'updatedAt'>>;

export type ExperimentTaskCompletion = InferSelectModel<typeof experimentTaskCompletions>;
export type CreateExperimentTaskCompletion = InferInsertModel<typeof experimentTaskCompletions>;

// API request/response types
export type CreateExperimentRequest = {
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  tasks?: Array<{
    description: string;
    successMetric?: number;
    xpReward?: number;
    statId?: string;
  }>;
};

export type UpdateExperimentRequest = Partial<Omit<CreateExperimentRequest, 'tasks'>>;

export type CreateExperimentTaskRequest = {
  description: string;
  successMetric?: number;
  xpReward?: number;
  statId?: string;
};

export type UpdateExperimentTaskRequest = Partial<CreateExperimentTaskRequest>;

export type CompleteExperimentTaskRequest = {
  completedDate: string; // YYYY-MM-DD format
  notes?: string;
};

// Response types with serialized dates and populated relationships
export type ExperimentResponse = Omit<Experiment, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type ExperimentTaskResponse = Omit<ExperimentTask, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type ExperimentTaskCompletionResponse = Omit<ExperimentTaskCompletion, 'createdAt'> & {
  createdAt: string;
};

export type ExperimentWithTasksResponse = ExperimentResponse & {
  tasks: ExperimentTaskResponse[];
};

export type ExperimentTaskWithCompletionsResponse = ExperimentTaskResponse & {
  completions: ExperimentTaskCompletionResponse[];
  completionCount: number;
  isCompleteToday: boolean;
};

// Dashboard types
export type ExperimentDashboardResponse = {
  experiment: ExperimentResponse;
  stats: {
    daysCompleted: number;
    totalDays: number;
    completionPercentage: number;
    totalXpEarned: number;
    tasksCompleted: number;
    totalTaskInstances: number;
  };
  tasks: ExperimentTaskWithCompletionsResponse[];
  // TODO: Uncomment when journal entries are available
  // journalEntries: Array<{
  //   id: string;
  //   title: string;
  //   synopsis: string;
  //   createdAt: string;
  // }>;
  xpBreakdown: {
    fromTasks: number;
    fromJournals: number;
    total: number;
  };
};
