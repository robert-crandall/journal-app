import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { getUserContext, formatUserContextForPrompt, type ComprehensiveUserContext } from '../userContextService';
import type { journals } from '../../db/schema/journals';
import type { goals } from '../../db/schema/goals';
import type { AlignedGoal, NeglectedGoal } from '../../../../shared/types/goal-alignment-summaries';

/**
 * Interface for goal alignment summary generation result
 */
export interface GoalAlignmentSummaryResult {
  alignmentScore: number | null;
  alignedGoals: AlignedGoal[];
  neglectedGoals: NeglectedGoal[];
  suggestedNextSteps: string[];
  summary: string;
}

type Goal = typeof goals.$inferSelect;

/**
 * System prompt for generating goal alignment summaries
 */
function createGoalAlignmentSystemPrompt(userContext: ComprehensiveUserContext, userGoals: Goal[], startDate: string, endDate: string): string {
  const goalsList = userGoals.map((goal: Goal) => `- **${goal.title}**: ${goal.description || 'No description'}`).join('\n');

  return `You are an insightful life coach helping ${userContext.name} understand how well their activities aligned with their goals during the period from ${startDate} to ${endDate}.

Your task is to analyze their journal entries and evaluate how well they aligned with their active goals during this period.

## User Context
${formatUserContextForPrompt(userContext)}

## Active Goals to Analyze
${goalsList}

## Instructions

1. **Calculate an overall alignment score (0-100 or null)** based on:
   - Overall progress toward goals (40% weight)
   - Time and energy investment in goal-related activities (30% weight)
   - Mindset and commitment to goals (20% weight)
   - Consistency and intentionality (10% weight)
   - Return null if there's insufficient information to make an assessment

2. **Identify aligned goals** - For each goal that received attention:
   - Provide specific evidence from journal entries
   - Include quotes or excerpts that show progress/effort
   - Focus on concrete actions and behaviors

3. **Identify neglected goals** - For goals that received little/no attention:
   - Provide a brief reason for the neglect (if discernible)
   - Keep this constructive and non-judgmental

4. **Suggest 3-5 next steps** that are:
   - Specific and actionable
   - Aligned with their goals and current life context
   - Based on patterns observed in their journal entries

5. **Create a cohesive narrative summary** that:
   - Analyzes overall goal alignment patterns
   - Highlights key insights about their goal pursuit
   - Identifies obstacles and success factors
   - Maintains an encouraging and constructive tone
   - Length: 2-4 paragraphs

6. **Scoring guidelines:**
   - 90-100: Exceptional alignment across multiple goals, consistent progress
   - 80-89: Strong alignment, solid progress on most goals
   - 70-79: Good alignment, moderate progress with some gaps
   - 60-69: Fair alignment, some progress but inconsistent
   - 50-59: Poor alignment, minimal progress on goals
   - 0-49: Very poor alignment, little to no goal-directed activity
   - null: Insufficient information to assess alignment

7. **Format your response as JSON:**
\`\`\`json
{
  "alignmentScore": 75,
  "alignedGoals": [
    {
      "goalId": "goal-uuid",
      "goalTitle": "Goal Title",
      "evidence": ["Specific evidence from journal", "Another piece of evidence"]
    }
  ],
  "neglectedGoals": [
    {
      "goalId": "goal-uuid", 
      "goalTitle": "Goal Title",
      "reason": "Brief reason for neglect"
    }
  ],
  "suggestedNextSteps": [
    "Specific actionable step 1",
    "Specific actionable step 2"
  ],
  "summary": "Your comprehensive analysis here..."
}
\`\`\`

Focus on patterns and themes rather than day-by-day analysis. Be honest but encouraging. Markdown is supported in the summary.`;
}

/**
 * Generate a comprehensive goal alignment summary based on journal entries and active goals
 */
export async function generateGoalAlignmentSummary(
  journalEntries: (typeof journals.$inferSelect)[],
  userGoals: Goal[],
  startDate: string,
  endDate: string,
  userId: string,
): Promise<GoalAlignmentSummaryResult> {
  // Get user context for personalized analysis
  const userContext = await getUserContext(userId, {
    includeCharacter: true,
    includeActiveGoals: true,
    includeFamilyMembers: true,
    includeCharacterStats: true,
    includeExistingTags: false,
  });

  // Create the system prompt
  const systemPrompt = createGoalAlignmentSystemPrompt(userContext, userGoals, startDate, endDate);

  // Prepare the messages for the API
  const messages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  // Add journal entries as context
  let journalContent = `Here are the journal entries from ${startDate} to ${endDate}:\n\n`;

  journalEntries.forEach((journal, index) => {
    journalContent += `**${journal.date}**\n`;

    // Use both initialMessage and summary if available
    if (journal.initialMessage) {
      journalContent += `Original Content: ${journal.initialMessage}\n`;
    }

    if (journal.summary) {
      journalContent += `Summary: ${journal.summary}\n`;
    }

    journalContent += '\n---\n\n';
  });

  messages.push({
    role: 'user',
    content: journalContent,
  });

  messages.push({
    role: 'user',
    content: `Please analyze how well this period aligned with the active goals listed above. Return only the JSON response as specified.`,
  });

  const response = await callGptApi({
    messages,
    temperature: 0.6, // Balanced for analytical tasks
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
    if (
      (result.alignmentScore !== null && (typeof result.alignmentScore !== 'number' || result.alignmentScore < 0 || result.alignmentScore > 100)) ||
      !result.summary ||
      !Array.isArray(result.alignedGoals) ||
      !Array.isArray(result.neglectedGoals) ||
      !Array.isArray(result.suggestedNextSteps)
    ) {
      throw new Error('Invalid response format from GPT');
    }

    // Validate aligned goals structure
    for (const goal of result.alignedGoals) {
      if (!goal.goalId || !goal.goalTitle || !Array.isArray(goal.evidence)) {
        throw new Error('Invalid aligned goal structure from GPT');
      }
    }

    // Validate neglected goals structure
    for (const goal of result.neglectedGoals) {
      if (!goal.goalId || !goal.goalTitle) {
        throw new Error('Invalid neglected goal structure from GPT');
      }
    }

    return {
      alignmentScore: result.alignmentScore,
      alignedGoals: result.alignedGoals,
      neglectedGoals: result.neglectedGoals,
      suggestedNextSteps: result.suggestedNextSteps,
      summary: result.summary,
    };
  } catch (error) {
    throw new Error(`Failed to parse GPT goal alignment summary response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
