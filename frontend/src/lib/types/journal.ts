// Import journal types from backend (single source of truth)
export type {
  JournalResponse,
  TodayJournalResponse,
  CreateJournalRequest,
  UpdateJournalRequest,
  AddChatMessageRequest,
  ChatMessage,
  // Journal Dashboard Types
  ListJournalsRequest,
  ListJournalsResponse,
  JournalListItem,
} from '../../../../backend/src/types/journals';

// Additional frontend-specific types for UI state
export interface JournalFormData {
  initialMessage: string;
}

export interface ChatFormData {
  message: string;
}

export type JournalStatus = 'draft' | 'in_review' | 'complete';
