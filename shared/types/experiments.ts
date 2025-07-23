// Experiment types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

// Base types from database schema
export interface Experiment {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  reflection: string | null;
  shouldRepeat: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExperiment {
  id?: string;
  userId: string;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  reflection?: string | null;
  shouldRepeat?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateExperiment = Partial<Omit<CreateExperiment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface ExperimentTask {
  id: string;
  experimentId: string;
  description: string;
  successMetric: number | null;
  xpReward: number | null;
  statId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExperimentTask {
  id?: string;
  experimentId: string;
  description: string;
  successMetric?: number | null;
  xpReward?: number | null;
  statId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateExperimentTask = Partial<Omit<CreateExperimentTask, 'id' | 'experimentId' | 'createdAt' | 'updatedAt'>>;

export interface ExperimentTaskCompletion {
  id: string;
  taskId: string;
  completedDate: Date;
  notes: string | null;
  createdAt: Date;
}

export interface CreateExperimentTaskCompletion {
  id?: string;
  taskId: string;
  completedDate: Date;
  notes?: string | null;
  createdAt?: Date;
}

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

export type UpdateExperimentRequest = Partial<Omit<CreateExperimentRequest, 'tasks'>> & {
  reflection?: string;
  shouldRepeat?: boolean | null;
};

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
  journalEntries: Array<{
    id: string;
    title: string | null;
    synopsis: string | null;
    createdAt: string;
    date: string;
  }>;
  xpBreakdown: {
    fromTasks: number;
    fromJournals: number;
    total: number;
  };
};
