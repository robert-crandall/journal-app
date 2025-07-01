/**
 * XP and Level Progression Calculation Utilities
 * 
 * Formula: Level N Total XP = ((N*(N+1))/2) × 100
 * - Level 1: 100 XP total (100 XP to reach)
 * - Level 2: 300 XP total (200 more XP to reach)
 * - Level 3: 600 XP total (300 more XP to reach)
 * - Level N: ((N*(N+1))/2) × 100 XP total
 */

export interface LevelCalculation {
  level: number
  xpRequired: number
  xpGained: number
}

export interface XpProgress {
  currentLevelXp: number      // XP within current level (0 to xpInCurrentLevel)
  xpInCurrentLevel: number    // Total XP range for current level
  progressPercent: number     // Percentage progress within current level
}

export interface LevelUpRewards {
  newLevel: number
  levelsGained: number
  levelProgression: LevelCalculation[]
}

/**
 * Calculate the total XP required to reach a specific level
 * Formula: ((level * (level + 1)) / 2) * 100
 */
export function calculateTotalXpForLevel(level: number): number {
  if (level < 0) {
    throw new Error('Level must be non-negative')
  }
  
  if (level === 0) return 0
  
  return ((level * (level + 1)) / 2) * 100
}

/**
 * Calculate the current level based on total XP
 * Uses inverse of the formula to find the highest level achievable
 */
export function calculateLevelFromTotalXp(totalXp: number): number {
  if (totalXp < 0) {
    throw new Error('Total XP cannot be negative')
  }
  
  if (totalXp === 0) return 1 // Start at level 1
  
  // Find the highest level where total XP requirement <= current XP
  let level = 1
  while (calculateTotalXpForLevel(level + 1) <= totalXp) {
    level++
  }
  
  return level
}

/**
 * Calculate XP needed to reach the next level
 */
export function calculateXpToNextLevel(currentXp: number, currentLevel: number): number {
  if (currentXp < 0) {
    throw new Error('Current XP cannot be negative')
  }
  
  if (currentLevel <= 0) {
    throw new Error('Current level must be positive')
  }
  
  const nextLevelTotalXp = calculateTotalXpForLevel(currentLevel + 1)
  return nextLevelTotalXp - currentXp
}

/**
 * Calculate progress within the current level
 */
export function calculateXpProgress(currentXp: number, currentLevel: number): XpProgress {
  if (currentXp < 0) {
    throw new Error('Current XP cannot be negative')
  }
  
  if (currentLevel <= 0) {
    throw new Error('Current level must be positive')
  }
  
  const currentLevelStartXp = currentLevel > 1 ? calculateTotalXpForLevel(currentLevel) : 0
  const nextLevelStartXp = calculateTotalXpForLevel(currentLevel + 1)
  
  const currentLevelXp = currentXp - currentLevelStartXp
  const xpInCurrentLevel = nextLevelStartXp - currentLevelStartXp
  const progressPercent = Math.round((currentLevelXp / xpInCurrentLevel) * 100)
  
  return {
    currentLevelXp: Math.max(0, currentLevelXp),
    xpInCurrentLevel,
    progressPercent: Math.min(100, Math.max(0, progressPercent))
  }
}

/**
 * Check if character is ready to level up
 */
export function isReadyToLevelUp(currentXp: number, currentLevel: number): boolean {
  if (currentXp < 0 || currentLevel <= 0) {
    return false
  }
  
  const nextLevelRequiredXp = calculateTotalXpForLevel(currentLevel + 1)
  return currentXp >= nextLevelRequiredXp
}

/**
 * Calculate level up rewards and progression when XP is gained
 * Handles multiple level ups if enough XP is gained
 */
export function calculateLevelUpRewards(totalXp: number, currentLevel: number): LevelUpRewards {
  if (totalXp < 0) {
    throw new Error('Total XP cannot be negative')
  }
  
  if (currentLevel <= 0) {
    throw new Error('Current level must be positive')
  }
  
  const newLevel = calculateLevelFromTotalXp(totalXp)
  const levelsGained = Math.max(0, newLevel - currentLevel)
  
  const levelProgression: LevelCalculation[] = []
  
  // Track each level gained
  for (let level = currentLevel + 1; level <= newLevel; level++) {
    levelProgression.push({
      level,
      xpRequired: calculateTotalXpForLevel(level),
      xpGained: totalXp
    })
  }
  
  return {
    newLevel,
    levelsGained,
    levelProgression
  }
}

/**
 * Get XP requirement for each level (utility for displaying level progression)
 */
export function getLevelXpRequirements(maxLevel: number = 20): Array<{level: number, totalXp: number, xpToReach: number}> {
  const requirements = []
  
  for (let level = 1; level <= maxLevel; level++) {
    const totalXp = calculateTotalXpForLevel(level)
    const previousTotalXp = level > 1 ? calculateTotalXpForLevel(level - 1) : 0
    const xpToReach = totalXp - previousTotalXp
    
    requirements.push({
      level,
      totalXp,
      xpToReach
    })
  }
  
  return requirements
}

/**
 * Calculate stat-specific XP awards based on difficulty and completion quality
 */
export function calculateStatXpAward(
  baseDifficulty: 'easy' | 'medium' | 'hard' | 'extreme',
  completionQuality: 'poor' | 'good' | 'excellent' = 'good',
  bonusMultiplier: number = 1.0
): number {
  // Base XP values
  const baseXp = {
    easy: 10,
    medium: 25,
    hard: 50,
    extreme: 100
  }
  
  // Quality multipliers
  const qualityMultipliers = {
    poor: 0.5,
    good: 1.0,
    excellent: 1.5
  }
  
  const xp = baseXp[baseDifficulty] * qualityMultipliers[completionQuality] * bonusMultiplier
  return Math.round(xp)
}

/**
 * Validate XP calculation inputs
 */
export function validateXpInputs(currentXp: number, currentLevel: number): {valid: boolean, error?: string} {
  if (currentXp < 0) {
    return { valid: false, error: 'Current XP cannot be negative' }
  }
  
  if (currentLevel <= 0) {
    return { valid: false, error: 'Current level must be positive' }
  }
  
  // Check if current XP is consistent with current level
  const expectedMinXp = currentLevel > 1 ? calculateTotalXpForLevel(currentLevel - 1) : 0
  const expectedMaxXp = calculateTotalXpForLevel(currentLevel) - 1
  
  if (currentXp < expectedMinXp) {
    return { 
      valid: false, 
      error: `Current XP (${currentXp}) is too low for level ${currentLevel}. Minimum required: ${expectedMinXp}` 
    }
  }
  
  if (currentXp > expectedMaxXp && !isReadyToLevelUp(currentXp, currentLevel)) {
    return { 
      valid: false, 
      error: `Current XP (${currentXp}) is too high for level ${currentLevel}. Should be leveled up.` 
    }
  }
  
  return { valid: true }
}
