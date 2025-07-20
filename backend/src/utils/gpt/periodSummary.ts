import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { getUserContext, formatUserContextForPrompt, type ComprehensiveUserContext } from '../userContextService';
import type { journals } from '../../db/schema/journals';

/**
 * Interface for period summary generation result
 */
export interface PeriodSummaryResult {
  summary: string;
  tags: string[];
}

/**
 * System prompt for generating period summaries
 */
function createPeriodSummarySystemPrompt(userContext: ComprehensiveUserContext, period: 'week' | 'month'): string {
  return `You are a thoughtful journal curator helping ${userContext.name} understand patterns and themes across their ${period}.

Your task is to create a cohesive narrative summary of their journal entries from this ${period}. This summary will be used to provide context for future journal conversations.

## User Context
${formatUserContextForPrompt(userContext)}

## Instructions

1. **Create a flowing narrative summary** that captures:
   - Major themes and patterns
   - Emotional arcs and moods
   - Significant events and experiences
   - Growth areas and insights
   - Challenges and wins

2. **Extract meaningful tags** (3-8 tags) that represent:
   - Key topics that came up frequently
   - Emotional themes
   - Activities or life areas that were prominent
   - Relationship dynamics
   - Personal growth areas

3. **Style guidelines:**
   - Write in first person from the user's perspective
   - Maintain a warm, observational tone
   - Connect themes across different entries
   - Be specific enough to trigger memories but concise
   - Length: 2-4 paragraphs for weeks, 3-6 paragraphs for months

4. **Format your response as JSON:**
\`\`\`json
{
  "summary": "Your narrative summary here...",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}
\`\`\`

Focus on patterns and themes rather than day-by-day recaps. This summary should help provide rich context for future journal conversations. Markdown is supported.`;
}

/**
 * Generate a summary for a week or month based on journal entries
 */
export async function generatePeriodSummary(
  journalEntries: (typeof journals.$inferSelect)[],
  period: 'week' | 'month',
  userId: string,
): Promise<PeriodSummaryResult> {
  // Get user context for personalized summary generation
  const userContext = await getUserContext(userId, {
    includeCharacter: true,
    includeActiveGoals: true,
    includeFamilyMembers: true,
    includeCharacterStats: true,
    includeExistingTags: false, // We'll generate fresh tags
  });

  // Create the system prompt
  const systemPrompt = createPeriodSummarySystemPrompt(userContext, period);

  // Prepare the messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add journal entries as context
  let journalContent = `Here are the journal entries from this ${period}:\n\n`;

  journalEntries.forEach((journal, index) => {
    journalContent += `**${journal.date}**\n`;

    // Since summary is AI generated, only use initialMessage for user's original voice
    if (journal.initialMessage) {
      journalContent += `Content: ${journal.initialMessage}\n`;
    }

    journalContent += '\n---\n\n';
  });

  messages.push({
    role: 'user',
    content: journalContent,
  });

  messages.push({
    role: 'user',
    content: `Please generate a ${period}ly summary based on these journal entries. Return only the JSON response as specified.`,
  });

  const response = await callGptApi({
    messages,
    temperature: 0.7, // Balanced creativity for narrative flow
  });

  try {
    let responseContent = response.content.trim();

    // Handle code block formatting
    if (responseContent.startsWith('```json')) {
      responseContent = responseContent
        .replace(/```json/, '')
        .replace(/```/, '')
        .trim();
    }

    const result = JSON.parse(responseContent);

    // Validate the response structure
    if (!result.summary || !Array.isArray(result.tags)) {
      throw new Error('Invalid response format from GPT');
    }

    return {
      summary: result.summary,
      tags: result.tags,
    };
  } catch (error) {
    throw new Error(`Failed to parse GPT period summary response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to calculate week boundaries (Saturday to Friday)
 */
export function getWeekBoundaries(date: Date): { startDate: string; endDate: string } {
  const inputDate = new Date(date);

  // Find the Saturday that starts this week
  const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 6 = Saturday
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Saturday = 0 days back

  const saturday = new Date(inputDate);
  saturday.setDate(inputDate.getDate() - daysToSubtract);

  // Friday is 6 days after Saturday
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);

  return {
    startDate: saturday.toISOString().split('T')[0], // YYYY-MM-DD
    endDate: friday.toISOString().split('T')[0], // YYYY-MM-DD
  };
}

/**
 * Helper function to calculate month boundaries
 */
export function getMonthBoundaries(date: Date): { startDate: string; endDate: string } {
  const inputDate = new Date(date);

  const firstDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
  const lastDay = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);

  return {
    startDate: firstDay.toISOString().split('T')[0], // YYYY-MM-DD
    endDate: lastDay.toISOString().split('T')[0], // YYYY-MM-DD
  };
}
