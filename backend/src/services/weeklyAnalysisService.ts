import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { journals } from '../db/schema/journals';
import { xpGrants, characterStats } from '../db/schema/stats';
import { experimentTaskCompletions } from '../db/schema/experiments';
import { simpleTodos } from '../db/schema/todos';
import { tags } from '../db/schema/tags';
import type { WeeklyAnalysisMetrics } from '../../../shared/types/weekly-analyses';

export interface CalculateWeeklyMetricsOptions {
  userId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
}

/**
 * Calculate comprehensive metrics for weekly analysis
 */
export async function calculateWeeklyMetrics(options: CalculateWeeklyMetricsOptions): Promise<WeeklyAnalysisMetrics> {
  const { userId, startDate, endDate } = options;

  // Convert dates to Date objects for queries
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // 1. Get all XP grants in the period
  const xpGrantsInPeriod = await db
    .select()
    .from(xpGrants)
    .where(and(eq(xpGrants.userId, userId), gte(xpGrants.createdAt, startDateObj), lte(xpGrants.createdAt, endDateObj)));

  const totalXpGained = xpGrantsInPeriod.reduce((sum, grant) => sum + grant.xpAmount, 0);

  // 2. Get all character stats for this user to map stat IDs to names
  const userStats = await db
    .select({
      id: characterStats.id,
      name: characterStats.name,
    })
    .from(characterStats)
    .where(eq(characterStats.userId, userId));

  const statIdToName = Object.fromEntries(userStats.map((stat) => [stat.id, stat.name]));

  // 3. Calculate XP by stat
  const xpByStatsMap: Record<string, { statId: string; statName: string; xpGained: number }> = {};

  xpGrantsInPeriod.forEach((grant) => {
    if (grant.entityType === 'character_stat' && grant.entityId) {
      const statName = statIdToName[grant.entityId];
      if (statName) {
        if (!xpByStatsMap[grant.entityId]) {
          xpByStatsMap[grant.entityId] = {
            statId: grant.entityId,
            statName,
            xpGained: 0,
          };
        }
        xpByStatsMap[grant.entityId].xpGained += grant.xpAmount;
      }
    }
  });

  const xpByStats = Object.values(xpByStatsMap).sort((a, b) => b.xpGained - a.xpGained);

  // 4. Get task completions in the period (from experiments and simple todos)
  const [experimentTaskComps, todoComps] = await Promise.all([
    db
      .select()
      .from(experimentTaskCompletions)
      .where(
        and(
          eq(experimentTaskCompletions.userId, userId),
          gte(experimentTaskCompletions.completedDate, startDate),
          lte(experimentTaskCompletions.completedDate, endDate),
        ),
      ),
    db
      .select()
      .from(simpleTodos)
      .where(
        and(
          eq(simpleTodos.userId, userId),
          eq(simpleTodos.isCompleted, true),
          gte(simpleTodos.completedAt, startDateObj),
          lte(simpleTodos.completedAt, endDateObj),
        ),
      ),
  ]);

  const tasksCompleted = experimentTaskComps.length + todoComps.length;

  // 5. Get journal entries in the period for tone analysis and average day rating
  const journalEntries = await db
    .select({
      toneTags: journals.toneTags,
      dayRating: journals.dayRating,
    })
    .from(journals)
    .where(
      and(
        eq(journals.userId, userId),
        gte(journals.date, startDate),
        lte(journals.date, endDate),
        eq(journals.status, 'complete'), // Only include completed journals
      ),
    );

  // 6. Calculate tone frequency
  const toneTagCounts: Record<string, number> = {};
  journalEntries.forEach((journal) => {
    if (journal.toneTags && Array.isArray(journal.toneTags)) {
      journal.toneTags.forEach((tag) => {
        if (typeof tag === 'string') {
          toneTagCounts[tag] = (toneTagCounts[tag] || 0) + 1;
        }
      });
    }
  });

  const toneFrequency = Object.entries(toneTagCounts)
    .map(([tone, count]) => ({ tone, count }))
    .sort((a, b) => b.count - a.count);

  // 7. Calculate average day rating
  const journalRatings = journalEntries.map((journal) => journal.dayRating).filter((rating): rating is number => rating !== null && rating !== undefined);

  const avgDayRating =
    journalRatings.length > 0
      ? Math.round((journalRatings.reduce((sum, rating) => sum + rating, 0) / journalRatings.length) * 10) / 10 // Round to 1 decimal place
      : null;

  // 8. Calculate content tag frequency from XP grants to content tags
  const contentTagXpGrants = xpGrantsInPeriod.filter((grant) => grant.entityType === 'content_tag' && grant.entityId);

  // Get tag names for the content tag grants
  const contentTagIds = contentTagXpGrants.map((grant) => grant.entityId!);
  const contentTags = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags)
    .where(and(eq(tags.userId, userId)));

  const tagIdToName = Object.fromEntries(contentTags.map((tag) => [tag.id, tag.name]));

  const contentTagCounts: Record<string, number> = {};
  contentTagXpGrants.forEach((grant) => {
    if (grant.entityId) {
      const tagName = tagIdToName[grant.entityId];
      if (tagName) {
        contentTagCounts[tagName] = (contentTagCounts[tagName] || 0) + 1;
      }
    }
  });

  const contentTagFrequency = Object.entries(contentTagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalXpGained,
    tasksCompleted,
    avgDayRating,
    xpByStats,
    toneFrequency,
    contentTagFrequency,
  };
}
