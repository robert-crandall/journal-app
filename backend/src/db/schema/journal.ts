import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { quests } from './quests';

// Journal entries table - conversational journaling with GPT analysis
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Entry content
  title: varchar('title', { length: 255 }), // GPT-generated 6-10 word title
  rawContent: text('raw_content').notNull(), // Full conversation as text
  conversationHistory: jsonb('conversation_history').$type<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>>().default([]), // Structured conversation for replay
  
  // GPT analysis results
  summary: text('summary'), // GPT-generated stitched narrative
  synopsis: text('synopsis'), // GPT-generated 1-2 sentence recap
  
  // Tags extracted by GPT
  contentTags: jsonb('content_tags').$type<string[]>().default([]), // Topics like "relationship", "nature"
  moodTags: jsonb('mood_tags').$type<string[]>().default([]), // Moods like "calm", "overwhelmed"
  statTags: jsonb('stat_tags').$type<string[]>().default([]), // Stats that should receive XP
  
  // Processing status
  isProcessed: boolean('is_processed').default(false).notNull(),
  processedAt: timestamp('processed_at'),
  
  // Optional associations
  questId: uuid('quest_id').references(() => quests.id), // Link to active quest/experiment
  
  // Entry metadata
  entryDate: timestamp('entry_date', { withTimezone: true }).defaultNow().notNull(), // When the journaling happened
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Journal entry XP grants - tracks XP given to stats from journal analysis
export const journalEntryXpGrants = pgTable('journal_entry_xp_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  journalEntryId: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  statName: varchar('stat_name', { length: 100 }).notNull(), // Name of the stat that received XP
  xpAmount: integer('xp_amount').notNull(),
  reason: text('reason'), // GPT-generated reason for the XP grant
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
