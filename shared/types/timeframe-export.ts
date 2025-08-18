// Timeframe Export types - shared between backend and frontend

export interface TimeframeExportOptions {
  includeDailyEntries: boolean;
  includeWeeklyAnalyses: boolean;
  includeMonthlyAnalyses: boolean;
  includeGoals: boolean;
  includePlans: boolean;
  includeQuests: boolean;
  includeExperiments: boolean;
}

export interface TimeframeExportRequest {
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  options: TimeframeExportOptions;
}

export interface TimeframeExportResponse {
  markdownContent: string;
  generatedAt: string; // ISO date string
  dateRange: {
    startDate: string;
    endDate: string;
  };
  sectionsIncluded: string[]; // Names of included sections
}

// Data structure for internal processing
export interface TimeframeExportData {
  dailyEntries?: DailyEntry[];
  weeklyAnalyses?: WeeklyAnalysisEntry[];
  monthlyAnalyses?: MonthlyAnalysisEntry[];
  goals?: GoalEntry[];
  plans?: PlanEntry[];
  quests?: QuestEntry[];
  experiments?: ExperimentEntry[];
}

export interface DailyEntry {
  date: string;
  initialMessage: string;
  summary?: string;
  title?: string;
  synopsis?: string;
  dayRating?: number;
}

export interface WeeklyAnalysisEntry {
  id: string;
  periodStartDate: string;
  periodEndDate: string;
  journalSummary: string;
  goalAlignmentSummary: string;
  combinedReflection?: string;
  reflection?: string;
}

export interface MonthlyAnalysisEntry {
  id: string;
  periodStartDate: string;
  periodEndDate: string;
  journalSummary: string;
  goalAlignmentSummary: string;
  combinedReflection?: string;
  reflection?: string;
}

export interface GoalEntry {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanEntry {
  id: string;
  title: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  subtasks: PlanSubtaskEntry[];
}

export interface PlanSubtaskEntry {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface QuestEntry {
  id: string;
  title: string;
  summary?: string;
  startDate: string;
  endDate?: string;
  reflection?: string;
  status: string;
  createdAt: string;
  experiments: QuestExperimentEntry[];
  journalEntries: QuestJournalEntry[];
}

export interface QuestExperimentEntry {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  reflection?: string;
}

export interface QuestJournalEntry {
  date: string;
  title?: string;
  summary?: string;
}

export interface ExperimentEntry {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  reflection?: string;
  shouldRepeat?: boolean;
  tasks: ExperimentTaskEntry[];
}

export interface ExperimentTaskEntry {
  id: string;
  description: string;
  successMetric: number;
  xpReward: number;
  completions: ExperimentTaskCompletionEntry[];
}

export interface ExperimentTaskCompletionEntry {
  completedDate: string;
  notes?: string;
}