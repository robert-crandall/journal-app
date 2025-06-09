import { pgTable, text, date, timestamp, integer, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table (no longer includes family members)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  password: text('password'),
  name: text('name').notNull(),
  gptContext: jsonb('gpt_context'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Separate family table
export const family = pgTable('family', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Who's family it is
  name: text('name').notNull(),
  age: integer('age'),
  className: text('class_name'), // Keep existing className field name for compatibility
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Attributes for both users and family members using polymorphic relationship
export const attributes = pgTable('attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type', { enum: ['user', 'family'] }).notNull(),
  entityId: uuid('entity_id').notNull(), // References either users.id or family.id
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Character stats for personal growth tracking
export const stats = pgTable('stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  category: text('category', { enum: ['body', 'mind', 'connection', 'shadow', 'spirit', 'legacy'] }),
  enabled: boolean('enabled').notNull().default(true),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  dayOfWeek: text('day_of_week', { enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }),
  sampleTasks: jsonb('sample_tasks').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Ad Hoc Tasks Library - user-defined reusable tasks
export const adhocTasks = pgTable('adhoc_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  linkedStatId: uuid('linked_stat_id').references(() => stats.id, { onDelete: 'set null' }).notNull(),
  xpValue: integer('xp_value').notNull().default(25),
  iconId: text('icon_id'),
  category: text('category', { enum: ['body', 'mind', 'connection', 'shadow', 'spirit', 'legacy'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  statId: uuid('stat_id').references(() => stats.id, { onDelete: 'set null' }),
  potionId: uuid('potion_id'), // Links to active potion for A/B testing (no FK constraint as potions can be deleted)
  adhocTaskId: uuid('adhoc_task_id').references(() => adhocTasks.id, { onDelete: 'set null' }), // Links to ad hoc task if created from library
  familyId: uuid('family_id').references(() => family.id, { onDelete: 'set null' }), // Link to specific family member
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  taskDate: date('task_date'), // Date when task was assigned (for daily tasks)
  source: text('source', { enum: ['primary', 'connection'] }), // GPT task type
  linkedStatIds: jsonb('linked_stat_ids').$type<string[]>(), // Multiple stats for XP
  origin: text('origin', { enum: ['user', 'gpt', 'system', 'adhoc'] }).notNull().default('user'),
  status: text('status', { enum: ['pending', 'complete', 'skipped', 'failed'] }).notNull().default('pending'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  feedback: text('feedback'), // User feedback on task completion
  emotionTag: text('emotion_tag'), // User emotion after task completion
  moodScore: integer('mood_score'), // Optional 1-5 mood/energy rating for A/B testing
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Journal entries with threading support
export const journals = pgTable('journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  potionId: uuid('potion_id'), // Links to active potion for A/B testing (no FK constraint as potions can be deleted)
  content: text('content').notNull(),
  title: text('title'), // GPT-generated title for the journal entry
  gptSummary: text('gpt_summary'), // GPT-generated narrative-style summary
  condensed: text('condensed'), // GPT-generated brief synopsis (1-2 sentences)
  sentimentScore: integer('sentiment_score'), // 1-5 sentiment rating from GPT analysis
  moodTags: jsonb('mood_tags').$type<string[]>(), // GPT-extracted mood tags (e.g., "calm", "anxious", "energized")
  tags: jsonb('tags').$type<string[]>(), // Keep for backward compatibility
  date: date('date').notNull().defaultNow(),
  // New fields for conversation threading
  status: text('status', { enum: ['draft', 'in_progress', 'completed'] }).notNull().default('draft'),
  conversationHistory: jsonb('conversation_history').$type<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>().default([]),
  followupCount: integer('followup_count').notNull().default(0),
  maxFollowups: integer('max_followups').notNull().default(3),
  // Remember day prompt fields
  dayMemory: text('day_memory'), // What the user wants to remember from the day
  dayRating: integer('day_rating'), // 1-5 rating of the day (energy, mood, productivity)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tags table for structured tag management
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tag associations for journals and tasks
export const tagAssociations = pgTable('tag_associations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  entityType: text('entity_type', { enum: ['journal', 'task'] }).notNull(),
  entityId: uuid('entity_id').notNull(), // References either journals.id or tasks.id
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// A/B Testing Potions
export const potions = pgTable('potions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  hypothesis: text('hypothesis'),
  startDate: date('start_date',).notNull(),
  endDate: date('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  gptAnalysis: text('gpt_analysis'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sessions for authentication
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// User preferences - one column per preference for structured storage
export const preferences = pgTable('preferences', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  theme: text('theme').notNull().default('light'),
  locationDescription: text('location_description'), // e.g., "Seattle area"
  zipCode: text('zip_code'), // for weather API calls
  rpgFlavorEnabled: boolean('rpg_flavor_enabled').notNull().default(false), // Enable RPG flavor in task descriptions
  timezone: text('timezone'), // IANA timezone identifier, e.g., "America/New_York"
  // Future preferences can be added as new columns:
  // language: text('language').default('en'),
  // notifications: boolean('notifications').default(true'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  familyMembers: many(family),
  stats: many(stats),
  tasks: many(tasks, { relationName: "user" }),
  adhocTasks: many(adhocTasks),
  journals: many(journals),
  tags: many(tags),
  potions: many(potions),
  sessions: many(sessions),
  preferences: one(preferences, { fields: [users.id], references: [preferences.userId] }),
}));

export const familyRelations = relations(family, ({ one, many }) => ({
  user: one(users, { fields: [family.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const attributesRelations = relations(attributes, ({ one }) => ({
  // Note: Polymorphic relations are handled manually in queries
}));

export const statsRelations = relations(stats, ({ one, many }) => ({
  user: one(users, { fields: [stats.userId], references: [users.id] }),
  tasks: many(tasks),
  adhocTasks: many(adhocTasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id], relationName: "user" }),
  stat: one(stats, { fields: [tasks.statId], references: [stats.id] }),
  adhocTask: one(adhocTasks, { fields: [tasks.adhocTaskId], references: [adhocTasks.id] }),
  family: one(family, { fields: [tasks.familyId], references: [family.id] }),
}));

export const adhocTasksRelations = relations(adhocTasks, ({ one, many }) => ({
  user: one(users, { fields: [adhocTasks.userId], references: [users.id] }),
  linkedStat: one(stats, { fields: [adhocTasks.linkedStatId], references: [stats.id] }),
  tasks: many(tasks),
}));

export const journalsRelations = relations(journals, ({ one }) => ({
  user: one(users, { fields: [journals.userId], references: [users.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  associations: many(tagAssociations),
}));

export const tagAssociationsRelations = relations(tagAssociations, ({ one }) => ({
  tag: one(tags, { fields: [tagAssociations.tagId], references: [tags.id] }),
}));

export const potionsRelations = relations(potions, ({ one }) => ({
  user: one(users, { fields: [potions.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, { fields: [preferences.userId], references: [users.id] }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertFamilySchema = createInsertSchema(family);
export const selectFamilySchema = createSelectSchema(family);
export const insertAttributeSchema = createInsertSchema(attributes);
export const selectAttributeSchema = createSelectSchema(attributes);
export const insertStatSchema = createInsertSchema(stats);
export const selectStatSchema = createSelectSchema(stats);
export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);
export const insertAdhocTaskSchema = createInsertSchema(adhocTasks);
export const selectAdhocTaskSchema = createSelectSchema(adhocTasks);
export const insertJournalSchema = createInsertSchema(journals);
export const selectJournalSchema = createSelectSchema(journals);
export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);
export const insertTagAssociationSchema = createInsertSchema(tagAssociations);
export const selectTagAssociationSchema = createSelectSchema(tagAssociations);
export const insertPotionSchema = createInsertSchema(potions);
export const selectPotionSchema = createSelectSchema(potions);
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const insertPreferenceSchema = createInsertSchema(preferences);
export const selectPreferenceSchema = createSelectSchema(preferences);

// Custom validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  taskDate: z.string().datetime().optional(),
  source: z.enum(['primary', 'connection']).optional(),
  linkedStatIds: z.array(z.string().uuid()).optional(),
  familyId: z.string().uuid().optional(),
  statId: z.string().uuid().optional(),
});

export const createAdhocTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  linkedStatId: z.string().uuid(),
  xpValue: z.number().int().min(1).max(100).default(25),
  iconId: z.string().optional(),
  category: z.enum(['body', 'mind', 'connection', 'shadow', 'spirit', 'legacy']),
});

export const updateAdhocTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  linkedStatId: z.string().uuid().optional(),
  xpValue: z.number().int().min(1).max(100).optional(),
  iconId: z.string().optional(),
  category: z.enum(['body', 'mind', 'connection', 'shadow', 'spirit', 'legacy']).optional(),
});

export const executeAdhocTaskSchema = z.object({
  feedback: z.string().optional(),
  emotionTag: z.string().optional(),
  moodScore: z.number().int().min(1).max(5).optional(),
});

export const completeTaskSchema = z.object({
  status: z.enum(['complete', 'skipped', 'failed']),
  feedback: z.string().optional(),
  emotionTag: z.string().optional(),
  moodScore: z.number().int().min(1).max(5).optional(), // Optional 1-5 mood rating
});

export const createJournalSchema = z.object({
  content: z.string().min(1),
  date: z.string().date().optional(),
});

// New schemas for journal conversation flow
export const startJournalSchema = z.object({
  content: z.string().min(1),
  date: z.string().date().optional(),
});

export const followupResponseSchema = z.object({
  response: z.string().min(1),
});

export const submitJournalSchema = z.object({
  // No additional data needed - journal is submitted as-is
});

export const completeJournalDaySchema = z.object({
  dayMemory: z.string().optional(),
  dayRating: z.number().int().min(1).max(5).optional(),
});

export const createFamilyMemberSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0).optional(),
  className: z.string().optional(),
  description: z.string().optional(),
});

export const createPotionSchema = z.object({
  title: z.string().min(1),
  hypothesis: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
});

export const createAttributeSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const createStatSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['body', 'mind', 'connection', 'shadow', 'spirit', 'legacy']).optional(),
  enabled: z.boolean().optional(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
  sampleTasks: z.array(z.string()).optional(),
});

export const updateStatSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['body', 'mind', 'connection', 'shadow', 'spirit', 'legacy']).optional(),
  enabled: z.boolean().optional(),
  xp: z.number().int().min(0).optional(),
  level: z.number().int().min(1).optional(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
  sampleTasks: z.array(z.string()).optional(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Family = typeof family.$inferSelect;
export type NewFamily = typeof family.$inferInsert;
export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;
export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type AdhocTask = typeof adhocTasks.$inferSelect;
export type NewAdhocTask = typeof adhocTasks.$inferInsert;
export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type TagAssociation = typeof tagAssociations.$inferSelect;
export type NewTagAssociation = typeof tagAssociations.$inferInsert;
export type Potion = typeof potions.$inferSelect;
export type NewPotion = typeof potions.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Preference = typeof preferences.$inferSelect;
export type NewPreference = typeof preferences.$inferInsert;
