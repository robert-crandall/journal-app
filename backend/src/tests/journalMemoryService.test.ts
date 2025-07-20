import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, getUniqueEmail, schema } from './setup';
import { getJournalMemoryContext } from '../utils/journalMemoryService';

const { journals, journalSummaries, users } = schema;

describe('Journal Memory Service', () => {
  let userId: string;

  beforeEach(async () => {
    const db = testDb();

    // Create test user
    const user = await db
      .insert(users)
      .values({
        name: 'Test User',
        email: getUniqueEmail('journal-memory'),
        password: 'password',
      })
      .returning();
    userId = user[0].id;
  });

  describe('getJournalMemoryContext', () => {
    it('should return empty context when no data exists', async () => {
      const context = await getJournalMemoryContext(userId);

      expect(context.dailyJournals).toEqual([]);
      expect(context.weeklySummaries).toEqual([]);
      expect(context.monthlySummaries).toEqual([]);
    });

    it('should get daily journals from the last 14 days when no weekly summary exists', async () => {
      const db = testDb();
      const today = new Date();

      // Create daily journals for the last 10 days
      const journalPromises = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        journalPromises.push(
          db.insert(journals).values({
            userId,
            date: dateString,
            status: 'complete',
            initialMessage: `Day ${i} journal entry`,
            chatSession: [
              { role: 'user', content: `Day ${i} journal entry`, timestamp: new Date().toISOString() },
              { role: 'assistant', content: `Day ${i} response`, timestamp: new Date().toISOString() },
            ],
          }),
        );
      }

      await Promise.all(journalPromises);

      const context = await getJournalMemoryContext(userId);

      expect(context.dailyJournals).toHaveLength(10);
      expect(context.dailyJournals[0].initialMessage).toBe('Day 0 journal entry');
      // Most recent 5 should have assistant replies
      expect(context.dailyJournals[0].assistantReply).toBe('Day 0 response');
      expect(context.dailyJournals[4].assistantReply).toBe('Day 4 response');
      // Older ones should not have assistant replies
      expect(context.dailyJournals[5].assistantReply).toBeUndefined();
    });

    it('should start daily journals after the last weekly summary end date and only include summaries older than 7 days', async () => {
      const db = testDb();
      const today = new Date();

      // Create a weekly summary that ended 10 days ago (meets the 7+ day requirement)
      const summaryEndDate = new Date(today);
      summaryEndDate.setDate(summaryEndDate.getDate() - 10);
      const summaryStartDate = new Date(summaryEndDate);
      summaryStartDate.setDate(summaryStartDate.getDate() - 6);

      await db.insert(journalSummaries).values({
        userId,
        period: 'week',
        startDate: summaryStartDate.toISOString().split('T')[0],
        endDate: summaryEndDate.toISOString().split('T')[0],
        summary: 'Valid weekly summary content',
      });

      // Create a weekly summary that ended only 5 days ago (should be excluded)
      const recentSummaryEndDate = new Date(today);
      recentSummaryEndDate.setDate(recentSummaryEndDate.getDate() - 5);
      const recentSummaryStartDate = new Date(recentSummaryEndDate);
      recentSummaryStartDate.setDate(recentSummaryStartDate.getDate() - 6);

      await db.insert(journalSummaries).values({
        userId,
        period: 'week',
        startDate: recentSummaryStartDate.toISOString().split('T')[0],
        endDate: recentSummaryEndDate.toISOString().split('T')[0],
        summary: 'Too recent weekly summary',
      });

      // Create daily journals - some before and some after the valid summary
      const journalPromises = [];
      for (let i = -15; i <= 0; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        journalPromises.push(
          db.insert(journals).values({
            userId,
            date: dateString,
            status: 'complete',
            initialMessage: `Day ${i} journal entry`,
          }),
        );
      }

      await Promise.all(journalPromises);

      const context = await getJournalMemoryContext(userId);

      // Should only include journals after the valid weekly summary end date (last 9 days)
      expect(context.dailyJournals.length).toBeLessThanOrEqual(10);
      // Should only include the weekly summary that ended 7+ days ago
      expect(context.weeklySummaries).toHaveLength(1);
      expect(context.weeklySummaries[0].summary).toBe('Valid weekly summary content');
    });

    it('should include up to 3 weekly summaries that are at least 7 days old', async () => {
      const db = testDb();
      const today = new Date();

      // Create 5 weekly summaries (more than the limit of 3), all at least 7 days old
      const summaryPromises = [];
      for (let i = 0; i < 5; i++) {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - (i * 7 + 8)); // Each week is 7 days apart, starting 8 days ago (meets 7+ requirement)
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        summaryPromises.push(
          db.insert(journalSummaries).values({
            userId,
            period: 'week',
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            summary: `Weekly summary ${i}`,
          }),
        );
      }

      await Promise.all(summaryPromises);

      const context = await getJournalMemoryContext(userId);

      expect(context.weeklySummaries).toHaveLength(3);
      expect(context.weeklySummaries[0].summary).toBe('Weekly summary 0'); // Most recent
    });

    it('should include up to 2 monthly summaries that are older than weekly summaries', async () => {
      const db = testDb();
      const today = new Date();

      // Create weekly summary
      const weeklyEndDate = new Date(today);
      weeklyEndDate.setDate(weeklyEndDate.getDate() - 10);
      const weeklyStartDate = new Date(weeklyEndDate);
      weeklyStartDate.setDate(weeklyStartDate.getDate() - 6);

      await db.insert(journalSummaries).values({
        userId,
        period: 'week',
        startDate: weeklyStartDate.toISOString().split('T')[0],
        endDate: weeklyEndDate.toISOString().split('T')[0],
        summary: 'Weekly summary',
      });

      // Create monthly summaries - some before and after the weekly summary
      const monthlyPromises = [];
      for (let i = 0; i < 4; i++) {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - (i * 30 + 20)); // Each month is 30 days apart, starting 20 days ago
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 29);

        monthlyPromises.push(
          db.insert(journalSummaries).values({
            userId,
            period: 'month',
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            summary: `Monthly summary ${i}`,
          }),
        );
      }

      await Promise.all(monthlyPromises);

      const context = await getJournalMemoryContext(userId);

      expect(context.monthlySummaries).toHaveLength(2);
      expect(context.weeklySummaries).toHaveLength(1);
    });

    it('should only include completed journals', async () => {
      const db = testDb();
      const today = new Date();

      // Create journals with different statuses
      const journalPromises = [];
      const statuses = ['complete', 'draft', 'in_review'];

      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        journalPromises.push(
          db.insert(journals).values({
            userId,
            date: dateString,
            status: statuses[i] as 'complete' | 'draft' | 'in_review',
            initialMessage: `Journal entry ${i}`,
          }),
        );
      }

      await Promise.all(journalPromises);

      const context = await getJournalMemoryContext(userId);

      // Should only include the completed journal
      expect(context.dailyJournals).toHaveLength(1);
      expect(context.dailyJournals[0].initialMessage).toBe('Journal entry 0');
    });
  });
});
