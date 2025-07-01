import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Character Dashboard API - Task 2.9', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatIds: string[] = []

  beforeEach(async () => {
    // Create test user
    const testUserData = await createTestUser({
      email: `test-dashboard-${Date.now()}@example.com`,
      name: 'Dashboard Test User',
      timezone: 'UTC'
    })
    testUserId = testUserData.user.id

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Dashboard Test Character',
      class: 'Paladin',
      backstory: 'A well-rounded character for dashboard testing',
      isActive: true
    }).returning()
    testCharacterId = character.id

    // Create multiple test stats with different progression levels
    const statsToCreate = [
      {
        category: 'Physical Health',
        currentXp: 150,
        currentLevel: 2,
        totalXp: 350, // Level 2 + some progress
        levelTitle: 'Fitness Enthusiast',
        description: 'Track physical fitness and health activities'
      },
      {
        category: 'Mental Wellbeing',
        currentXp: 50,
        currentLevel: 1,
        totalXp: 50, // Just started
        levelTitle: 'Mindful Beginner',
        description: 'Track meditation and mental health activities'
      },
      {
        category: 'Social Connections',
        currentXp: 200,
        currentLevel: 3,
        totalXp: 650, // Level 3 + good progress
        levelTitle: 'Social Butterfly',
        description: 'Track relationship and social activities'
      },
      {
        category: 'Career Development',
        currentXp: 25,
        currentLevel: 1,
        totalXp: 25, // Very little progress
        levelTitle: 'Career Novice',
        description: 'Track professional growth activities'
      },
      {
        category: 'Hobbies & Creativity',
        currentXp: 75,
        currentLevel: 1,
        totalXp: 270, // Close to level 2 (needs 300 total XP), so 30 XP to next level
        levelTitle: 'Creative Spark',
        description: 'Track creative and hobby activities'
      }
    ]

    for (const statData of statsToCreate) {
      const [stat] = await db.insert(characterStats).values({
        characterId: testCharacterId,
        ...statData
      }).returning()
      testStatIds.push(stat.id)
    }

    // Update one stat to be "recently updated" (within last week)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    await db.update(characterStats)
      .set({ updatedAt: yesterday })
      .where(eq(characterStats.id, testStatIds[0]))

    // Update other stats to be older than 7 days
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    
    for (let i = 1; i < testStatIds.length; i++) {
      await db.update(characterStats)
        .set({ updatedAt: tenDaysAgo })
        .where(eq(characterStats.id, testStatIds[i]))
    }
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(characterStats).where(eq(characterStats.characterId, testCharacterId))
    await db.delete(characters).where(eq(characters.id, testCharacterId))
    await db.delete(users).where(eq(users.id, testUserId))
  })

  describe('GET /api/characters/:id/dashboard', () => {
    it('should return comprehensive character dashboard data', async () => {
      const response = await app.request(
        `/api/characters/${testCharacterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      // Verify main structure
      expect(data).toHaveProperty('character')
      expect(data).toHaveProperty('overview')
      expect(data).toHaveProperty('recommendations')

      // Verify character data
      expect(data.character.id).toBe(testCharacterId)
      expect(data.character.name).toBe('Dashboard Test Character')
      expect(data.character.class).toBe('Paladin')
      expect(data.character.stats).toHaveLength(5)

      // Verify stats have progression data
      const firstStat = data.character.stats[0]
      expect(firstStat).toHaveProperty('progression')
      expect(firstStat.progression).toHaveProperty('xpProgress')
      expect(firstStat.progression).toHaveProperty('xpToNextLevel')
      expect(firstStat.progression).toHaveProperty('nextLevelTotalXp')
      expect(firstStat.progression).toHaveProperty('progressPercent')

      // Verify overview calculations
      expect(data.overview.totalStats).toBe(5)
      expect(data.overview.totalXpAcrossAllStats).toBe(1345) // Sum of all totalXp (350+50+650+25+270)
      expect(data.overview.averageLevel).toBeCloseTo(1.6) // (2+1+3+1+1)/5 = 1.6

      // Verify highest and lowest stats
      expect(data.overview.highestLevelStat.category).toBe('Social Connections')
      expect(data.overview.highestLevelStat.level).toBe(3)
      expect(data.overview.lowestLevelStat.level).toBe(1)

      // Verify recent activity tracking
      expect(data.overview.recentActivity.statsUpdatedLastWeek).toBe(1)
      expect(data.overview.recentActivity.recentlyUpdatedStats).toHaveLength(1)
    })

    it('should return recommendations for character improvement', async () => {
      const response = await app.request(
        `/api/characters/${testCharacterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      // Verify focus areas (should suggest lowest level stat)
      expect(data.recommendations.focusAreas).toHaveLength(1)
      expect(data.recommendations.focusAreas[0]).toHaveProperty('category')
      expect(data.recommendations.focusAreas[0]).toHaveProperty('suggestion')
      expect(data.recommendations.focusAreas[0].currentLevel).toBe(1)

      // Verify next milestones (stats close to leveling up)
      expect(data.recommendations.nextMilestones).toBeInstanceOf(Array)
      
      // Find the "Hobbies & Creativity" stat which should be close to level up (270/300 XP)
      // This stat needs 30 XP to reach level 2, so it should be in nextMilestones
      const closeToLevelUp = data.recommendations.nextMilestones.find(
        (milestone: any) => milestone.category === 'Hobbies & Creativity'
      )
      expect(closeToLevelUp).toBeDefined()
      expect(closeToLevelUp.xpToNextLevel).toBe(30) // 300 - 270 = 30 XP to level 2
    })

    it('should handle character not found', async () => {
      // Use a valid UUID format but non-existent ID
      const response = await app.request(
        `/api/characters/123e4567-e89b-12d3-a456-426614174000/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      expect(response.status).toBe(404)
      const error = await response.text()
      expect(error).toContain('Character not found')
    })

    it('should handle unauthorized access to character', async () => {
      // Create another user
      const anotherUserData = await createTestUser({
        email: `another-user-${Date.now()}@example.com`,
        name: 'Another User',
        timezone: 'UTC'
      })
      const anotherUser = anotherUserData.user

      const response = await app.request(
        `/api/characters/${testCharacterId}/dashboard?userId=${anotherUser.id}`,
        { method: 'GET' }
      )

      expect(response.status).toBe(404)
      const error = await response.text()
      expect(error).toContain('Character not found')

      // Cleanup
      await db.delete(users).where(eq(users.id, anotherUser.id))
    })

    it('should handle missing userId parameter', async () => {
      const response = await app.request(
        `/api/characters/${testCharacterId}/dashboard`,
        { method: 'GET' }
      )

      expect(response.status).toBe(400)
      const error = await response.text()
      expect(error).toContain('User ID is required')
    })

    it('should handle character with no stats', async () => {
      // Create a character with no stats
      const [emptyCharacter] = await db.insert(characters).values({
        userId: testUserId,
        name: 'Empty Character',
        class: 'Rogue',
        backstory: 'A character with no stats for testing'
      }).returning()

      const response = await app.request(
        `/api/characters/${emptyCharacter.id}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.character.stats).toHaveLength(0)
      expect(data.overview.totalStats).toBe(0)
      expect(data.overview.totalXpAcrossAllStats).toBe(0)
      expect(data.overview.averageLevel).toBe(1)
      expect(data.overview.highestLevelStat).toBeNull()
      expect(data.overview.lowestLevelStat).toBeNull()
      expect(data.recommendations.focusAreas).toHaveLength(0)
      expect(data.recommendations.nextMilestones).toHaveLength(0)

      // Cleanup
      await db.delete(characters).where(eq(characters.id, emptyCharacter.id))
    })

    it('should calculate XP progression correctly for each stat', async () => {
      const response = await app.request(
        `/api/characters/${testCharacterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      // Find the Physical Health stat (Level 2, 350 total XP)
      const physicalStat = data.character.stats.find(
        (stat: any) => stat.category === 'Physical Health'
      )
      expect(physicalStat).toBeDefined()
      expect(physicalStat.currentLevel).toBe(2)
      expect(physicalStat.totalXp).toBe(350)
      
      // Level 2 starts at 300 XP, so current level XP should be 50
      expect(physicalStat.progression.xpProgress.currentLevelXp).toBe(50)
      // Level 2 to Level 3 requires 300 XP (600 - 300)
      expect(physicalStat.progression.xpProgress.xpInCurrentLevel).toBe(300)
      // Progress should be 50/300 = 16.67% ≈ 17%
      expect(physicalStat.progression.progressPercent).toBe(17)
      // XP to next level: 600 - 350 = 250
      expect(physicalStat.progression.xpToNextLevel).toBe(250)

      // Find the Social Connections stat (Level 3, 650 total XP)
      const socialStat = data.character.stats.find(
        (stat: any) => stat.category === 'Social Connections'
      )
      expect(socialStat).toBeDefined()
      expect(socialStat.currentLevel).toBe(3)
      expect(socialStat.totalXp).toBe(650)
      
      // Level 3 starts at 600 XP, so current level XP should be 50
      expect(socialStat.progression.xpProgress.currentLevelXp).toBe(50)
      // Level 3 to Level 4 requires 400 XP (1000 - 600)
      expect(socialStat.progression.xpProgress.xpInCurrentLevel).toBe(400)
      // Progress should be 50/400 = 12.5% ≈ 13%
      expect(socialStat.progression.progressPercent).toBe(13)
      // XP to next level: 1000 - 650 = 350
      expect(socialStat.progression.xpToNextLevel).toBe(350)
    })
  })
})
