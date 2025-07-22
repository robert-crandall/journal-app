import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { getUserContext, formatUserContextForPrompt, type ComprehensiveUserContext } from '../userContextService';
import type { journals } from '../../db/schema/journals';
import { UserAttributesService } from '../../services/user-attributes';
import type { InferredAttribute, GroupedUserAttributes } from '../../types/user-attributes';

/**
 * Interface for period summary generation result
 */
export interface PeriodSummaryResult {
  summary: string;
  tags: string[];
  attributes: InferredAttribute[];
}

/**
 * System prompt for generating period summaries
 */
function createPeriodSummarySystemPrompt(userContext: ComprehensiveUserContext, period: 'week' | 'month', existingAttributes?: GroupedUserAttributes): string {
  let existingAttributesSection = '';

  if (existingAttributes) {
    const hasExistingAttrs = Object.values(existingAttributes).some((attrs) => attrs && attrs.length > 0);

    if (hasExistingAttrs) {
      existingAttributesSection = '\n\n## Existing User Attributes\nHere are attributes already identified for this user:\n\n';

      Object.entries(existingAttributes).forEach(([category, attrs]) => {
        if (attrs && attrs.length > 0) {
          existingAttributesSection += `**${category.charAt(0).toUpperCase() + category.slice(1)}**: ${attrs.map((attr) => attr.value).join(', ')}\n`;
        }
      });

      existingAttributesSection +=
        '\nWhen extracting new attributes, avoid duplicating these exact values. However, you may identify related or complementary traits that provide additional insight.\n';
    }
  }

  return `You are a thoughtful journal curator helping ${userContext.name} understand patterns and themes across their ${period}.

Your task is to create a cohesive narrative summary of their journal entries from this ${period}. This summary will be used to provide context for future journal conversations.

## User Context
${formatUserContextForPrompt(userContext)}${existingAttributesSection}

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

3. **Infer user attributes** based on patterns across multiple journal entries:
   - **Priorities**: What the user consistently values or focuses on (e.g., "family", "health", "creativity")
   - **Values**: Core beliefs and principles that guide their decisions (e.g., "authenticity", "growth", "balance")
   - **Motivators**: What drives and energizes them (e.g., "accomplishment", "connection", "learning")
   - **Challenges**: Recurring difficulties or obstacles they face (e.g., "time management", "self-doubt", "perfectionism")
   
   Guidelines for attribute extraction:
   - Only extract traits that appear as patterns across multiple entries, not single events
   - Limit to 3-5 attributes per category maximum
   - Use clear, concise terms (1-3 words)
   - Focus on actionable insights that could improve personalization

4. **Style guidelines:**
   - Write in first person from the user's perspective
   - Maintain a warm, observational tone
   - Connect themes across different entries
   - Be specific enough to trigger memories but concise
   - Length: 2-4 paragraphs for weeks, 3-6 paragraphs for months

5. **Format your response as JSON:**
\`\`\`json
{
  "summary": "Your narrative summary here...",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "attributes": [
    { "category": "priorities", "value": "family" },
    { "category": "challenges", "value": "time management" },
    { "category": "motivators", "value": "accomplishment" },
    { "category": "values", "value": "authenticity" }
  ]
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

  // Get existing user attributes to provide context for GPT
  const userAttributesService = new UserAttributesService();
  const existingAttributes = await userAttributesService.getGroupedUserAttributes(userId);

  // Create the system prompt
  const systemPrompt = createPeriodSummarySystemPrompt(userContext, period, existingAttributes);

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

    // Validate attributes if present
    const attributes: InferredAttribute[] = Array.isArray(result.attributes)
      ? result.attributes.filter(
          (attr: any) =>
            attr &&
            typeof attr.category === 'string' &&
            typeof attr.value === 'string' &&
            ['priorities', 'values', 'motivators', 'challenges'].includes(attr.category),
        )
      : [];

    return {
      summary: result.summary,
      tags: result.tags,
      attributes,
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
