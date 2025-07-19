import { db } from '../db';
import { quests, questExperiments, questJournals } from '../db/schema/quests';
import { experiments } from '../db/schema/experiments';
import { journals } from '../db/schema/journals';
import { characterStats } from '../db/schema/stats';
import { xpGrants } from '../db/schema/stats';
import { eq, and, sql, between, or } from 'drizzle-orm';
import type {
  Quest,
  NewQuest,
  CreateQuestRequest,
  UpdateQuestRequest,
  QuestResponse,
  QuestWithExperimentsAndJournalsResponse,
  QuestDashboardResponse,
  LinkQuestExperimentRequest,
  LinkQuestJournalRequest,
} from '../types/quests';

export class QuestService {
  // Create a new quest
  static async createQuest(userId: string, data: CreateQuestRequest): Promise<QuestResponse> {
    const questData: NewQuest = {
      userId,
      title: data.title,
      summary: data.summary,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',
    };

    const [quest] = await db.insert(quests).values(questData).returning();
    return this.formatQuestResponse(quest);
  }

  // Get all quests for a user
  static async getUserQuests(userId: string): Promise<QuestResponse[]> {
    const userQuests = await db.select().from(quests).where(eq(quests.userId, userId)).orderBy(quests.createdAt);
    return userQuests.map(this.formatQuestResponse);
  }

  // Get a specific quest by ID
  static async getQuestById(userId: string, questId: string): Promise<QuestResponse | null> {
    const [quest] = await db
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)));

    return quest ? this.formatQuestResponse(quest) : null;
  }

  // Get quest with experiments and journals
  static async getQuestWithDetails(userId: string, questId: string): Promise<QuestWithExperimentsAndJournalsResponse | null> {
    const quest = await this.getQuestById(userId, questId);
    if (!quest) return null;

    // Get linked experiments
    const linkedExperiments = await db
      .select({
        id: experiments.id,
        title: experiments.title,
        description: experiments.description,
        startDate: experiments.startDate,
        endDate: experiments.endDate,
      })
      .from(questExperiments)
      .innerJoin(experiments, eq(questExperiments.experimentId, experiments.id))
      .where(eq(questExperiments.questId, questId));

    // Get linked journals
    const linkedJournals = await db
      .select({
        id: journals.id,
        date: journals.date,
        title: journals.title,
        synopsis: journals.synopsis,
        linkedType: questJournals.linkedType,
      })
      .from(questJournals)
      .innerJoin(journals, eq(questJournals.journalId, journals.id))
      .where(eq(questJournals.questId, questId));

    // Get XP by stats for the quest date range
    const xpByStats = await this.getQuestXpByStats(userId, quest.startDate, quest.endDate);

    return {
      ...quest,
      experiments: linkedExperiments.map((exp) => ({
        id: exp.id,
        title: exp.title,
        description: exp.description || undefined,
        startDate: exp.startDate,
        endDate: exp.endDate,
      })),
      journals: linkedJournals.map((journal) => ({
        id: journal.id,
        date: journal.date,
        title: journal.title || undefined,
        synopsis: journal.synopsis || undefined,
        linkedType: journal.linkedType,
      })),
      xpByStats,
    };
  }

  // Get quest dashboard data (same as details for now)
  static async getQuestDashboard(userId: string, questId: string): Promise<QuestDashboardResponse | null> {
    return this.getQuestWithDetails(userId, questId);
  }

  // Update a quest
  static async updateQuest(userId: string, questId: string, data: UpdateQuestRequest): Promise<QuestResponse | null> {
    const updateData: Partial<Quest> = {
      ...data,
      updatedAt: new Date(),
    };

    const [updatedQuest] = await db
      .update(quests)
      .set(updateData)
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
      .returning();

    return updatedQuest ? this.formatQuestResponse(updatedQuest) : null;
  }

  // Delete a quest
  static async deleteQuest(userId: string, questId: string): Promise<boolean> {
    const result = await db
      .delete(quests)
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
      .returning();

    return result.length > 0;
  }

  // Link an experiment to a quest
  static async linkExperiment(userId: string, questId: string, data: LinkQuestExperimentRequest): Promise<boolean> {
    // Verify the quest belongs to the user
    const quest = await this.getQuestById(userId, questId);
    if (!quest) return false;

    // Verify the experiment belongs to the user
    const [experiment] = await db
      .select()
      .from(experiments)
      .where(and(eq(experiments.id, data.experimentId), eq(experiments.userId, userId)));

    if (!experiment) return false;

    // Check if the link already exists
    const [existingLink] = await db
      .select()
      .from(questExperiments)
      .where(and(eq(questExperiments.questId, questId), eq(questExperiments.experimentId, data.experimentId)));

    if (existingLink) return true; // Already linked

    // Create the link
    await db.insert(questExperiments).values({
      questId,
      experimentId: data.experimentId,
    });

    return true;
  }

  // Unlink an experiment from a quest
  static async unlinkExperiment(userId: string, questId: string, experimentId: string): Promise<boolean> {
    // Verify the quest belongs to the user
    const quest = await this.getQuestById(userId, questId);
    if (!quest) return false;

    const result = await db
      .delete(questExperiments)
      .where(and(eq(questExperiments.questId, questId), eq(questExperiments.experimentId, experimentId)))
      .returning();

    return result.length > 0;
  }

  // Link a journal to a quest
  static async linkJournal(userId: string, questId: string, data: LinkQuestJournalRequest): Promise<boolean> {
    // Verify the quest belongs to the user
    const quest = await this.getQuestById(userId, questId);
    if (!quest) return false;

    // Verify the journal belongs to the user
    const [journal] = await db
      .select()
      .from(journals)
      .where(and(eq(journals.id, data.journalId), eq(journals.userId, userId)));

    if (!journal) return false;

    // Check if the link already exists
    const [existingLink] = await db
      .select()
      .from(questJournals)
      .where(and(eq(questJournals.questId, questId), eq(questJournals.journalId, data.journalId)));

    if (existingLink) return true; // Already linked

    // Create the link
    await db.insert(questJournals).values({
      questId,
      journalId: data.journalId,
      linkedType: data.linkedType || 'manual',
    });

    return true;
  }

  // Unlink a journal from a quest
  static async unlinkJournal(userId: string, questId: string, journalId: string): Promise<boolean> {
    // Verify the quest belongs to the user
    const quest = await this.getQuestById(userId, questId);
    if (!quest) return false;

    const result = await db
      .delete(questJournals)
      .where(and(eq(questJournals.questId, questId), eq(questJournals.journalId, journalId)))
      .returning();

    return result.length > 0;
  }

  // Automatically link journals based on date range
  static async autoLinkJournals(userId: string, questId: string): Promise<boolean> {
    const quest = await this.getQuestById(userId, questId);
    if (!quest) return false;

    // Find journals within the quest date range
    let dateFilter;
    if (quest.endDate) {
      dateFilter = and(sql`${journals.date} >= ${quest.startDate}`, sql`${journals.date} <= ${quest.endDate}`);
    } else {
      dateFilter = sql`${journals.date} >= ${quest.startDate}`;
    }

    const journalsInRange = await db
      .select({ id: journals.id })
      .from(journals)
      .where(and(eq(journals.userId, userId), dateFilter));

    // Link each journal that's not already linked
    for (const journal of journalsInRange) {
      const [existingLink] = await db
        .select()
        .from(questJournals)
        .where(and(eq(questJournals.questId, questId), eq(questJournals.journalId, journal.id)));

      if (!existingLink) {
        await db.insert(questJournals).values({
          questId,
          journalId: journal.id,
          linkedType: 'automatic',
        });
      }
    }

    return true;
  }

  // Helper method to get XP by stats for a date range
  private static async getQuestXpByStats(
    userId: string,
    startDate: string,
    endDate?: string,
  ): Promise<Array<{ statId: string; statName: string; totalXp: number }>> {
    let dateFilter;
    if (endDate) {
      dateFilter = and(sql`DATE(${xpGrants.createdAt}) >= ${startDate}`, sql`DATE(${xpGrants.createdAt}) <= ${endDate}`);
    } else {
      dateFilter = sql`DATE(${xpGrants.createdAt}) >= ${startDate}`;
    }

    const xpData = await db
      .select({
        statId: characterStats.id,
        statName: characterStats.name,
        totalXp: sql<number>`COALESCE(SUM(${xpGrants.xpAmount}), 0)`,
      })
      .from(xpGrants)
      .innerJoin(characterStats, eq(xpGrants.entityId, characterStats.id))
      .where(and(eq(characterStats.userId, userId), eq(xpGrants.entityType, 'character_stat'), dateFilter))
      .groupBy(characterStats.id, characterStats.name);

    return xpData.map((row) => ({
      statId: row.statId,
      statName: row.statName,
      totalXp: row.totalXp,
    }));
  }

  // Helper method to format quest response
  private static formatQuestResponse(quest: Quest): QuestResponse {
    return {
      id: quest.id,
      userId: quest.userId,
      title: quest.title,
      summary: quest.summary || undefined,
      startDate: quest.startDate,
      endDate: quest.endDate || undefined,
      reflection: quest.reflection || undefined,
      status: quest.status,
      createdAt: quest.createdAt.toISOString(),
      updatedAt: quest.updatedAt.toISOString(),
    };
  }
}
