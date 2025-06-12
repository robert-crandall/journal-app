/**
 * Calculate character level from XP
 * Uses a simple XP formula: Level = floor(sqrt(XP / 100)) + 1
 */
export function calculateLevel(xp: number): number {
	if (xp <= 0) return 1;
	return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function calculateXpForLevel(level: number): number {
	if (level <= 1) return 100;
	return Math.pow(level - 1, 2) * 100;
}

/**
 * Calculate XP needed to reach next level from current XP
 */
export function calculateXpToNextLevel(currentXp: number): number {
	const currentLevel = calculateLevel(currentXp);
	const nextLevelXp = calculateXpForLevel(currentLevel + 1);
	return nextLevelXp - currentXp;
}

/**
 * Format XP amount for display
 */
export function formatXp(xp: number): string {
	if (xp >= 1000000) {
		return `${(xp / 1000000).toFixed(1)}M`;
	}
	if (xp >= 1000) {
		return `${(xp / 1000).toFixed(1)}K`;
	}
	return xp.toString();
}

/**
 * Calculate progress percentage for level progression
 */
export function calculateLevelProgress(currentXp: number): number {
	const currentLevel = calculateLevel(currentXp);
	const currentLevelXp = calculateXpForLevel(currentLevel);
	const nextLevelXp = calculateXpForLevel(currentLevel + 1);
	
	const progressXp = currentXp - currentLevelXp;
	const totalXpNeeded = nextLevelXp - currentLevelXp;
	
	return Math.min(100, Math.max(0, (progressXp / totalXpNeeded) * 100));
}
