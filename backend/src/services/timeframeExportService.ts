import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db';
import { journals } from '../db/schema/journals';
import { weeklyAnalyses } from '../db/schema/weekly-analyses';
import { goals } from '../db/schema/goals';
import { plans, planSubtasks } from '../db/schema/plans';
import { quests, questExperiments, questJournals } from '../db/schema/quests';
import { experiments, experimentTasks, experimentTaskCompletions } from '../db/schema/experiments';
import { UserAttributesService } from './user-attributes';
import type {
  TimeframeExportOptions,
  TimeframeExportData,
  TimeframeExportResponse,
  DailyEntry,
  WeeklyAnalysisEntry,
  MonthlyAnalysisEntry,
  GoalEntry,
  PlanEntry,
  QuestEntry,
  ExperimentEntry,
  UserAttributeEntry,
} from '../../../shared/types/timeframe-export';

/**
 * Service to aggregate data and generate markdown export for a timeframe
 */
export class TimeframeExportService {
  /**
   * Generate a comprehensive timeframe export
   */
  static async generateExport(userId: string, startDate: string, endDate: string, options: TimeframeExportOptions): Promise<TimeframeExportResponse> {
    const data = await this.aggregateData(userId, startDate, endDate, options);
    const markdownContent = this.generateMarkdown(data, startDate, endDate, options);
    const sectionsIncluded = this.getSectionsIncluded(options);

    return {
      markdownContent,
      generatedAt: new Date().toISOString(),
      dateRange: {
        startDate,
        endDate,
      },
      sectionsIncluded,
    };
  }

  /**
   * Aggregate data from all relevant tables based on options
   */
  private static async aggregateData(userId: string, startDate: string, endDate: string, options: TimeframeExportOptions): Promise<TimeframeExportData> {
    const data: TimeframeExportData = {};

    // First, get analyses to determine the latest analysis date
    let latestAnalysisEndDate: string | null = null;

    // Weekly Analyses
    if (options.includeWeeklyAnalyses) {
      data.weeklyAnalyses = await this.getWeeklyAnalyses(userId, startDate, endDate, 'weekly');
      if (data.weeklyAnalyses.length > 0) {
        const latestWeekly = data.weeklyAnalyses[0]; // Already ordered by desc
        latestAnalysisEndDate = latestWeekly.periodEndDate;
      }
    }

    // Monthly Analyses
    if (options.includeMonthlyAnalyses) {
      data.monthlyAnalyses = await this.getWeeklyAnalyses(userId, startDate, endDate, 'monthly');
      if (data.monthlyAnalyses.length > 0) {
        const latestMonthly = data.monthlyAnalyses[0]; // Already ordered by desc
        // Use the later date between weekly and monthly analyses
        if (!latestAnalysisEndDate || latestMonthly.periodEndDate > latestAnalysisEndDate) {
          latestAnalysisEndDate = latestMonthly.periodEndDate;
        }
      }
    }

    // Daily Entries - adjust start date based on latest analysis
    if (options.includeDailyEntries) {
      const dailyStartDate = latestAnalysisEndDate ? this.getNextDay(latestAnalysisEndDate) : startDate;
      data.dailyEntries = await this.getDailyEntries(userId, dailyStartDate, endDate);
    }

    // Goals
    if (options.includeGoals) {
      data.goals = await this.getGoals(userId, startDate, endDate);
    }

    // Plans
    if (options.includePlans) {
      data.plans = await this.getPlans(userId, startDate, endDate);
    }

    // Quests
    if (options.includeQuests) {
      data.quests = await this.getQuests(userId, startDate, endDate);
    }

    // Experiments
    if (options.includeExperiments) {
      data.experiments = await this.getExperiments(userId, startDate, endDate);
    }

    // User Attributes
    if (options.includeUserAttributes) {
      data.userAttributes = await this.getUserAttributes(userId);
    }

    return data;
  }

  /**
   * Get the next day after a given date string
   */
  private static getNextDay(dateString: string): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get daily journal entries within date range
   */
  private static async getDailyEntries(userId: string, startDate: string, endDate: string): Promise<DailyEntry[]> {
    const entries = await db
      .select({
        date: journals.date,
        initialMessage: journals.initialMessage,
        summary: journals.summary,
        title: journals.title,
        synopsis: journals.synopsis,
        dayRating: journals.dayRating,
      })
      .from(journals)
      .where(and(eq(journals.userId, userId), gte(journals.date, startDate), lte(journals.date, endDate), eq(journals.status, 'complete')))
      .orderBy(desc(journals.date));

    return entries.map((entry) => ({
      date: entry.date,
      initialMessage: entry.initialMessage || '',
      summary: entry.summary || undefined,
      title: entry.title || undefined,
      synopsis: entry.synopsis || undefined,
      dayRating: entry.dayRating || undefined,
    }));
  }

  /**
   * Get weekly or monthly analyses within date range
   */
  private static async getWeeklyAnalyses(
    userId: string,
    startDate: string,
    endDate: string,
    analysisType: 'weekly' | 'monthly',
  ): Promise<WeeklyAnalysisEntry[] | MonthlyAnalysisEntry[]> {
    const analyses = await db
      .select({
        id: weeklyAnalyses.id,
        periodStartDate: weeklyAnalyses.periodStartDate,
        periodEndDate: weeklyAnalyses.periodEndDate,
        journalSummary: weeklyAnalyses.journalSummary,
        goalAlignmentSummary: weeklyAnalyses.goalAlignmentSummary,
        combinedReflection: weeklyAnalyses.combinedReflection,
        reflection: weeklyAnalyses.reflection,
      })
      .from(weeklyAnalyses)
      .where(
        and(
          eq(weeklyAnalyses.userId, userId),
          eq(weeklyAnalyses.analysisType, analysisType),
          // Include analyses that overlap with our date range
          lte(weeklyAnalyses.periodStartDate, endDate),
          gte(weeklyAnalyses.periodEndDate, startDate),
        ),
      )
      .orderBy(desc(weeklyAnalyses.periodStartDate));

    return analyses.map((analysis) => ({
      id: analysis.id,
      periodStartDate: analysis.periodStartDate,
      periodEndDate: analysis.periodEndDate,
      journalSummary: analysis.journalSummary,
      goalAlignmentSummary: analysis.goalAlignmentSummary,
      combinedReflection: analysis.combinedReflection || undefined,
      reflection: analysis.reflection || undefined,
    }));
  }

  /**
   * Get goals that were active or updated during the timeframe
   */
  private static async getGoals(userId: string, startDate: string, endDate: string): Promise<GoalEntry[]> {
    const userGoals = await db
      .select({
        id: goals.id,
        title: goals.title,
        description: goals.description,
        isActive: goals.isActive,
        isArchived: goals.isArchived,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt,
      })
      .from(goals)
      .where(
        and(
          eq(goals.userId, userId),
          // Include goals created, updated, or that were active during the timeframe
          // For simplicity, we'll include all goals for the user within a reasonable timeframe
        ),
      )
      .orderBy(desc(goals.createdAt));

    return userGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description || undefined,
      isActive: goal.isActive,
      isArchived: goal.isArchived,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    }));
  }

  /**
   * Get plans and their subtasks within the timeframe
   */
  private static async getPlans(userId: string, startDate: string, endDate: string): Promise<PlanEntry[]> {
    const userPlans = await db
      .select({
        id: plans.id,
        title: plans.title,
        type: plans.type,
        description: plans.description,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      })
      .from(plans)
      .where(eq(plans.userId, userId))
      .orderBy(desc(plans.createdAt));

    const plansWithSubtasks: PlanEntry[] = [];

    for (const plan of userPlans) {
      const subtasks = await db
        .select({
          id: planSubtasks.id,
          title: planSubtasks.title,
          description: planSubtasks.description,
          isCompleted: planSubtasks.isCompleted,
          completedAt: planSubtasks.completedAt,
          createdAt: planSubtasks.createdAt,
        })
        .from(planSubtasks)
        .where(eq(planSubtasks.planId, plan.id))
        .orderBy(planSubtasks.orderIndex);

      plansWithSubtasks.push({
        id: plan.id,
        title: plan.title,
        type: plan.type,
        description: plan.description || undefined,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        subtasks: subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          description: subtask.description || undefined,
          isCompleted: subtask.isCompleted,
          completedAt: subtask.completedAt?.toISOString(),
          createdAt: subtask.createdAt.toISOString(),
        })),
      });
    }

    return plansWithSubtasks;
  }

  /**
   * Get quests with their linked experiments and journal entries
   */
  private static async getQuests(userId: string, startDate: string, endDate: string): Promise<QuestEntry[]> {
    const userQuests = await db
      .select({
        id: quests.id,
        title: quests.title,
        summary: quests.summary,
        startDate: quests.startDate,
        endDate: quests.endDate,
        reflection: quests.reflection,
        status: quests.status,
        createdAt: quests.createdAt,
      })
      .from(quests)
      .where(
        and(
          eq(quests.userId, userId),
          // Include quests that overlap with our date range
          lte(quests.startDate, endDate),
          // Quest end date can be null (ongoing), so handle that case
        ),
      )
      .orderBy(desc(quests.startDate));

    const questsWithDetails: QuestEntry[] = [];

    for (const quest of userQuests) {
      // Get linked experiments
      const linkedExperiments = await db
        .select({
          id: experiments.id,
          title: experiments.title,
          description: experiments.description,
          startDate: experiments.startDate,
          endDate: experiments.endDate,
          reflection: experiments.reflection,
        })
        .from(experiments)
        .innerJoin(questExperiments, eq(questExperiments.experimentId, experiments.id))
        .where(eq(questExperiments.questId, quest.id))
        .orderBy(experiments.startDate);

      // Get linked journal entries
      const linkedJournals = await db
        .select({
          date: journals.date,
          title: journals.title,
          summary: journals.summary,
        })
        .from(journals)
        .innerJoin(questJournals, eq(questJournals.journalId, journals.id))
        .where(eq(questJournals.questId, quest.id))
        .orderBy(desc(journals.date));

      questsWithDetails.push({
        id: quest.id,
        title: quest.title,
        summary: quest.summary || undefined,
        startDate: quest.startDate,
        endDate: quest.endDate || undefined,
        reflection: quest.reflection || undefined,
        status: quest.status,
        createdAt: quest.createdAt.toISOString(),
        experiments: linkedExperiments.map((exp) => ({
          id: exp.id,
          title: exp.title,
          description: exp.description || undefined,
          startDate: exp.startDate,
          endDate: exp.endDate,
          reflection: exp.reflection || undefined,
        })),
        journalEntries: linkedJournals.map((journal) => ({
          date: journal.date,
          title: journal.title || undefined,
          summary: journal.summary || undefined,
        })),
      });
    }

    return questsWithDetails;
  }

  /**
   * Get experiments with their tasks and completions
   */
  private static async getExperiments(userId: string, startDate: string, endDate: string): Promise<ExperimentEntry[]> {
    const userExperiments = await db
      .select({
        id: experiments.id,
        title: experiments.title,
        description: experiments.description,
        startDate: experiments.startDate,
        endDate: experiments.endDate,
        reflection: experiments.reflection,
        shouldRepeat: experiments.shouldRepeat,
      })
      .from(experiments)
      .where(
        and(
          eq(experiments.userId, userId),
          // Include experiments that overlap with our date range
          lte(experiments.startDate, endDate),
          gte(experiments.endDate, startDate),
        ),
      )
      .orderBy(desc(experiments.startDate));

    const experimentsWithDetails: ExperimentEntry[] = [];

    for (const experiment of userExperiments) {
      // Get experiment tasks
      const tasks = await db
        .select({
          id: experimentTasks.id,
          description: experimentTasks.description,
          successMetric: experimentTasks.successMetric,
          xpReward: experimentTasks.xpReward,
        })
        .from(experimentTasks)
        .where(eq(experimentTasks.experimentId, experiment.id));

      const tasksWithCompletions = [];

      for (const task of tasks) {
        // Get task completions
        const completions = await db
          .select({
            completedDate: experimentTaskCompletions.completedDate,
            notes: experimentTaskCompletions.notes,
          })
          .from(experimentTaskCompletions)
          .where(eq(experimentTaskCompletions.taskId, task.id))
          .orderBy(experimentTaskCompletions.completedDate);

        tasksWithCompletions.push({
          id: task.id,
          description: task.description,
          successMetric: task.successMetric,
          xpReward: task.xpReward,
          completions: completions.map((completion) => ({
            completedDate: completion.completedDate,
            notes: completion.notes || undefined,
          })),
        });
      }

      experimentsWithDetails.push({
        id: experiment.id,
        title: experiment.title,
        description: experiment.description || undefined,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        reflection: experiment.reflection || undefined,
        shouldRepeat: experiment.shouldRepeat || undefined,
        tasks: tasksWithCompletions,
      });
    }

    return experimentsWithDetails;
  }

  /**
   * Generate markdown content from aggregated data
   */
  private static generateMarkdown(data: TimeframeExportData, startDate: string, endDate: string, options: TimeframeExportOptions): string {
    let markdown = `# Life Summary: ${startDate} to ${endDate}\n\n`;
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += `---\n\n`;

    // Daily Entries
    if (options.includeDailyEntries && data.dailyEntries?.length) {
      markdown += `## Daily Journal Entries\n\n`;
      data.dailyEntries.forEach((entry) => {
        markdown += `### ${entry.date}\n\n`;
        if (options.dailyOptions.includeSynopsis && entry.synopsis) {
          markdown += `*${entry.synopsis}*\n\n`;
        }
        if (options.dailyOptions.includeInitialMessage) {
          markdown += `${entry.initialMessage}\n\n`;
        }
        if (options.dailyOptions.includeSummary && entry.summary) {
          markdown += `**Summary:** ${entry.summary}\n\n`;
        }
        if (entry.dayRating) {
          markdown += `**Day Rating:** ${entry.dayRating}/5\n\n`;
        }
        markdown += `---\n\n`;
      });
    }

    // Weekly Analyses
    if (options.includeWeeklyAnalyses && data.weeklyAnalyses?.length) {
      markdown += `## Weekly Analyses\n\n`;
      data.weeklyAnalyses.forEach((analysis) => {
        markdown += `### Week of ${analysis.periodStartDate} to ${analysis.periodEndDate}\n\n`;
        if (options.weeklyOptions.includeJournalSummary) {
          markdown += `**Journal Summary:**\n${analysis.journalSummary}\n\n`;
        }
        if (options.weeklyOptions.includeGoalAlignment) {
          markdown += `**Goal Alignment Summary:**\n${analysis.goalAlignmentSummary}\n\n`;
        }
        if (options.weeklyOptions.includePersonalReflections && analysis.reflection) {
          markdown += `**Personal Reflection:**\n${analysis.reflection}\n\n`;
        }
        markdown += `---\n\n`;
      });
    }

    // Monthly Analyses
    if (options.includeMonthlyAnalyses && data.monthlyAnalyses?.length) {
      markdown += `## Monthly Analyses\n\n`;
      data.monthlyAnalyses.forEach((analysis) => {
        markdown += `### Month of ${analysis.periodStartDate} to ${analysis.periodEndDate}\n\n`;
        if (options.monthlyOptions.includeJournalSummary) {
          markdown += `**Journal Summary:**\n${analysis.journalSummary}\n\n`;
        }
        if (options.monthlyOptions.includeGoalAlignment) {
          markdown += `**Goal Alignment Summary:**\n${analysis.goalAlignmentSummary}\n\n`;
        }
        if (options.monthlyOptions.includePersonalReflections && analysis.reflection) {
          markdown += `**Personal Reflection:**\n${analysis.reflection}\n\n`;
        }
        markdown += `---\n\n`;
      });
    }

    // Goals
    if (options.includeGoals && data.goals?.length) {
      markdown += `## Goals\n\n`;
      const activeGoals = data.goals.filter((g) => g.isActive && !g.isArchived);
      const completedGoals = data.goals.filter((g) => !g.isActive && !g.isArchived);
      const archivedGoals = data.goals.filter((g) => g.isArchived);

      if (activeGoals.length) {
        markdown += `### Active Goals\n\n`;
        activeGoals.forEach((goal) => {
          markdown += `#### ${goal.title}\n\n`;
          if (goal.description) markdown += `Description: ${goal.description}\n\n`;
        });
        markdown += `\n`;
      }

      if (completedGoals.length) {
        markdown += `### Completed Goals\n\n`;
        completedGoals.forEach((goal) => {
          markdown += `- **${goal.title}**`;
          if (goal.description) markdown += `: ${goal.description}`;
          markdown += `\n`;
        });
        markdown += `\n`;
      }

      if (archivedGoals.length) {
        markdown += `### Archived Goals\n\n`;
        archivedGoals.forEach((goal) => {
          markdown += `- **${goal.title}**`;
          if (goal.description) markdown += `: ${goal.description}`;
          markdown += `\n`;
        });
        markdown += `\n`;
      }
    }

    // Plans
    if (options.includePlans && data.plans?.length) {
      markdown += `## Plans\n\n`;
      data.plans.forEach((plan) => {
        markdown += `### ${plan.title} (${plan.type})\n\n`;
        if (plan.description) {
          markdown += `${plan.description}\n\n`;
        }
        if (plan.subtasks.length) {
          markdown += `**Tasks:**\n`;
          plan.subtasks.forEach((subtask) => {
            const status = subtask.isCompleted ? '✅' : '⏳';
            markdown += `- ${status} **${subtask.title}**`;
            if (subtask.description) markdown += `: ${subtask.description}`;
            if (subtask.completedAt) markdown += ` *(completed ${subtask.completedAt.split('T')[0]})*`;
            markdown += `\n`;
          });
          markdown += `\n`;
        }
        markdown += `---\n\n`;
      });
    }

    // Quests
    if (options.includeQuests && data.quests?.length) {
      markdown += `## Quests\n\n`;
      data.quests.forEach((quest) => {
        markdown += `### ${quest.title}\n\n`;
        markdown += `**Status:** ${quest.status}\n`;
        markdown += `**Start Date:** ${quest.startDate}\n`;
        if (quest.endDate) markdown += `**End Date:** ${quest.endDate}\n`;
        markdown += `\n`;

        if (quest.summary) {
          markdown += `**Summary:**\n${quest.summary}\n\n`;
        }

        if (quest.experiments.length) {
          markdown += `**Linked Experiments:**\n`;
          quest.experiments.forEach((exp) => {
            markdown += `- **${exp.title}** (${exp.startDate} to ${exp.endDate})`;
            if (exp.description) markdown += `: ${exp.description}`;
            markdown += `\n`;
            if (exp.reflection) {
              markdown += `  *Reflection: ${exp.reflection}*\n`;
            }
          });
          markdown += `\n`;
        }

        if (quest.journalEntries.length) {
          markdown += `**Progress Notes from Journal:**\n`;
          quest.journalEntries.forEach((entry) => {
            markdown += `- **${entry.date}**`;
            if (entry.title) markdown += `: ${entry.title}`;
            markdown += `\n`;
            if (entry.summary) {
              markdown += `  ${entry.summary}\n`;
            }
          });
          markdown += `\n`;
        }

        if (quest.reflection) {
          markdown += `**Reflection:**\n${quest.reflection}\n\n`;
        }

        markdown += `---\n\n`;
      });
    }

    // Experiments
    if (options.includeExperiments && data.experiments?.length) {
      markdown += `## Experiments\n\n`;
      data.experiments.forEach((exp) => {
        markdown += `### ${exp.title}\n\n`;
        markdown += `**Duration:** ${exp.startDate} to ${exp.endDate}\n\n`;

        if (exp.description) {
          markdown += `**Setup:**\n${exp.description}\n\n`;
        }

        if (exp.tasks.length) {
          markdown += `**Tasks & Results:**\n`;
          exp.tasks.forEach((task) => {
            markdown += `- **${task.description}**`;
            const successMetric = task.successMetric ?? 1;
            const xpReward = task.xpReward ?? 0;
            markdown += ` (Success metric: ${successMetric}, XP: ${xpReward})\n`;
            if (task.completions.length) {
              markdown += `  Completions: `;
              task.completions.forEach((completion, idx) => {
                if (idx > 0) markdown += ', ';
                markdown += completion.completedDate;
                if (completion.notes) markdown += ` (${completion.notes})`;
              });
              markdown += `\n`;
            }
          });
          markdown += `\n`;
        }

        if (exp.reflection) {
          markdown += `**Reflection:**\n${exp.reflection}\n\n`;
        }

        if (exp.shouldRepeat !== undefined) {
          markdown += `**Would repeat:** ${exp.shouldRepeat ? 'Yes' : 'No'}\n\n`;
        }

        markdown += `---\n\n`;
      });
    }

    // User Attributes
    if (options.includeUserAttributes && data.userAttributes?.length) {
      markdown += `## User Attributes\n\n`;
      markdown += `These are characteristics and traits identified through journal analysis and user input:\n\n`;

      // Group by source for better organization
      const groupedBySource = data.userAttributes.reduce(
        (acc, attr) => {
          if (!acc[attr.source]) {
            acc[attr.source] = [];
          }
          acc[attr.source].push(attr);
          return acc;
        },
        {} as Record<string, UserAttributeEntry[]>,
      );

      Object.entries(groupedBySource).forEach(([source, attrs]) => {
        const sourceLabel =
          source === 'user_set' ? 'User Defined' : source === 'gpt_summary' ? 'AI Generated' : source === 'journal_analysis' ? 'Journal Analysis' : source;

        markdown += `### ${sourceLabel}\n\n`;
        attrs.forEach((attr) => {
          markdown += `- ${attr.value}\n`;
        });
        markdown += `\n`;
      });
    }

    return markdown;
  }

  /**
   * Get list of section names that will be included
   */
  private static getSectionsIncluded(options: TimeframeExportOptions): string[] {
    const sections: string[] = [];

    if (options.includeDailyEntries) sections.push('Daily Entries');
    if (options.includeWeeklyAnalyses) sections.push('Weekly Analyses');
    if (options.includeMonthlyAnalyses) sections.push('Monthly Analyses');
    if (options.includeGoals) sections.push('Goals');
    if (options.includePlans) sections.push('Plans');
    if (options.includeQuests) sections.push('Quests');
    if (options.includeExperiments) sections.push('Experiments');
    if (options.includeUserAttributes) sections.push('User Attributes');

    return sections;
  }

  /**
   * Get user attributes
   */
  private static async getUserAttributes(userId: string): Promise<UserAttributeEntry[]> {
    const attributes = await UserAttributesService.getUserAttributes(userId);
    return attributes.map((attr) => ({
      id: attr.id,
      value: attr.value,
      source: attr.source,
      lastUpdated: attr.lastUpdated!.toISOString(),
      createdAt: attr.createdAt!.toISOString(),
    }));
  }
}
