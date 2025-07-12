import { pgTable, uuid, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tags } from './tags';
import { characterStats } from './stats';

// Journal entries table - stores completed journal sessions
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  synopsis: text('synopsis').notNull(), // 1-2 sentence snapshot
  summary: text('summary').notNull(), // Narrative-style summary in user's tone
  content: text('content'), // Long-form content for hybrid journal mode
  reflected: jsonb('reflected').$type<boolean>().default(false).notNull(), // Whether the user has initiated chat/reflection mode
  startedAsChat: jsonb('started_as_chat').$type<boolean>().default(true).notNull(), // Whether entry was started in chat mode (true) or long-form mode (false)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Journal conversation messages - stores the actual chat conversation
export const journalConversationMessages = pgTable('journal_conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  messageOrder: integer('message_order').notNull(), // Order of messages in conversation
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Junction table for journal entries to tags relationships
export const journalEntryTags = pgTable('journal_entry_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Junction table for journal entries to character stats relationships (for stat tags)
export const journalEntryStatTags = pgTable('journal_entry_stat_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  statId: uuid('stat_id')
    .notNull()
    .references(() => characterStats.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Journal sessions table - tracks active/incomplete journal sessions
export const journalSessions = pgTable('journal_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Store conversation state as JSON
  messages: jsonb('messages')
    .$type<
      Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>
    >()
    .default([]),
  isActive: jsonb('is_active').$type<boolean>().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
