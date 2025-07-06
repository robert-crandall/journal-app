import { db } from './db';
import { stats, statActivities, xpGrants, statLevelTitles } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { Stat, StatActivity, XpGrant } from './db/schema';

export interface StatWithActivities extends Stat {
  activities: StatActivity[];
  xpForNextLevel: number;
  totalXpForCurrentLevel: number;
  totalXpForNextLevel: number;
  currentLevelTitle?: string;
}

/**
 * Calculate total XP required for a given level
 * Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, Level 4: 600 XP, etc.
 * Formula: Total XP for level n = 100 × ((n-1) × n) / 2
 */
export function calculateXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (100 * ((level - 1) * level)) / 2;
}

/**
 * Calculate current level based on total XP
 */
export function calculateLevelFromXp(totalXp: number): number {
  let level = 1;
  while (calculateXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * Get XP needed to reach next level
 */
export function getXpForNextLevel(currentXp: number, currentLevel: number): number {
  const nextLevelXp = calculateXpForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
}

/**
 * Award XP to a stat
 */
export async function awardXp(
  userId: string,
  statId: string,
  amount: number,
  sourceType: 'task' | 'journal' | 'adhoc' | 'quest',
  sourceId?: string,
  comment?: string,
): Promise<{ stat: Stat; leveledUp: boolean; newLevel?: number }> {
  // First, record the XP grant
  await db.insert(xpGrants).values({
    statId,
    userId,
    amount,
    sourceType,
    sourceId,
    comment,
  });

  // Get current stat
  const [currentStat] = await db
    .select()
    .from(stats)
    .where(and(eq(stats.id, statId), eq(stats.userId, userId)));

  if (!currentStat) {
    throw new Error('Stat not found');
  }

  // Calculate new XP and level
  const newXp = currentStat.currentXp + amount;
  const newLevel = calculateLevelFromXp(newXp);
  const leveledUp = newLevel > currentStat.currentLevel;

  // Update the stat
  const [updatedStat] = await db
    .update(stats)
    .set({
      currentXp: newXp,
      currentLevel: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(stats.id, statId))
    .returning();

  return {
    stat: updatedStat,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
  };
}

/**
 * Get all stats for a user with activities and level info
 */
export async function getUserStats(userId: string): Promise<StatWithActivities[]> {
  const userStats = await db.select().from(stats).where(eq(stats.userId, userId)).orderBy(stats.name);

  const statsWithActivities: StatWithActivities[] = [];

  for (const stat of userStats) {
    // Recalculate level based on current XP (in case formula changed)
    const correctLevel = calculateLevelFromXp(stat.currentXp);
    let updatedStat = stat;

    // Update level in database if it's incorrect
    if (correctLevel !== stat.currentLevel) {
      const [updated] = await db.update(stats).set({ currentLevel: correctLevel }).where(eq(stats.id, stat.id)).returning();
      updatedStat = updated;
    }

    // Get activities for this stat
    const activities = await db.select().from(statActivities).where(eq(statActivities.statId, updatedStat.id)).orderBy(statActivities.description);

    // Get current level title if exists
    const [levelTitle] = await db
      .select()
      .from(statLevelTitles)
      .where(and(eq(statLevelTitles.statId, updatedStat.id), eq(statLevelTitles.level, updatedStat.currentLevel)));

    // Calculate XP info
    const totalXpForCurrentLevel = calculateXpForLevel(updatedStat.currentLevel);
    const totalXpForNextLevel = calculateXpForLevel(updatedStat.currentLevel + 1);
    const xpForNextLevel = getXpForNextLevel(updatedStat.currentXp, updatedStat.currentLevel);

    statsWithActivities.push({
      ...updatedStat,
      activities,
      xpForNextLevel,
      totalXpForCurrentLevel,
      totalXpForNextLevel,
      currentLevelTitle: levelTitle?.title,
    });
  }

  return statsWithActivities;
}

/**
 * Get XP history for a stat
 */
export async function getStatXpHistory(statId: string, userId: string): Promise<XpGrant[]> {
  return db
    .select()
    .from(xpGrants)
    .where(and(eq(xpGrants.statId, statId), eq(xpGrants.userId, userId)))
    .orderBy(sql`${xpGrants.createdAt} DESC`);
}

/**
 * Create a new stat for a user
 */
export async function createStat(
  userId: string,
  name: string,
  description?: string,
  icon?: string,
  exampleActivities?: Record<string, { description: string; suggestedXp: number }[]>,
): Promise<Stat> {
  const [newStat] = await db
    .insert(stats)
    .values({
      userId,
      name: name.trim(),
      description: description?.trim(),
      icon: icon?.trim(),
      exampleActivities,
    })
    .returning();

  return newStat;
}

/**
 * Update a stat
 */
export async function updateStat(
  statId: string,
  userId: string,
  updates: Partial<Pick<Stat, 'name' | 'description' | 'icon' | 'exampleActivities'>>,
): Promise<Stat> {
  const [updatedStat] = await db
    .update(stats)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(stats.id, statId), eq(stats.userId, userId)))
    .returning();

  if (!updatedStat) {
    throw new Error('Stat not found');
  }

  return updatedStat;
}

/**
 * Delete a stat (and all related data)
 */
export async function deleteStat(statId: string, userId: string): Promise<void> {
  await db.delete(stats).where(and(eq(stats.id, statId), eq(stats.userId, userId)));
}

/**
 * Add an activity to a stat
 */
export async function addStatActivity(statId: string, description: string, suggestedXp: number = 10): Promise<StatActivity> {
  const [newActivity] = await db
    .insert(statActivities)
    .values({
      statId,
      description: description.trim(),
      suggestedXp,
    })
    .returning();

  return newActivity;
}

/**
 * Update a stat activity
 */
export async function updateStatActivity(activityId: string, updates: Partial<Pick<StatActivity, 'description' | 'suggestedXp'>>): Promise<StatActivity> {
  const [updatedActivity] = await db
    .update(statActivities)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(statActivities.id, activityId))
    .returning();

  if (!updatedActivity) {
    throw new Error('Activity not found');
  }

  return updatedActivity;
}

/**
 * Delete a stat activity
 */
export async function deleteStatActivity(activityId: string): Promise<void> {
  await db.delete(statActivities).where(eq(statActivities.id, activityId));
}
