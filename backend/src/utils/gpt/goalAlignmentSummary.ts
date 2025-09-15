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
  totalPointsEarned: number;
  totalPossiblePoints: number;
}

type Goal = typeof goals.$inferSelect;

/**
 * System prompt for generating goal alignment summaries
 */
function createGoalAlignmentSystemPrompt(userContext: ComprehensiveUserContext, userGoals: Goal[], startDate: string, endDate: string): string {
  const goalsList = userGoals.map((goal: Goal) => `- **${goal.title}**: ${goal.description || 'No description'}`).join('\n');

  return `You are a smart, compassionate life coach helping ${userContext.name} understand how their activities aligned with their goals during the period from ${startDate} to ${endDate}.

Your analysis will use a deterministic scoring system and provide actionable insights with a forward-thinking approach.

## User Context
${formatUserContextForPrompt(userContext)}

## Active Goals to Analyze
${goalsList}

## Instructions

Create a per-goal breakdown analysis with deterministic scoring and forward-looking suggestions.

### Scoring System (CRITICAL):
- Each goal can earn **maximum 2 points**:
  - **1 point**: Any aligned action or evidence found in journals
  - **2 points**: Two or more aligned actions or significant engagement
  - **0 points**: No activity noted (goes to neglected goals)

### Response Format Requirements:

1. **Summary Text**: Write as a life coach - honest but encouraging, focused on patterns and growth opportunities. Style should be:
   - Forward-thinking, not just reflective
   - Focused on alignment with values and identity, not just task completion
   - Honest but motivational, specific and realistic
   - 2-3 paragraphs analyzing overall alignment patterns

2. **Per-Goal Analysis**:
   - Every goal MUST appear in either alignedGoals OR neglectedGoals
   - For aligned goals: Include specific evidence from journal entries and assign 1-2 points
   - For neglected goals: Include brief reason and assign 0 points

3. **Next Steps**: 1-3 concrete, specific suggestions based on low-engagement or missed goals

### Calculation:
- Total possible points = (number of goals) × 2
- Alignment score = (total points earned / total possible points) × 100, rounded to nearest integer

### JSON Response Format:
\`\`\`json
{
  "alignmentScore": 75,
  "totalPointsEarned": 6,
  "totalPossiblePoints": 8,
  "alignedGoals": [
    {
      "goalId": "goal-uuid",
      "goalTitle": "Goal Title",
      "points": 2,
      "evidence": ["Specific evidence from journal", "Another piece of evidence"]
    }
  ],
  "neglectedGoals": [
    {
      "goalId": "goal-uuid", 
      "goalTitle": "Goal Title",
      "points": 0,
      "reason": "No activity noted this week. You might revisit whether this goal is still important, or if a small step could make it easier to engage."
    }
  ],
  "suggestedNextSteps": [
    "Specific actionable step 1",
    "Specific actionable step 2"
  ],
  "summary": "Your comprehensive life coach analysis here..."
}
\`\`\`

Focus on helping ${userContext.name} see patterns, celebrate progress, and take concrete next steps. Be specific about what they accomplished and what small actions could help them move forward.`;
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
      !Array.isArray(result.suggestedNextSteps) ||
      typeof result.totalPointsEarned !== 'number' ||
      typeof result.totalPossiblePoints !== 'number' ||
      result.totalPointsEarned < 0 ||
      result.totalPossiblePoints < 0
    ) {
      throw new Error('Invalid response format from GPT');
    }

    // Validate aligned goals structure
    for (const goal of result.alignedGoals) {
      if (!goal.goalId || !goal.goalTitle || !Array.isArray(goal.evidence) || typeof goal.points !== 'number' || goal.points < 1 || goal.points > 2) {
        throw new Error('Invalid aligned goal structure from GPT');
      }
    }

    // Validate neglected goals structure
    for (const goal of result.neglectedGoals) {
      if (!goal.goalId || !goal.goalTitle || typeof goal.points !== 'number' || goal.points !== 0) {
        throw new Error('Invalid neglected goal structure from GPT');
      }
    }

    return {
      alignmentScore: result.alignmentScore,
      alignedGoals: result.alignedGoals,
      neglectedGoals: result.neglectedGoals,
      suggestedNextSteps: result.suggestedNextSteps,
      summary: result.summary,
      totalPointsEarned: result.totalPointsEarned,
      totalPossiblePoints: result.totalPossiblePoints,
    };
  } catch (error) {
    throw new Error(`Failed to parse GPT goal alignment summary response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
