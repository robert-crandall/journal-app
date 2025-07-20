// Import types from backend (single source of truth)
export type {
  JournalSummary,
  NewJournalSummary,
  CreateJournalSummaryRequest,
  UpdateJournalSummaryRequest,
  ListJournalSummariesRequest,
  GenerateJournalSummaryRequest,
  JournalSummaryResponse,
  ListJournalSummariesResponse,
} from '../../../../backend/src/types/journal-summaries';

// Additional frontend-specific types for UI state
export interface JournalSummaryFormData {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  summary: string;
  tags?: string[];
}

export interface UpdateJournalSummaryFormData {
  summary?: string;
  tags?: string[];
}

export interface GenerateJournalSummaryFormData {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
}

// UI filter types
export interface JournalSummaryFilters {
  period?: 'week' | 'month';
  year?: number;
  limit?: number;
  offset?: number;
}

// Helper types for date calculations
export interface DateRange {
  startDate: string;
  endDate: string;
}
