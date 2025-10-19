import { db } from '../db';
import { dailyQuestions } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { callGptApi } from './gpt/client';
import { getUserContext, formatUserContextForPrompt } from './userContextService';
import { getJournalMemoryContext } from './journalMemoryService';
import type { DailyQuestion, NewDailyQuestion } from '../db/schema/daily-questions';

/**
 * Service for managing daily questions that provide personalized, contextual check-ins
 */

/**
 * Generate a personalized daily question based on recent journal entries and user context
 */
async function generateDailyQuestion(userId: string, date: string): Promise<{ questionText: string; contextSource: string }> {
  try {
    // Get user context and journal memory
    const [userContext, journalMemory] = await Promise.all([
      getUserContext(userId, {
        includeCharacter: true,
        includeActiveGoals: true,
        includeFamilyMembers: true,
        includeCharacterStats: true,
      }),
      getJournalMemoryContext(userId),
    ]);

    // Prepare context for LLM
    const userContextPrompt = formatUserContextForPrompt(userContext);

    // Extract recent journal themes
    const recentEntries = journalMemory.dailyJournals
      .slice(-5) // Last 5 entries
      .map((entry) => `${entry.date}: ${entry.initialMessage}`)
      .join('\n');

    const systemPrompt = `You are a thoughtful friend who asks one meaningful check-in question each day. 

${userContextPrompt}

## Recent Journal Entries
${recentEntries}

Generate ONE emotionally intelligent question that:
1. Shows you remember what happened recently
2. Feels like a friend checking in (not a therapist or data collector)
3. Is specific to their context (not generic)
4. Encourages storytelling and reflection
5. Is warm, curious, and conversational

Examples of good questions:
- "You mentioned feeling energized after that family dinner - how did last night go?"
- "I noticed you've been working on your morning routine - how's it feeling this week?"
- "You seemed excited about that creative project you started - what's been happening with it?"

Respond with ONLY the question text, nothing else.`;

    const response = await callGptApi({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a personalized daily question for ${date}` },
      ],
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
    });

    const questionText = response.content?.trim() || 'How are you feeling today?';

    // Create context source summary
    const themes = recentEntries ? 'Recent themes: ' + recentEntries.split('\n').slice(0, 2).join('; ') : 'No recent entries available';

    return {
      questionText,
      contextSource: themes,
    };
  } catch (error) {
    console.error('Error generating daily question:', error);
    // Fallback to a generic but friendly question
    return {
      questionText: 'How are you feeling today?',
      contextSource: 'Fallback question due to generation error',
    };
  }
}

/**
 * Get or create today's daily question for a user
 */
export async function getTodaysDailyQuestion(userId: string, date?: string): Promise<DailyQuestion | null> {
  const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    // Check if question already exists for today
    const existingQuestion = await db
      .select()
      .from(dailyQuestions)
      .where(and(eq(dailyQuestions.userId, userId), eq(dailyQuestions.dateAssigned, targetDate)))
      .limit(1);

    if (existingQuestion.length > 0) {
      return existingQuestion[0];
    }

    // Generate new question
    const { questionText, contextSource } = await generateDailyQuestion(userId, targetDate);

    // Store the question
    const newQuestion: NewDailyQuestion = {
      userId,
      questionText,
      dateAssigned: targetDate,
      answered: false,
      contextSource,
    };

    const createdQuestions = await db.insert(dailyQuestions).values(newQuestion).returning();

    return createdQuestions[0] || null;
  } catch (error) {
    console.error("Error getting today's daily question:", error);
    return null;
  }
}

/**
 * Mark a daily question as answered
 */
export async function markQuestionAsAnswered(questionId: string, userId: string): Promise<boolean> {
  try {
    const result = await db
      .update(dailyQuestions)
      .set({
        answered: true,
        updatedAt: new Date(),
      })
      .where(and(eq(dailyQuestions.id, questionId), eq(dailyQuestions.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Error marking question as answered:', error);
    return false;
  }
}

/**
 * Get a specific daily question by ID
 */
export async function getDailyQuestionById(questionId: string, userId: string): Promise<DailyQuestion | null> {
  try {
    const question = await db
      .select()
      .from(dailyQuestions)
      .where(and(eq(dailyQuestions.id, questionId), eq(dailyQuestions.userId, userId)))
      .limit(1);

    return question[0] || null;
  } catch (error) {
    console.error('Error getting daily question by ID:', error);
    return null;
  }
}

/**
 * Get recent daily questions for a user (for debugging/admin purposes)
 */
export async function getRecentDailyQuestions(userId: string, limit: number = 10): Promise<DailyQuestion[]> {
  try {
    const questions = await db.select().from(dailyQuestions).where(eq(dailyQuestions.userId, userId)).orderBy(desc(dailyQuestions.dateAssigned)).limit(limit);

    return questions;
  } catch (error) {
    console.error('Error getting recent daily questions:', error);
    return [];
  }
}
