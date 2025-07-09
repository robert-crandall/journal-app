import type { journalEntries, journalEntryXpGrants } from '../db/schema/journal';

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type JournalEntryUpdate = Partial<Omit<NewJournalEntry, 'id' | 'userId' | 'createdAt'>>;

export type JournalEntryXpGrant = typeof journalEntryXpGrants.$inferSelect;
export type NewJournalEntryXpGrant = typeof journalEntryXpGrants.$inferInsert;

// Conversation message structure
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Request/Response types for API
export interface CreateJournalEntryRequest {
  rawContent: string;
  conversationHistory: ConversationMessage[];
  entryDate?: string; // ISO date string
  questId?: string;
}

export interface UpdateJournalEntryRequest {
  rawContent?: string;
  conversationHistory?: ConversationMessage[];
  questId?: string;
}

export interface ProcessJournalEntryRequest {
  entryId: string;
}

// GPT Analysis results
export interface JournalAnalysisResult {
  title: string;
  summary: string;
  synopsis: string;
  contentTags: string[];
  moodTags: string[];
  statTags: string[];
  xpGrants: Array<{
    statName: string;
    xpAmount: number;
    reason: string;
  }>;
}

// Enhanced types with related data
export interface JournalEntryWithRelations extends JournalEntry {
  quest?: {
    id: string;
    title: string;
    type: string;
  };
  xpGrants?: JournalEntryXpGrant[];
}

export interface JournalEntryListItem {
  id: string;
  title?: string;
  synopsis?: string;
  entryDate: Date;
  isProcessed: boolean;
  contentTags: string[];
  moodTags: string[];
  totalXpGranted?: number;
}

// Quick journal entry for dashboard
export interface QuickJournalRequest {
  content: string;
  questId?: string;
}

// Journal statistics
export interface JournalStats {
  totalEntries: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  totalXpEarned: number;
  topMoods: Array<{ mood: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  streakDays: number;
}
