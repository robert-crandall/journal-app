import type { LevelCalculation } from '../types/stats';
import { db } from '../db';
import { characterStats, characterStatXpGrants } from '../db/schema/stats';
import { eq } from 'drizzle-orm';

/**
 * Calculate the total XP required to reach a specific level
 * Formula: Total XP for level n = 100 × (n × (n - 1)) / 2
 * Level 2: 100 XP total
 * Level 3: 300 XP total (200 additional)
 * Level 4: 600 XP total (300 additional)
 */
export function getTotalXpForLevel(level: number): number {
  if (level < 2) return 0;
  return (100 * (level * (level - 1))) / 2;
}

/**
 * Calculate the XP required to advance from one level to the next
 * Formula: XP for level n = level * 100
 * Level 1 to 2: 200 XP
 * Level 2 to 3: 300 XP
 * Level 3 to 4: 400 XP
 */
export function getXpRequiredForLevel(level: number): number {
  if (level < 2) return 0;
  return (level - 1) * 100;
}

/**
 * Calculate what level a user should be at based on their total XP
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (totalXp < 100) return 1;

  let level = 1;
  while (getTotalXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * Calculate comprehensive level information for a stat
 */
export function calculateLevelInfo(currentLevel: number, totalXp: number): LevelCalculation {
  // Calculate what level they should actually be at based on XP
  const actualLevel = getLevelFromTotalXp(totalXp);

  // Current level XP is the XP they have beyond what was needed for the current level
  const currentLevelStartXp = currentLevel > 1 ? getTotalXpForLevel(currentLevel - 1) : 0;
  const currentLevelXp = totalXp - currentLevelStartXp;

  // XP required for next level
  const nextLevelTotalXp = getTotalXpForLevel(currentLevel + 1);
  const xpToNextLevel = Math.max(0, nextLevelTotalXp - totalXp);

  // Can level up if they have enough XP for the next level
  const canLevelUp = totalXp >= getTotalXpForLevel(currentLevel + 1);

  return {
    level: currentLevel,
    totalXpRequired: getTotalXpForLevel(currentLevel + 1),
    currentLevelXp,
    xpToNextLevel,
    canLevelUp,
  };
}

/**
 * Validate that a level up is allowed (user has enough XP)
 */
export function canLevelUp(currentLevel: number, totalXp: number): boolean {
  const nextLevelRequiredXp = getTotalXpForLevel(currentLevel + 1);
  return totalXp >= nextLevelRequiredXp;
}

/**
 * Calculate how many levels a user could potentially advance to
 */
export function getMaxPossibleLevel(totalXp: number): number {
  return getLevelFromTotalXp(totalXp);
}

/**
 * Get XP progress as a percentage for UI display
 */
export function getXpProgressPercentage(currentLevel: number, totalXp: number): number {
  const currentLevelStartXp = currentLevel > 1 ? getTotalXpForLevel(currentLevel - 1) : 0;
  const nextLevelStartXp = getTotalXpForLevel(currentLevel + 1);
  const levelXpRange = nextLevelStartXp - currentLevelStartXp;
  const currentLevelXp = totalXp - currentLevelStartXp;

  if (levelXpRange === 0) return 100;
  return Math.min(100, Math.max(0, (currentLevelXp / levelXpRange) * 100));
}

/**
 * Grant XP to a specific stat for a user
 */
export async function grantXpToStat(
  userId: string,
  statId: string | null,
  xpAmount: number,
  sourceType: string,
  sourceId?: string,
  reason?: string
): Promise<void> {
  if (!statId || xpAmount <= 0) {
    return;
  }

  // Create XP grant record for audit trail
  await db.insert(characterStatXpGrants).values({
    userId,
    statId,
    xpAmount,
    sourceType,
    sourceId,
    reason,
  });

  // Update the stat's total XP
  const [stat] = await db
    .select()
    .from(characterStats)
    .where(eq(characterStats.id, statId));

  if (stat) {
    const newTotalXp = stat.totalXp + xpAmount;
    await db
      .update(characterStats)
      .set({
        totalXp: newTotalXp,
        updatedAt: new Date(),
      })
      .where(eq(characterStats.id, statId));
  }
}
