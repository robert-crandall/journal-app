import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { journals } from '../db/schema/journals';
import { xpGrants, characterStats } from '../db/schema/stats';
import { experimentTaskCompletions, experiments } from '../db/schema/experiments';
import type { PeriodMetrics } from '../../../shared/types/metric-summaries';

export interface CalculateMetricsOptions {
  userId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
}

/**
 * Calculate comprehensive metrics for a given time period
 */
export async function calculatePeriodMetrics(options: CalculateMetricsOptions): Promise<PeriodMetrics> {
  const { userId, startDate, endDate } = options;

  // Convert dates to Date objects for queries
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // 1. Get journal entries in the period
  const journalEntries = await db
    .select({
      id: journals.id,
      date: journals.date,
      dayRating: journals.dayRating,
      inferredDayRating: journals.inferredDayRating,
      toneTags: journals.toneTags,
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

  // 2. Calculate average day rating
  const ratingsForAverage = journalEntries.map((j) => j.dayRating || j.inferredDayRating).filter((rating): rating is number => rating !== null);

  const avgDayRating = ratingsForAverage.length > 0 ? ratingsForAverage.reduce((sum, rating) => sum + rating, 0) / ratingsForAverage.length : null;

  // 3. Calculate tone tag counts and most common tone
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

  const mostCommonTone = Object.keys(toneTagCounts).length > 0 ? Object.entries(toneTagCounts).sort(([, a], [, b]) => b - a)[0][0] : undefined;

  // 4. Get all XP grants in the period
  const xpGrantsInPeriod = await db
    .select()
    .from(xpGrants)
    .where(and(eq(xpGrants.userId, userId), gte(xpGrants.createdAt, startDateObj), lte(xpGrants.createdAt, endDateObj)));

  const totalXp = xpGrantsInPeriod.reduce((sum, grant) => sum + grant.xpAmount, 0);

  // 5. Calculate XP by stat
  const xpByStat: Record<string, number> = {};

  // Get all character stats for this user to map stat IDs to names
  const userStats = await db
    .select({
      id: characterStats.id,
      name: characterStats.name,
    })
    .from(characterStats)
    .where(eq(characterStats.userId, userId));

  const statIdToName = Object.fromEntries(userStats.map((stat) => [stat.id, stat.name]));

  xpGrantsInPeriod.forEach((grant) => {
    if (grant.entityType === 'character_stat' && grant.entityId) {
      const statName = statIdToName[grant.entityId];
      if (statName) {
        xpByStat[statName] = (xpByStat[statName] || 0) + grant.xpAmount;
      }
    }
  });

  // 6. Get task completions in the period (from experiments)
  const taskCompletions = await db
    .select()
    .from(experimentTaskCompletions)
    .where(
      and(
        eq(experimentTaskCompletions.userId, userId),
        gte(experimentTaskCompletions.completedDate, startDate),
        lte(experimentTaskCompletions.completedDate, endDate),
      ),
    );

  const tasksCompleted = taskCompletions.length;

  // 7. Calculate number of days in period and average tasks per day
  const periodStart = new Date(startDate);
  const periodEnd = new Date(endDate);
  const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const averageTasksPerDay = daysInPeriod > 0 ? tasksCompleted / daysInPeriod : 0;

  // 8. Calculate logging streak (simplified version for now)
  // This is a basic implementation - could be enhanced to calculate actual streaks
  const daysLogged = journalEntries.length;
  const logStreak = daysLogged > 0 ? { longest: daysLogged, current: daysLogged } : undefined;

  return {
    startDate,
    endDate,
    totalXp,
    avgDayRating,
    toneTagCounts,
    mostCommonTone,
    daysLogged,
    tasksCompleted,
    averageTasksPerDay,
    xpByStat,
    logStreak,
  };
}
