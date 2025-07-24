// Import journal types from shared folder (single source of truth)
export type {
  JournalResponse,
  TodayJournalResponse,
  CreateJournalRequest,
  UpdateJournalRequest,
  AddChatMessageRequest,
  ChatMessage,
  ToneTag,
  // Journal Dashboard Types
  ListJournalsRequest,
  ListJournalsResponse,
  JournalListItem,
} from '../../../../shared/types/journals';

export { TONE_TAGS } from '../../../../shared/types/journals';

// Additional frontend-specific types for UI state
export interface JournalFormData {
  initialMessage: string;
}

export interface ChatFormData {
  message: string;
}

export type JournalStatus = 'draft' | 'in_review' | 'complete';
