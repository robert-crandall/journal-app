import { db } from '../db';
import { journals, journalSummaries } from '../db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import type { ChatMessage } from './gpt/conversationalJournal';

/**
 * Enhanced context for journal conversations with layered memory
 */
export interface JournalMemoryContext {
  dailyJournals: DailyJournalEntry[];
  weeklySummaries: WeeklySummary[];
  monthlySummaries: MonthlySummary[];
}

export interface DailyJournalEntry {
  date: string;
  initialMessage: string;
  assistantReply?: string; // Only for most recent 3-5 entries
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  summary: string;
}

export interface MonthlySummary {
  startDate: string;
  endDate: string;
  summary: string;
}

/**
 * Get enhanced journal memory context for GPT conversations
 * This provides layered context including recent daily journals, weekly summaries, and monthly summaries
 */
export async function getJournalMemoryContext(userId: string): Promise<JournalMemoryContext> {
  try {
    // 1. Get the most recent weekly summary to determine daily journal cutoff
    const latestWeeklySummary = await db
      .select()
      .from(journalSummaries)
      .where(and(eq(journalSummaries.userId, userId), eq(journalSummaries.period, 'week')))
      .orderBy(desc(journalSummaries.endDate))
      .limit(1);

    // Determine the start date for daily journals
    // If we have a weekly summary, start from the day after it ends
    // Otherwise, get the last 14 days
    let dailyStartDate: string;
    const today = new Date();
    
    if (latestWeeklySummary.length > 0) {
      const summaryEndDate = new Date(latestWeeklySummary[0].endDate);
      summaryEndDate.setDate(summaryEndDate.getDate() + 1); // Day after summary ends
      dailyStartDate = summaryEndDate.toISOString().split('T')[0];
    } else {
      // Get last 14 days if no weekly summary exists
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      dailyStartDate = fourteenDaysAgo.toISOString().split('T')[0];
    }

    const todayString = today.toISOString().split('T')[0];

    // 2. Get daily journals (7-14 days worth after the last weekly summary)
    const dailyJournals = await db
      .select({
        date: journals.date,
        initialMessage: journals.initialMessage,
        chatSession: journals.chatSession,
        status: journals.status,
      })
      .from(journals)
      .where(
        and(
          eq(journals.userId, userId),
          gte(journals.date, dailyStartDate),
          lte(journals.date, todayString),
          eq(journals.status, 'complete') // Only completed journals
        )
      )
      .orderBy(desc(journals.date))
      .limit(14); // Maximum 14 days

    // Process daily journals with selective assistant replies
    const processedDailyJournals: DailyJournalEntry[] = dailyJournals.map((journal, index) => {
      const entry: DailyJournalEntry = {
        date: journal.date,
        initialMessage: journal.initialMessage || '',
      };

      // Include assistant replies only for the most recent 3-5 entries
      if (index < 5 && journal.chatSession) {
        const chatSession = journal.chatSession as ChatMessage[];
        // Find the first assistant reply (usually the second message)
        const assistantReply = chatSession.find(msg => msg.role === 'assistant');
        if (assistantReply) {
          entry.assistantReply = assistantReply.content;
        }
      }

      return entry;
    });

    // 3. Get weekly summaries (up to 3, excluding any that overlap with daily journals)
    const weeklySummaries = await db
      .select({
        startDate: journalSummaries.startDate,
        endDate: journalSummaries.endDate,
        summary: journalSummaries.summary,
      })
      .from(journalSummaries)
      .where(
        and(
          eq(journalSummaries.userId, userId),
          eq(journalSummaries.period, 'week'),
          lte(journalSummaries.endDate, dailyStartDate) // Only summaries that end before daily journal period
        )
      )
      .orderBy(desc(journalSummaries.endDate))
      .limit(3);

    // 4. Get monthly summaries (up to 2, that are older than weekly summaries)
    let monthlyStartCutoff = dailyStartDate;
    if (weeklySummaries.length > 0) {
      // Use the start date of the oldest weekly summary as cutoff
      const oldestWeeklySummary = weeklySummaries[weeklySummaries.length - 1];
      monthlyStartCutoff = oldestWeeklySummary.startDate;
    }

    const monthlySummaries = await db
      .select({
        startDate: journalSummaries.startDate,
        endDate: journalSummaries.endDate,
        summary: journalSummaries.summary,
      })
      .from(journalSummaries)
      .where(
        and(
          eq(journalSummaries.userId, userId),
          eq(journalSummaries.period, 'month'),
          lte(journalSummaries.endDate, monthlyStartCutoff) // Only summaries that end before weekly/daily period
        )
      )
      .orderBy(desc(journalSummaries.endDate))
      .limit(2);

    return {
      dailyJournals: processedDailyJournals,
      weeklySummaries: weeklySummaries.map(summary => ({
        startDate: summary.startDate,
        endDate: summary.endDate,
        summary: summary.summary,
      })),
      monthlySummaries: monthlySummaries.map(summary => ({
        startDate: summary.startDate,
        endDate: summary.endDate,
        summary: summary.summary,
      })),
    };
  } catch (error) {
    console.error('Error fetching journal memory context:', error);
    // Return empty context on error
    return {
      dailyJournals: [],
      weeklySummaries: [],
      monthlySummaries: [],
    };
  }
}

/**
 * Format journal memory context for user messages in GPT conversations
 */
export function formatJournalMemoryForPrompt(memoryContext: JournalMemoryContext): string {
  let promptContent = '';

  // Monthly summaries first (oldest to newest for chronological flow)
  if (memoryContext.monthlySummaries.length > 0) {
    promptContent += `**Monthly Context:**\n\n`;
    memoryContext.monthlySummaries.reverse().forEach(summary => {
      const startDate = new Date(summary.startDate);
      const monthYear = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      promptContent += `📆 **${monthYear}**\n`;
      promptContent += `${summary.summary}\n\n`;
    });
  }

  // Weekly summaries (oldest to newest for chronological flow)
  if (memoryContext.weeklySummaries.length > 0) {
    promptContent += `**Weekly Context:**\n\n`;
    memoryContext.weeklySummaries.reverse().forEach(summary => {
      const startDate = new Date(summary.startDate);
      const endDate = new Date(summary.endDate);
      const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      promptContent += `📅 **${dateRange}**\n`;
      promptContent += `${summary.summary}\n\n`;
    });
  }

  // Daily journals (most recent first)
  if (memoryContext.dailyJournals.length > 0) {
    promptContent += `**Recent Daily Journals:**\n\n`;
    memoryContext.dailyJournals.forEach(entry => {
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      promptContent += `🗓️ **${formattedDate}**\n`;
      promptContent += `"${entry.initialMessage}"\n`;
      
      if (entry.assistantReply) {
        promptContent += `*Response: "${entry.assistantReply}"*\n`;
      }
      
      promptContent += `\n`;
    });
  }

  return promptContent;
}
