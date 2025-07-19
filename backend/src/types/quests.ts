import type { quests, questExperiments, questJournals } from '../db/schema/quests';

// Base types from database schema
export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;
export type QuestExperiment = typeof questExperiments.$inferSelect;
export type NewQuestExperiment = typeof questExperiments.$inferInsert;
export type QuestJournal = typeof questJournals.$inferSelect;
export type NewQuestJournal = typeof questJournals.$inferInsert;

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
