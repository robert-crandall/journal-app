import { journals, journalContentTags, journalToneTags, journalStatTags } from '../db/schema/journals';
import type { User } from './users';

// Base Journal Types
export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;
export type JournalUpdate = Partial<Omit<NewJournal, 'id' | 'userId' | 'createdAt'>>;

// Journal Content Tags
export type JournalContentTag = typeof journalContentTags.$inferSelect;
export type NewJournalContentTag = typeof journalContentTags.$inferInsert;

// Journal Tone Tags
export type JournalToneTag = typeof journalToneTags.$inferSelect;
export type NewJournalToneTag = typeof journalToneTags.$inferInsert;

// Journal Stat Tags
export type JournalStatTag = typeof journalStatTags.$inferSelect;
export type NewJournalStatTag = typeof journalStatTags.$inferInsert;

// API Request and Response Types
export interface CreateJournalRequest {
  content: string;
  journalDate: string; // ISO date string YYYY-MM-DD
}

export interface UpdateJournalRequest {
  content?: string;
  journalDate?: string; // ISO date string YYYY-MM-DD
}

export interface FinalizeJournalRequest {
  id: string;
}

// Journal with its associated tags
export interface JournalWithTags extends Journal {
  contentTags: string[];
  toneTags: string[];
  statTags: Array<{ statId: string; xpAmount: number }>;
}

// Journal with user info
export interface JournalWithUser extends Journal {
  user: User;
}

// Full journal with all related data
export interface FullJournal extends Journal {
  contentTags: string[];
  toneTags: string[];
  statTags: Array<{ statId: string; xpAmount: number }>;
  user: User;
}
