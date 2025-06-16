import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { journalEntries } from '../db/schema';
import { CreateJournalEntryInput, UpdateJournalEntryInput } from '../lib/validation';

export class JournalService {
  /**
   * Create a new journal entry for a user
   */
  static async createJournalEntry(userId: string, input: CreateJournalEntryInput) {
    const [entry] = await db.insert(journalEntries).values({
      userId,
      title: input.title || null,
      content: input.content,
    }).returning();

    return entry;
  }

  /**
   * Get all journal entries for a user
   */
  static async getUserJournalEntries(userId: string, options?: {
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) {
    const { sortOrder = 'desc', limit, offset = 0 } = options || {};

    const sortFunction = sortOrder === 'asc' ? asc : desc;
    
    const baseQuery = db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(sortFunction(journalEntries.createdAt))
      .offset(offset);

    const entries = limit 
      ? await baseQuery.limit(limit)
      : await baseQuery;
    
    return entries;
  }

  /**
   * Get recent journal entries for dashboard
   */
  static async getRecentJournalEntries(userId: string, limit: number = 5) {
    const entries = await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit);

    return entries;
  }

  /**
   * Get a specific journal entry by ID (must belong to user)
   */
  static async getJournalEntryById(entryId: string, userId: string) {
    const [entry] = await db.select().from(journalEntries)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .limit(1);

    return entry || null;
  }

  /**
   * Update a journal entry
   */
  static async updateJournalEntry(entryId: string, userId: string, input: UpdateJournalEntryInput) {
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    
    updateData.updatedAt = new Date();

    const [updatedEntry] = await db.update(journalEntries)
      .set(updateData)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .returning();

    return updatedEntry || null;
  }

  /**
   * Delete a journal entry
   */
  static async deleteJournalEntry(entryId: string, userId: string) {
    const [deletedEntry] = await db.delete(journalEntries)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .returning();

    return deletedEntry || null;
  }

  /**
   * Get journal entry statistics for a user
   */
  static async getJournalStats(userId: string) {
    const allEntries = await this.getUserJournalEntries(userId);
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const thisWeekEntries = allEntries.filter(entry => 
      new Date(entry.createdAt) >= startOfWeek
    );
    
    const thisMonthEntries = allEntries.filter(entry => 
      new Date(entry.createdAt) >= startOfMonth
    );

    return {
      total: allEntries.length,
      thisWeek: thisWeekEntries.length,
      thisMonth: thisMonthEntries.length,
    };
  }
}
