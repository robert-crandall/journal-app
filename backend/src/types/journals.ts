import type { journals } from '../db/schema/journals';

export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;

// Request/Response types for API
export interface CreateJournalRequest {
  date: string; // YYYY-MM-DD format
  initialMessage?: string;
}

export interface UpdateJournalRequest {
  initialMessage?: string;
  status?: 'draft' | 'in_review' | 'complete';
  chatSession?: any[]; // Array of chat messages
  summary?: string;
  title?: string;
  synopsis?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface StartReflectionRequest {
  // No additional fields needed - uses existing initialMessage
}

export interface AddChatMessageRequest {
  message: string;
}

export interface FinishJournalRequest {
  // No additional fields needed - triggers GPT analysis
}

// Request/Response types for journal listing and filtering
export interface ListJournalsRequest {
  limit?: number;
  offset?: number;
  status?: 'draft' | 'in_review' | 'complete';
  search?: string; // Search in title, synopsis, initialMessage
  dateFrom?: string; // YYYY-MM-DD format
  dateTo?: string; // YYYY-MM-DD format
  tagIds?: string[]; // Content tag IDs to filter by
}

export interface JournalListItem {
  id: string;
  date: string;
  status: 'draft' | 'in_review' | 'complete';
  title: string | null;
  synopsis: string | null;
  initialMessage: string | null;
  createdAt: string;
  updatedAt: string;
  // Include tag information for filtering
  contentTags?: Array<{ id: string; name: string }>;
  // Include basic stats
  characterCount?: number;
  wordCount?: number;
  xpEarned?: number;
}

export interface ListJournalsResponse {
  journals: JournalListItem[];
  total: number;
  hasMore: boolean;
  // Filter options for frontend
  availableTags: Array<{ id: string; name: string }>;
}

export interface JournalResponse {
  id: string;
  userId: string;
  date: string;
  status: 'draft' | 'in_review' | 'complete';
  initialMessage: string | null;
  chatSession: ChatMessage[] | null;
  summary: string | null;
  title: string | null;
  synopsis: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayJournalResponse {
  exists: boolean;
  journal?: JournalResponse;
  status?: 'draft' | 'in_review' | 'complete';
  actionText?: string; // "Write Journal" | "Continue Writing" | "Resume Reflection" | "View Entry"
}
