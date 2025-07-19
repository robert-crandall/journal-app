// Import quest types from backend (single source of truth)
export type {
  QuestResponse,
  QuestWithExperimentsAndJournalsResponse,
  QuestDashboardResponse,
  CreateQuestRequest,
  UpdateQuestRequest,
  LinkQuestExperimentRequest,
  LinkQuestJournalRequest,
  Quest,
  NewQuest,
  QuestExperiment,
  QuestJournal,
} from '../../../../backend/src/types/quests';

// Additional frontend-specific types for UI state
export interface QuestFormData {
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  reflection: string;
}

export interface CreateQuestFormData {
  title: string;
  summary: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateQuestFormData {
  title?: string;
  summary?: string;
  startDate?: string;
  endDate?: string;
  reflection?: string;
  status?: 'active' | 'completed' | 'archived';
}

export type QuestStatus = 'active' | 'completed' | 'archived';

// UI state types
export interface QuestFilters {
  status: QuestStatus | 'all';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface QuestListOptions {
  showArchived?: boolean;
  sortBy?: 'startDate' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}
