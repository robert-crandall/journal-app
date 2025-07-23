// Journal Summary types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface JournalSummary {
  id: string;
  userId: string;
  period: string;
  startDate: Date;
  endDate: Date;
  summary: string;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewJournalSummary {
  id?: string;
  userId: string;
  period: string;
  startDate: Date;
  endDate: Date;
  summary: string;
  tags?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

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
