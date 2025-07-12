import { sql } from 'drizzle-orm';
import { pgTable, text, boolean } from 'drizzle-orm/pg-core';

export async function up(db) {
  // Add content column to journal_entries table
  await db.schema.alterTable('journal_entries').addColumn('content', text('content')).execute();
  
  // Add column to track if entry has been reflected on (chat mode activated)
  await db.schema.alterTable('journal_entries').addColumn('reflected', boolean('reflected').default(false).notNull()).execute();
  
  // Add column to track if entry was created directly in chat mode or via long-form first
  await db.schema.alterTable('journal_entries').addColumn('started_as_chat', boolean('started_as_chat').default(true).notNull()).execute();
}

export async function down(db) {
  await db.schema.alterTable('journal_entries').dropColumn('content').execute();
  await db.schema.alterTable('journal_entries').dropColumn('reflected').execute();
  await db.schema.alterTable('journal_entries').dropColumn('started_as_chat').execute();
}
