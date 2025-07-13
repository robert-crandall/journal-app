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
  toneTags?: string[];
  contentTags?: string[];
  statTags?: string[];
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
  toneTags: string[] | null;
  contentTags: string[] | null;
  statTags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayJournalResponse {
  exists: boolean;
  journal?: JournalResponse;
  status?: 'draft' | 'in_review' | 'complete';
  actionText?: string; // "Write Journal" | "Continue Writing" | "Resume Reflection" | "View Entry"
}
