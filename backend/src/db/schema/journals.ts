import { pgTable, uuid, varchar, text, timestamp, jsonb, date, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const journals = pgTable('journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  journalDate: date('journal_date').notNull(), // The date this journal is about (1 per day)
  isFinalized: boolean('is_finalized').notNull().default(false),

  // Analysis fields (populated when the journal is finalized and analyzed)
  title: varchar('title', { length: 255 }),
  summary: text('summary'),
  synopsis: varchar('synopsis', { length: 500 }),

  // Metadata about the GPT analysis
  gptRequest: jsonb('gpt_request'),
  gptResponse: jsonb('gpt_response'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
});

// Define tag tables for different tag types
export const journalContentTags = pgTable('journal_content_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalId: uuid('journal_id')
    .notNull()
    .references(() => journals.id),
  tag: varchar('tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const journalToneTags = pgTable('journal_tone_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalId: uuid('journal_id')
    .notNull()
    .references(() => journals.id),
  tag: varchar('tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const journalStatTags = pgTable('journal_stat_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalId: uuid('journal_id')
    .notNull()
    .references(() => journals.id),
  statId: uuid('stat_id').notNull(),
  xpAmount: integer('xp_amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Define relations for journals
export const journalsRelations = relations(journals, ({ one, many }) => ({
  user: one(users, {
    fields: [journals.userId],
    references: [users.id],
  }),
  contentTags: many(journalContentTags),
  toneTags: many(journalToneTags),
  statTags: many(journalStatTags),
}));

// Define relations for content tags
export const journalContentTagsRelations = relations(journalContentTags, ({ one }) => ({
  journal: one(journals, {
    fields: [journalContentTags.journalId],
    references: [journals.id],
  }),
}));

// Define relations for tone tags
export const journalToneTagsRelations = relations(journalToneTags, ({ one }) => ({
  journal: one(journals, {
    fields: [journalToneTags.journalId],
    references: [journals.id],
  }),
}));

// Define relations for stat tags
export const journalStatTagsRelations = relations(journalStatTags, ({ one }) => ({
  journal: one(journals, {
    fields: [journalStatTags.journalId],
    references: [journals.id],
  }),
}));
