import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { characters } from './characters';

export const statGroups = pgTable('stat_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stats = pgTable('stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').references(() => statGroups.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isCustom: boolean('is_custom').default(false).notNull(),
  currentXp: integer('current_xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const statLevelTitles = pgTable('stat_level_titles', {
  id: uuid('id').primaryKey().defaultRandom(),
  statId: uuid('stat_id').notNull().references(() => stats.id, { onDelete: 'cascade' }),
  level: integer('level').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sampleActivities = pgTable('sample_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  statId: uuid('stat_id').notNull().references(() => stats.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  xpValue: integer('xp_value').default(10).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Pre-defined stats templates that can be assigned to characters
export const statTemplates = pgTable('stat_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => statGroups.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  suggestedForClasses: text('suggested_for_classes'), // Comma-separated list of character classes
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
