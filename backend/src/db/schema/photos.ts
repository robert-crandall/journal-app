import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { journals } from './journals';
import { measurements } from './measurements';

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Link to either journal or measurement
  linkedType: varchar('linked_type', { length: 20 }).notNull(), // 'journal' | 'measurement'
  journalId: uuid('journal_id').references(() => journals.id, { onDelete: 'cascade' }),
  measurementId: uuid('measurement_id').references(() => measurements.id, { onDelete: 'cascade' }),
  
  // File paths
  filePath: text('file_path').notNull(), // Path to original image
  thumbnailPath: text('thumbnail_path').notNull(), // Path to thumbnail
  
  // Metadata
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: varchar('file_size', { length: 50 }).notNull(), // Store as string to handle large files
  
  // Optional caption
  caption: text('caption'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
