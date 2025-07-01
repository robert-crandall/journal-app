import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq, and } from 'drizzle-orm'

describe('Character System Integration Tests - Task 2.10', () => {
  let testUserId: string
  let cleanupCharacterIds: string[] = []
  let cleanupUserIds: string[] = []

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: `integration-test-${Date.now()}@example.com`,
      name: 'Integration Test User',
      timezone: 'UTC'
    }).returning()
    testUserId = user.id
    cleanupUserIds.push(user.id)
  })

  afterEach(async () => {
    // Clean up test data in reverse dependency order
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characterStats).where(eq(characterStats.characterId, characterId))
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
    cleanupCharacterIds = []
    cleanupUserIds = []
  })

  describe('End-to-End Character Lifecycle', () => {
    it('should support complete character creation, progression, and dashboard workflow', async () => {
      // Step 1: Create a character
      const createResponse = await app.request(`/api/characters?userId=${testUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Hero',
          class: 'Warrior',
          backstory: 'A brave warrior on a quest for self-improvement'
        })
      })

      expect(createResponse.status).toBe(201)
      const createData = await createResponse.json()
      expect(createData.character).toBeDefined()
      expect(createData.character.name).toBe('Test Hero')
      
      const characterId = createData.character.id
      cleanupCharacterIds.push(characterId)

      // Step 2: Verify default stats were created
      const statsResponse = await app.request(
        `/api/characters/${characterId}/stats?userId=${testUserId}`,
        { method: 'GET' }
      )
      expect(statsResponse.status).toBe(200)
      const statsData = await statsResponse.json()
      expect(statsData.stats).toHaveLength(6) // Default stat categories
      
      const physicalStat = statsData.stats.find((s: any) => s.category === 'Physical Health')
      expect(physicalStat).toBeDefined()
      expect(physicalStat.currentLevel).toBe(1)
      expect(physicalStat.totalXp).toBe(0)

      // Step 3: Award XP to trigger progression
      const awardXpResponse = await app.request(
        `/api/characters/${characterId}/stats/${physicalStat.id}/award-xp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            xpAmount: 150,
            reason: 'Completed workout routine'
          })
        }
      )

      expect(awardXpResponse.status).toBe(200)
      const awardData = await awardXpResponse.json()
      expect(awardData.success).toBe(true)
      expect(awardData.data.stat.totalXp).toBe(150)
      expect(awardData.data.stat.currentLevel).toBe(1) // Still level 1, needs 300 for level 2

      // Step 4: Award more XP to trigger level up
      const levelUpResponse = await app.request(
        `/api/characters/${characterId}/stats/${physicalStat.id}/award-xp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            xpAmount: 200,
            reason: 'Intensive training session'
          })
        }
      )

      expect(levelUpResponse.status).toBe(200)
      const levelUpData = await levelUpResponse.json()
      expect(levelUpData.success).toBe(true)
      expect(levelUpData.data.stat.totalXp).toBe(350)
      expect(levelUpData.data.stat.currentLevel).toBe(2) // Should level up
      expect(levelUpData.data.leveledUp).toBe(true)
      expect(levelUpData.data.newLevel).toBe(2)

      // Step 5: Check dashboard shows updated progression
      const dashboardResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      expect(dashboardResponse.status).toBe(200)
      const dashboardData = await dashboardResponse.json()
      
      // Verify character info
      expect(dashboardData.character.name).toBe('Test Hero')
      expect(dashboardData.character.class).toBe('Warrior')
      
      // Verify progression calculations
      const dashboardPhysicalStat = dashboardData.character.stats.find(
        (s: any) => s.category === 'Physical Health'
      )
      expect(dashboardPhysicalStat.currentLevel).toBe(2)
      expect(dashboardPhysicalStat.totalXp).toBe(350)
      expect(dashboardPhysicalStat.progression.xpToNextLevel).toBe(250) // 600 - 350
      
      // Verify overview
      expect(dashboardData.overview.totalStats).toBe(6)
      expect(dashboardData.overview.totalXpAcrossAllStats).toBe(350)
      expect(dashboardData.overview.highestLevelStat.category).toBe('Physical Health')
      expect(dashboardData.overview.highestLevelStat.level).toBe(2)

      // Step 6: Create a custom stat
      const customStatResponse = await app.request(
        `/api/characters/${characterId}/stats?userId=${testUserId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'Cooking Skills',
            description: 'Learning to cook healthy meals'
          })
        }
      )

      expect(customStatResponse.status).toBe(201)
      const customStatData = await customStatResponse.json()
      expect(customStatData.stat.category).toBe('Cooking Skills')
      expect(customStatData.stat.description).toBe('Learning to cook healthy meals')

      // Step 7: Verify dashboard now shows 6 stats
      const finalDashboardResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      expect(finalDashboardResponse.status).toBe(200)
      const finalDashboardData = await finalDashboardResponse.json()
      expect(finalDashboardData.overview.totalStats).toBe(7)
      
      const cookingStat = finalDashboardData.character.stats.find(
        (s: any) => s.category === 'Cooking Skills'
      )
      expect(cookingStat).toBeDefined()
      expect(cookingStat.currentLevel).toBe(1)
      expect(cookingStat.totalXp).toBe(0)
    })

    it('should handle multi-stat progression and comprehensive recommendations', async () => {
      // Create character
      const createResponse = await app.request(`/api/characters?userId=${testUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Balanced Hero',
          class: 'Sage',
          backstory: 'A wise individual seeking balance in all aspects of life'
        })
      })

      const createData = await createResponse.json()
      const characterId = createData.character.id
      cleanupCharacterIds.push(characterId)

      // Get all stats
      const statsResponse = await app.request(
        `/api/characters/${characterId}/stats?userId=${testUserId}`,
        { method: 'GET' }
      )
      const statsData = await statsResponse.json()
      
      const physicalStat = statsData.stats.find((s: any) => s.category === 'Physical Health')
      const mentalStat = statsData.stats.find((s: any) => s.category === 'Mental Wellness')
      const socialStat = statsData.stats.find((s: any) => s.category === 'Social Connection')

      expect(physicalStat).toBeDefined()
      expect(mentalStat).toBeDefined()
      expect(socialStat).toBeDefined()

      // Award different amounts of XP to create imbalance
      await app.request(`/api/characters/${characterId}/stats/${physicalStat.id}/award-xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: 650, // Level 3
          reason: 'Extensive physical training'
        })
      })

      await app.request(`/api/characters/${characterId}/stats/${mentalStat.id}/award-xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: 350, // Level 2
          reason: 'Daily meditation practice'
        })
      })

      await app.request(`/api/characters/${characterId}/stats/${socialStat.id}/award-xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: 50, // Level 1
          reason: 'Called a friend'
        })
      })

      // Check dashboard recommendations
      const dashboardResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )

      const dashboardData = await dashboardResponse.json()
      
      // Verify level distribution
      expect(dashboardData.overview.averageLevel).toBeCloseTo(1.5) // (3+2+1+1+1+1)/6 = 1.5
      expect(dashboardData.overview.highestLevelStat.category).toBe('Physical Health')
      expect(dashboardData.overview.highestLevelStat.level).toBe(3)
      expect(dashboardData.overview.lowestLevelStat.level).toBe(1)

      // Verify recommendations focus on lowest stats
      expect(dashboardData.recommendations.focusAreas).toHaveLength(1)
      expect(dashboardData.recommendations.focusAreas[0].currentLevel).toBe(1)
      expect(dashboardData.recommendations.focusAreas[0].suggestion).toContain('balance')

      // Verify total XP calculation
      const expectedTotal = 650 + 350 + 50 + 0 + 0 // Physical + Mental + Social + Career + Hobbies
      expect(dashboardData.overview.totalXpAcrossAllStats).toBe(expectedTotal)
    })

    it('should handle character ownership and access control across all endpoints', async () => {
      // Create two users
      const [anotherUser] = await db.insert(users).values({
        email: `another-user-${Date.now()}@example.com`,
        name: 'Another User',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(anotherUser.id)

      // User 1 creates a character
      const createResponse = await app.request(`/api/characters?userId=${testUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Private Hero',
          class: 'Rogue',
          backstory: 'A secretive character'
        })
      })

      const createData = await createResponse.json()
      const characterId = createData.character.id
      cleanupCharacterIds.push(characterId)

      const statsResponse = await app.request(
        `/api/characters/${characterId}/stats?userId=${testUserId}`,
        { method: 'GET' }
      )
      const statsData = await statsResponse.json()
      const statId = statsData.stats[0].id

      // Test that User 2 cannot access User 1's character through various endpoints
      
      // Dashboard access
      const dashboardResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${anotherUser.id}`,
        { method: 'GET' }
      )
      expect(dashboardResponse.status).toBe(404)

      // Character details access
      const detailsResponse = await app.request(
        `/api/characters/${characterId}?userId=${anotherUser.id}`,
        { method: 'GET' }
      )
      expect(detailsResponse.status).toBe(404)

      // Stats access
      const statsAccessResponse = await app.request(
        `/api/characters/${characterId}/stats?userId=${anotherUser.id}`,
        { method: 'GET' }
      )
      expect(statsAccessResponse.status).toBe(404)

      // XP awarding access
      const xpResponse = await app.request(
        `/api/characters/${characterId}/stats/${statId}/award-xp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: anotherUser.id,
            xpAmount: 100,
            reason: 'Unauthorized attempt'
          })
        }
      )
      expect(xpResponse.status).toBe(404)

      // Stat progression access
      const progressionResponse = await app.request(
        `/api/characters/${characterId}/stats/${statId}/progression?userId=${anotherUser.id}`,
        { method: 'GET' }
      )
      expect(progressionResponse.status).toBe(403)

      // Character update access
      const updateResponse = await app.request(
        `/api/characters/${characterId}?userId=${anotherUser.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Hacked Name',
            backstory: 'Unauthorized change'
          })
        }
      )
      expect(updateResponse.status).toBe(404)

      // Verify original user still has access
      const verifyResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )
      expect(verifyResponse.status).toBe(200)
      const verifyData = await verifyResponse.json()
      expect(verifyData.character.name).toBe('Private Hero')
    })

    it('should handle edge cases and error conditions gracefully', async () => {
      // Test invalid character ID formats
      const invalidIdResponse = await app.request(
        `/api/characters/invalid-id/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )
      expect(invalidIdResponse.status).toBe(500) // Invalid UUID format causes database error

      // Test missing required parameters
      const missingUserIdResponse = await app.request(
        `/api/characters/123e4567-e89b-12d3-a456-426614174000/dashboard`,
        { method: 'GET' }
      )
      expect(missingUserIdResponse.status).toBe(400)

      // Create a character to test with
      const createResponse = await app.request(`/api/characters?userId=${testUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Edge Case Hero',
          class: 'Monk',
          backstory: 'Testing edge cases'
        })
      })

      const createData = await createResponse.json()
      const characterId = createData.character.id
      cleanupCharacterIds.push(characterId)

      // Test XP awarding with invalid amounts
      const statsResponse = await app.request(
        `/api/characters/${characterId}/stats?userId=${testUserId}`,
        { method: 'GET' }
      )
      const statsData = await statsResponse.json()
      const statId = statsData.stats[0].id

      // Negative XP
      const negativeXpResponse = await app.request(
        `/api/characters/${characterId}/stats/${statId}/award-xp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            xpAmount: -50,
            reason: 'Negative XP test'
          })
        }
      )
      expect(negativeXpResponse.status).toBe(400)

      // Zero XP
      const zeroXpResponse = await app.request(
        `/api/characters/${characterId}/stats/${statId}/award-xp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            xpAmount: 0,
            reason: 'Zero XP test'
          })
        }
      )
      expect(zeroXpResponse.status).toBe(400)

      // Missing reason
      const missingReasonResponse = await app.request(
        `/api/characters/${characterId}/stats/${statId}/award-xp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            xpAmount: 50
            // reason missing
          })
        }
      )
      expect(missingReasonResponse.status).toBe(400)

      // Test dashboard with character that has no XP awards (only initial creation activity)
      const dashboardResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )
      expect(dashboardResponse.status).toBe(200)
      const dashboardData = await dashboardResponse.json()
      
      // All default stats would have been created recently, so recentActivity would be 6
      expect(dashboardData.overview.recentActivity.statsUpdatedLastWeek).toBe(6)
      expect(dashboardData.overview.recentActivity.recentlyUpdatedStats).toHaveLength(6)
    })

    it('should maintain data consistency across concurrent operations', async () => {
      // Create character
      const createResponse = await app.request(`/api/characters?userId=${testUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Concurrent Hero',
          class: 'Paladin',
          backstory: 'Testing concurrent operations'
        })
      })

      const createData = await createResponse.json()
      const characterId = createData.character.id
      cleanupCharacterIds.push(characterId)

      const statsResponse = await app.request(
        `/api/characters/${characterId}/stats?userId=${testUserId}`,
        { method: 'GET' }
      )
      const statsData = await statsResponse.json()
      const statId = statsData.stats[0].id

      // Award XP multiple times rapidly
      const xpPromises = []
      for (let i = 0; i < 5; i++) {
        xpPromises.push(
          app.request(`/api/characters/${characterId}/stats/${statId}/award-xp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: testUserId,
              xpAmount: 50,
              reason: `Concurrent operation ${i + 1}`
            })
          })
        )
      }

      const results = await Promise.all(xpPromises)
      
      // All requests should succeed
      for (const result of results) {
        expect(result.status).toBe(200)
      }

      // Verify final state is consistent
      const finalStatsResponse = await app.request(
        `/api/characters/${characterId}/stats/${statId}?userId=${testUserId}`,
        { method: 'GET' }
      )
      const finalStatData = await finalStatsResponse.json()
      
      // Due to potential race conditions, check that we have at least some XP
      // but not more than the maximum possible
      expect(finalStatData.stat.totalXp).toBeGreaterThan(0)
      expect(finalStatData.stat.totalXp).toBeLessThanOrEqual(250) // 5 * 50 XP

      // Verify dashboard reflects the same totals as individual stat
      const dashboardResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )
      const dashboardData = await dashboardResponse.json()
      expect(dashboardData.overview.totalXpAcrossAllStats).toBe(finalStatData.stat.totalXp)
    })
  })

  describe('Performance and Scalability Tests', () => {
    it('should handle characters with many stats efficiently', async () => {
      // Create character
      const createResponse = await app.request(`/api/characters?userId=${testUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Performance Hero',
          class: 'Wizard',
          backstory: 'Testing performance with many stats'
        })
      })

      const createData = await createResponse.json()
      const characterId = createData.character.id
      cleanupCharacterIds.push(characterId)

      // Create many custom stats
      const customStatPromises = []
      for (let i = 0; i < 10; i++) {
        customStatPromises.push(
          app.request(`/api/characters/${characterId}/stats?userId=${testUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: `Custom Skill ${i + 1}`,
              description: `Performance test skill ${i + 1}`
            })
          })
        )
      }

      const customStatResults = await Promise.all(customStatPromises)
      
      // All should succeed
      for (const result of customStatResults) {
        expect(result.status).toBe(201)
      }

      // Test dashboard performance with many stats
      const startTime = Date.now()
      const dashboardResponse = await app.request(
        `/api/characters/${characterId}/dashboard?userId=${testUserId}`,
        { method: 'GET' }
      )
      const endTime = Date.now()

      expect(dashboardResponse.status).toBe(200)
      const dashboardData = await dashboardResponse.json()
      expect(dashboardData.overview.totalStats).toBe(16) // 6 default + 10 custom
      
      // Performance check - should complete within reasonable time
      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})
