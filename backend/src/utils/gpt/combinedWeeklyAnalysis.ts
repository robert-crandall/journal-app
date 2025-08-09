import { ChatCompletionMessageParam } from 'openai/resources';
import { callGptApi } from './client';
import { getUserContext, formatUserContextForPrompt, type ComprehensiveUserContext } from '../userContextService';
import { generatePeriodSummary } from './periodSummary';
import { generateGoalAlignmentSummary, type GoalAlignmentSummaryResult } from './goalAlignmentSummary';
import type { journals } from '../../db/schema/journals';
import type { goals } from '../../db/schema/goals';
import type { WeeklyAnalysisMetrics, WeeklyAnalysisExperiment } from '../../../../shared/types/weekly-analyses';

/**
 * Interface for combined weekly analysis result
 */
export interface CombinedWeeklyAnalysisResult {
  journalSummary: string;
  journalTags: string[];
  alignmentScore: number | null;
  alignedGoals: Array<{
    goalId: string;
    goalTitle: string;
    evidence: string[];
  }>;
  neglectedGoals: Array<{
    goalId: string;
    goalTitle: string;
    reason?: string;
  }>;
  suggestedNextSteps: string[];
  goalAlignmentSummary: string;
  combinedReflection?: string;
}

type Goal = typeof goals.$inferSelect;

/**
 * System prompt for generating combined weekly reflection
 */
function createCombinedReflectionSystemPrompt(
  userContext: ComprehensiveUserContext,
  journalSummary: string,
  goalAlignmentSummary: string,
  completedExperiments: WeeklyAnalysisExperiment[],
  metrics: WeeklyAnalysisMetrics,
  startDate: string,
  endDate: string,
): string {
  const topStats = metrics.xpByStats
    .slice(0, 3)
    .map((stat) => `${stat.statName} (+${stat.xpGained} XP)`)
    .join(', ');
  const topTones = metrics.toneFrequency
    .slice(0, 3)
    .map((tone) => tone.tone)
    .join(', ');

  return `You are an insightful life coach creating a unified weekly reflection for ${userContext.name} for the period from ${startDate} to ${endDate}.

## User Context
${formatUserContextForPrompt(userContext)}

## This Week's Data
**Journal Summary:**
${journalSummary}

**Goal Alignment Summary:**
${goalAlignmentSummary}

**Completed Experiments:**
${
  completedExperiments.length === 0
    ? 'No experiments completed during this period.'
    : completedExperiments
        .map(
          (exp, index) =>
            `${index + 1}. **${exp.title}** (${exp.startDate} to ${exp.endDate})
   Description: ${exp.description || 'No description provided'}
   How it went: ${exp.reflection || 'No reflection provided yet'}`,
        )
        .join('\n\n')
}

**Key Metrics:**
- Total XP Gained: ${metrics.totalXpGained}
- Tasks Completed: ${metrics.tasksCompleted}
- Top Stats: ${topStats || 'None'}
- Most Common Tones: ${topTones || 'None'}

## Your Task

Create a brief, inspiring combined reflection (2-3 sentences) that:

1. **Connects** journal themes with goal progress
2. **Highlights** the most meaningful growth or insights
3. **Bridges** what happened with what it means for their journey
4. **Maintains** an encouraging, forward-looking tone

Examples of good combined reflections:
- "You spent meaningful time outdoors with your family this week, directly advancing your Ranger path while strengthening your bonds with loved ones."
- "Your consistent strength training showed up both in your actions and your mindset, building physical and mental resilience toward your goals."
- "This week's focus on creativity and learning reflects your commitment to growth, even during busy periods."

**Important Guidelines:**
- Keep it concise (2-3 sentences maximum)
- Focus on connections between daily life and bigger picture goals
- Use an encouraging, insightful tone
- Avoid generic statements - be specific to their week
- Don't repeat what's already in the summaries - add synthesis

Return only the reflection text, no JSON or formatting.`;
}

/**
 * Generate a comprehensive weekly analysis combining journal summary, goal alignment, and metrics
 */
export async function generateCombinedWeeklyAnalysis(
  journalEntries: (typeof journals.$inferSelect)[],
  userGoals: Goal[],
  completedExperiments: WeeklyAnalysisExperiment[],
  metrics: WeeklyAnalysisMetrics,
  startDate: string,
  endDate: string,
  userId: string,
): Promise<CombinedWeeklyAnalysisResult> {
  // Generate journal summary and goal alignment summary in parallel
  const [journalResult, goalAlignmentResult] = await Promise.all([
    generatePeriodSummary(journalEntries, 'week', userId),
    generateGoalAlignmentSummary(journalEntries, userGoals, startDate, endDate, userId),
  ]);

  // Generate combined reflection if both summaries exist
  let combinedReflection: string | undefined;

  if (journalResult.summary && goalAlignmentResult.summary) {
    try {
      const userContext = await getUserContext(userId, {
        includeCharacter: true,
        includeActiveGoals: true,
        includeFamilyMembers: true,
        includeCharacterStats: true,
        includeExistingTags: false,
      });

      const systemPrompt = createCombinedReflectionSystemPrompt(
        userContext,
        journalResult.summary,
        goalAlignmentResult.summary,
        completedExperiments,
        metrics,
        startDate,
        endDate,
      );

      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Please create a combined reflection that synthesizes the journal themes, goal alignment, and metrics into meaningful insights.',
        },
      ];

      const response = await callGptApi({
        messages,
        temperature: 0.7, // Slightly creative for inspiring reflection
      });

      combinedReflection = response.content.trim();
    } catch (error) {
      console.warn('Failed to generate combined reflection:', error);
      // Don't throw - combined reflection is optional
    }
  }

  return {
    journalSummary: journalResult.summary,
    journalTags: journalResult.tags,
    alignmentScore: goalAlignmentResult.alignmentScore,
    alignedGoals: goalAlignmentResult.alignedGoals,
    neglectedGoals: goalAlignmentResult.neglectedGoals,
    suggestedNextSteps: goalAlignmentResult.suggestedNextSteps,
    goalAlignmentSummary: goalAlignmentResult.summary,
    combinedReflection,
  };
}
