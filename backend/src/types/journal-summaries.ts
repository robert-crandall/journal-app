import type { journalSummaries } from '../db/schema/journal-summaries';

export type JournalSummary = typeof journalSummaries.$inferSelect;
export type NewJournalSummary = typeof journalSummaries.$inferInsert;

// Request/Response types for API
export interface CreateJournalSummaryRequest {
  period: 'week' | 'month';
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  summary: string;
  tags?: string[];
}

export interface UpdateJournalSummaryRequest {
  summary?: string;
  tags?: string[];
}

export interface ListJournalSummariesRequest {
  period?: 'week' | 'month';
  limit?: number;
  offset?: number;
  year?: number;
}

export interface GenerateJournalSummaryRequest {
  period: 'week' | 'month';
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
}

export interface JournalSummaryResponse {
  id: string;
  userId: string;
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  summary: string;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListJournalSummariesResponse {
  summaries: JournalSummaryResponse[];
  total: number;
  hasMore: boolean;
}
