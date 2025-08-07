import { pgTable, uuid, varchar, timestamp, text, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: text('avatar'), // Base64 encoded image data
  gptTone: varchar('gpt_tone', { length: 20 }).notNull().default('friendly'), // GPT tone preference
  heightCm: real('height_cm'), // Optional, used for body fat calculations only
  sex: varchar('sex', { length: 10 }), // Optional, used for body fat calculations only ('male' or 'female')
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
