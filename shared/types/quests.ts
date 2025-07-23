// Quest types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

// Base types from database schema
export interface Quest {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  startDate: string; // date type in postgres
  endDate: string | null; // date type in postgres
  reflection: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewQuest {
  id?: string;
  userId: string;
  title: string;
  summary?: string | null;
  startDate: string; // date type in postgres
  endDate?: string | null; // date type in postgres
  reflection?: string | null;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestExperiment {
  id: string;
  questId: string;
  experimentId: string;
  createdAt: Date;
}

export interface NewQuestExperiment {
  id?: string;
  questId: string;
  experimentId: string;
  createdAt?: Date;
}

export interface QuestJournal {
  id: string;
  questId: string;
  journalId: string;
  linkedType: string;
  createdAt: Date;
}

export interface NewQuestJournal {
  id?: string;
  questId: string;
  journalId: string;
  linkedType?: string;
  createdAt?: Date;
}

// Request/Response types for API
export interface CreateQuestRequest {
  title: string;
  summary?: string;
  startDate: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
}

export interface UpdateQuestRequest {
  title?: string;
  summary?: string;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  reflection?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface QuestResponse {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  startDate: string;
  endDate?: string;
  reflection?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestWithExperimentsAndJournalsResponse extends QuestResponse {
  experiments: Array<{
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: string;
  }>;
  journals: Array<{
    id: string;
    date: string;
    title?: string;
    synopsis?: string;
    linkedType: string;
  }>;
  xpByStats: Array<{
    statId: string;
    statName: string;
    totalXp: number;
  }>;
}

export interface QuestDashboardResponse extends QuestWithExperimentsAndJournalsResponse {
  // Dashboard includes all the same data as the detailed response
}

export interface LinkQuestExperimentRequest {
  experimentId: string;
}

export interface LinkQuestJournalRequest {
  journalId: string;
  linkedType?: 'automatic' | 'manual';
}
