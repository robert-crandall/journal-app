import { test, expect, describe } from 'bun:test'
import { 
  calculateTotalXpForLevel, 
  calculateLevelFromTotalXp, 
  calculateXpToNextLevel, 
  calculateXpProgress, 
  calculateLevelUpRewards,
  isReadyToLevelUp,
  type LevelCalculation,
  type XpProgress
} from './xp-calculator'

describe('XP Calculator Utilities', () => {
  describe('calculateTotalXpForLevel', () => {
    test('should calculate total XP for various levels using formula: N * (N + 1) / 2 * 100', () => {
      expect(calculateTotalXpForLevel(1)).toBe(100)  // 1 * 2 / 2 * 100 = 100
      expect(calculateTotalXpForLevel(2)).toBe(300)  // 2 * 3 / 2 * 100 = 300
      expect(calculateTotalXpForLevel(3)).toBe(600)  // 3 * 4 / 2 * 100 = 600
      expect(calculateTotalXpForLevel(4)).toBe(1000) // 4 * 5 / 2 * 100 = 1000
      expect(calculateTotalXpForLevel(5)).toBe(1500) // 5 * 6 / 2 * 100 = 1500
      expect(calculateTotalXpForLevel(10)).toBe(5500) // 10 * 11 / 2 * 100 = 5500
      expect(calculateTotalXpForLevel(20)).toBe(21000) // 20 * 21 / 2 * 100 = 21000
    })

    test('should handle edge cases', () => {
      expect(calculateTotalXpForLevel(0)).toBe(0)
      expect(() => calculateTotalXpForLevel(-1)).toThrow('Level must be non-negative')
    })
  })

  describe('calculateLevelFromTotalXp', () => {
    test('should calculate correct level from total XP', () => {
      expect(calculateLevelFromTotalXp(0)).toBe(1)   // Start at level 1
      expect(calculateLevelFromTotalXp(50)).toBe(1)  // Below level 2 threshold
      expect(calculateLevelFromTotalXp(100)).toBe(1) // Exactly level 1
      expect(calculateLevelFromTotalXp(250)).toBe(1) // Between level 1 and 2
      expect(calculateLevelFromTotalXp(300)).toBe(2) // Exactly level 2
      expect(calculateLevelFromTotalXp(500)).toBe(2) // Between level 2 and 3
      expect(calculateLevelFromTotalXp(600)).toBe(3) // Exactly level 3
      expect(calculateLevelFromTotalXp(800)).toBe(3) // Between level 3 and 4
      expect(calculateLevelFromTotalXp(1000)).toBe(4) // Exactly level 4
      expect(calculateLevelFromTotalXp(5500)).toBe(10) // Level 10
    })

    test('should handle negative XP', () => {
      expect(() => calculateLevelFromTotalXp(-100)).toThrow('Total XP cannot be negative')
    })
  })

  describe('calculateXpToNextLevel', () => {
    test('should calculate XP needed to reach next level', () => {
      expect(calculateXpToNextLevel(0, 1)).toBe(300)  // Need 300 XP to reach level 2 from level 1 with 0 XP
      expect(calculateXpToNextLevel(50, 1)).toBe(250)  // Need 250 more XP to reach level 2 from level 1 with 50 XP
      expect(calculateXpToNextLevel(100, 1)).toBe(200) // Need 200 more XP to reach level 2 from level 1 with 100 XP
      expect(calculateXpToNextLevel(250, 2)).toBe(350)  // Need 350 more XP to reach level 3 from level 2 with 250 XP
      expect(calculateXpToNextLevel(300, 2)).toBe(300) // Need 300 more XP to reach level 3 from level 2 with 300 XP
      expect(calculateXpToNextLevel(500, 3)).toBe(500) // Need 500 more XP to reach level 4 from level 3 with 500 XP
    })

    test('should handle edge cases', () => {
      expect(() => calculateXpToNextLevel(-100, 1)).toThrow('Current XP cannot be negative')
      expect(() => calculateXpToNextLevel(100, 0)).toThrow('Current level must be positive')
      expect(() => calculateXpToNextLevel(100, -1)).toThrow('Current level must be positive')
    })
  })

  describe('calculateXpProgress', () => {
    test('should calculate XP progress within current level', () => {
      // Level 1 with 50 XP: 50 XP into level 1 (0-300 XP range = 300 XP)
      let progress = calculateXpProgress(50, 1)
      expect(progress.currentLevelXp).toBe(50)
      expect(progress.xpInCurrentLevel).toBe(300)
      expect(progress.progressPercent).toBe(17) // 50/300 ≈ 16.67% rounded to 17%

      // Level 2 with 400 XP: 100 XP into level 2 (300-600 XP range = 300 XP)  
      progress = calculateXpProgress(400, 2)
      expect(progress.currentLevelXp).toBe(100) // 400 - 300 = 100
      expect(progress.xpInCurrentLevel).toBe(300) // 600 - 300 = 300
      expect(progress.progressPercent).toBe(33) // 100/300 ≈ 33.33% rounded to 33%

      // Level 3 with 700 XP: 100 XP into level 3 (600-1000 XP range = 400 XP)
      progress = calculateXpProgress(700, 3)
      expect(progress.currentLevelXp).toBe(100) // 700 - 600 = 100
      expect(progress.xpInCurrentLevel).toBe(400) // 1000 - 600 = 400
      expect(progress.progressPercent).toBe(25) // 100/400 = 25%
    })

    test('should handle exact level boundaries', () => {
      // Exactly at level 1 with 100 XP (100/300 = 33%)
      let progress = calculateXpProgress(100, 1)
      expect(progress.currentLevelXp).toBe(100)
      expect(progress.xpInCurrentLevel).toBe(300)
      expect(progress.progressPercent).toBe(33)

      // Exactly at level 2 start with 300 XP (0/300 = 0%)
      progress = calculateXpProgress(300, 2)
      expect(progress.currentLevelXp).toBe(0) // 300 - 300 = 0 (just reached level 2)
      expect(progress.xpInCurrentLevel).toBe(300) // 600 - 300 = 300
      expect(progress.progressPercent).toBe(0) // 0/300 = 0%
    })
  })

  describe('isReadyToLevelUp', () => {
    test('should correctly identify when ready to level up', () => {
      expect(isReadyToLevelUp(100, 1)).toBe(false) // 100 XP at level 1, need 300 XP for level 2
      expect(isReadyToLevelUp(300, 1)).toBe(true)  // 300 XP at level 1, ready for level 2
      expect(isReadyToLevelUp(600, 2)).toBe(true)  // 600 XP at level 2, ready for level 3
      expect(isReadyToLevelUp(599, 2)).toBe(false) // 599 XP at level 2, not enough for level 3

      // Multiple level progression
      expect(isReadyToLevelUp(700, 1)).toBe(true)  // Can go from level 1 to level 3
      expect(isReadyToLevelUp(1500, 1)).toBe(true) // Can go from level 1 to level 5
    })

    test('should handle edge cases', () => {
      expect(isReadyToLevelUp(0, 1)).toBe(false)
      expect(isReadyToLevelUp(50, 0)).toBe(false) // Invalid level
      expect(isReadyToLevelUp(-100, 1)).toBe(false) // Invalid XP
    })
  })

  describe('calculateLevelUpRewards', () => {
    test('should calculate single level progression', () => {
      const rewards = calculateLevelUpRewards(300, 1)
      
      expect(rewards.newLevel).toBe(2)
      expect(rewards.levelsGained).toBe(1)
      expect(rewards.levelProgression).toHaveLength(1)
      expect(rewards.levelProgression[0]).toEqual({
        level: 2,
        xpRequired: 300,
        xpGained: 300
      })
    })

    test('should calculate multiple level progression', () => {
      // Going from level 1 with 700 XP should reach level 3
      const rewards = calculateLevelUpRewards(700, 1)
      
      expect(rewards.newLevel).toBe(3)
      expect(rewards.levelsGained).toBe(2)
      expect(rewards.levelProgression).toEqual([
        { level: 2, xpRequired: 300, xpGained: 700 },
        { level: 3, xpRequired: 600, xpGained: 700 }
      ])
    })

    test('should handle large level jumps', () => {
      // Going from level 1 with 1500 XP should reach level 5
      const rewards = calculateLevelUpRewards(1500, 1)
      
      expect(rewards.newLevel).toBe(5)
      expect(rewards.levelsGained).toBe(4)
      expect(rewards.levelProgression).toHaveLength(4)
      expect(rewards.levelProgression[0]).toEqual({
        level: 2,
        xpRequired: 300,
        xpGained: 1500
      })
      expect(rewards.levelProgression[3]).toEqual({
        level: 5,
        xpRequired: 1500,
        xpGained: 1500
      })
    })

    test('should handle no level up scenario', () => {
      const rewards = calculateLevelUpRewards(250, 1)
      
      expect(rewards.newLevel).toBe(1)
      expect(rewards.levelsGained).toBe(0)
      expect(rewards.levelProgression).toHaveLength(0)
    })
  })

  describe('XP Formula Validation', () => {
    test('should validate the progression formula matches specification', () => {
      // Level differences should match: Level N requires (N-1)*100 more XP than previous level
      expect(calculateTotalXpForLevel(2) - calculateTotalXpForLevel(1)).toBe(200) // Level 2 requires 200 more
      expect(calculateTotalXpForLevel(3) - calculateTotalXpForLevel(2)).toBe(300) // Level 3 requires 300 more
      expect(calculateTotalXpForLevel(4) - calculateTotalXpForLevel(3)).toBe(400) // Level 4 requires 400 more
      expect(calculateTotalXpForLevel(5) - calculateTotalXpForLevel(4)).toBe(500) // Level 5 requires 500 more
    })

    test('should validate cumulative XP requirements', () => {
      // Verify the cumulative XP matches the triangular number formula
      for (let level = 1; level <= 10; level++) {
        const expectedXp = (level * (level + 1) / 2) * 100
        expect(calculateTotalXpForLevel(level)).toBe(expectedXp)
      }
    })
  })

  describe('Integration Tests', () => {
    test('should handle complete level progression cycle', () => {
      let currentLevel = 1
      let totalXp = 0

      // Add XP incrementally and verify level progression
      totalXp = 50
      expect(calculateLevelFromTotalXp(totalXp)).toBe(1)
      expect(isReadyToLevelUp(totalXp, currentLevel)).toBe(false)

      totalXp = 100
      expect(calculateLevelFromTotalXp(totalXp)).toBe(1)
      expect(isReadyToLevelUp(totalXp, currentLevel)).toBe(false)

      totalXp = 250
      expect(calculateLevelFromTotalXp(totalXp)).toBe(1)
      expect(isReadyToLevelUp(totalXp, currentLevel)).toBe(false)

      totalXp = 300
      expect(calculateLevelFromTotalXp(totalXp)).toBe(2)
      expect(isReadyToLevelUp(totalXp, currentLevel)).toBe(true)
      currentLevel = 2

      totalXp = 800
      expect(calculateLevelFromTotalXp(totalXp)).toBe(3)
      expect(isReadyToLevelUp(totalXp, currentLevel)).toBe(true)
      
      const rewards = calculateLevelUpRewards(totalXp, currentLevel)
      expect(rewards.newLevel).toBe(3)
      expect(rewards.levelsGained).toBe(1)
    })
  })
})
