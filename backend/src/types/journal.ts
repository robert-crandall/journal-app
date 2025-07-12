import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { journalEntries, journalConversationMessages, journalEntryTags, journalEntryStatTags, journalSessions } from '../db/schema/journal';

// Basic types
export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type NewJournalEntry = InferInsertModel<typeof journalEntries>;

export type JournalConversationMessage = InferSelectModel<typeof journalConversationMessages>;
export type NewJournalConversationMessage = InferInsertModel<typeof journalConversationMessages>;

export type JournalEntryTag = InferSelectModel<typeof journalEntryTags>;
export type NewJournalEntryTag = InferInsertModel<typeof journalEntryTags>;

export type JournalEntryStatTag = InferSelectModel<typeof journalEntryStatTags>;
export type NewJournalEntryStatTag = InferInsertModel<typeof journalEntryStatTags>;

export type JournalSession = InferSelectModel<typeof journalSessions>;
export type NewJournalSession = InferInsertModel<typeof journalSessions>;

// API request/response types
export interface StartJournalSessionRequest {
  // No initial data needed - session starts empty
}

export interface StartJournalSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    message: string; // Welcome message from GPT
  };
}

export interface SendJournalMessageRequest {
  sessionId: string;
  message: string;
}

export interface SendJournalMessageResponse {
  success: boolean;
  data: {
    response: string; // GPT's response
    shouldOfferSave: boolean; // True if GPT thinks it's time to save
    conversationLength: number; // Number of user messages so far
  };
}

export interface SaveJournalEntryRequest {
  sessionId: string;
}

export interface SaveJournalEntryResponse {
  success: boolean;
  data: {
    entryId: string;
    title: string;
    synopsis: string;
    summary: string;
    tags: string[]; // Tag names
    statTags: string[]; // Stat names
    familyTags: string[]; // Family member names
  };
}

export interface GetJournalEntriesResponse {
  success: boolean;
  data: JournalEntryWithDetails[];
}

export interface JournalEntryWithDetails extends JournalEntry {
  messages: JournalConversationMessage[];
  tags: { id: string; name: string }[];
  statTags: { id: string; name: string }[];
}

// Chat message type for session storage
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
