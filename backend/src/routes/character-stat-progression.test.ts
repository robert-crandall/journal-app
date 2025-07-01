import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Character Stat Progression API', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatId: string

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    }).returning()
    testUserId = user.id

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Character',
      class: 'Wizard',
      backstory: 'A test character for progression tracking'
    }).returning()
    testCharacterId = character.id

    // Create test stat
    const [stat] = await db.insert(characterStats).values({
      characterId: testCharacterId,
      category: 'Physical Health',
      currentXp: 0,
      currentLevel: 1,
      totalXp: 0,
      description: 'Track physical fitness and health activities'
    }).returning()
    testStatId = stat.id
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(characterStats).where(eq(characterStats.characterId, testCharacterId))
    await db.delete(characters).where(eq(characters.id, testCharacterId))
    await db.delete(users).where(eq(users.id, testUserId))
  })

  describe('POST /api/characters/:characterId/stats/:statId/award-xp', () => {
    it('should award XP to a character stat', async () => {
      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: 50,
          reason: 'Completed morning workout'
        }),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.stat.currentXp).toBe(50)
      expect(result.data.stat.totalXp).toBe(50)
      expect(result.data.stat.currentLevel).toBe(1) // Still level 1, needs 100 XP total
      expect(result.data.xpAwarded).toBe(50)
      expect(result.data.reason).toBe('Completed morning workout')
    })

    it('should award XP and trigger level up when enough XP is gained', async () => {
      // Award 300 XP to trigger level up (level 2 requires 300 total XP)
      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: 300,
          reason: 'Intensive workout session'
        }),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.stat.currentXp).toBe(300)
      expect(result.data.stat.totalXp).toBe(300)
      expect(result.data.stat.currentLevel).toBe(2) // Should level up to 2
      expect(result.data.leveledUp).toBe(true)
      expect(result.data.newLevel).toBe(2)
    })

    it('should handle multiple level ups in single XP award', async () => {
      // Award 650 XP to trigger multiple level ups
      // Level 1: 100 total, Level 2: 300 total, Level 3: 600 total
      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: 650,
          reason: 'Major achievement'
        }),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.stat.currentXp).toBe(650)
      expect(result.data.stat.totalXp).toBe(650)
      expect(result.data.stat.currentLevel).toBe(3) // Should level up to 3
      expect(result.data.leveledUp).toBe(true)
      expect(result.data.newLevel).toBe(3)
      expect(result.data.levelsGained).toBe(2) // Gained 2 levels
    })

    it('should validate character ownership', async () => {
      // Create another user
      const [anotherUser] = await db.insert(users).values({
        email: `other-${Date.now()}@example.com`,
        name: 'Other User',
        timezone: 'UTC'
      }).returning()

      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: anotherUser.id,
          xpAmount: 50,
          reason: 'Unauthorized access attempt'
        }),
      })

      expect(response.status).toBe(404)
      // Only check for error message if response is JSON
      if (response.headers.get('content-type')?.includes('application/json')) {
        const result = await response.json()
        expect(result.message).toContain('Character not found')
      }

      // Clean up
      await db.delete(users).where(eq(users.id, anotherUser.id))
    })

    it('should validate input data', async () => {
      // Test negative XP
      const response1 = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: -10,
          reason: 'Negative XP test'
        }),
      })

      expect(response1.status).toBe(400)

      // Test missing required fields
      const response2 = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId
          // Missing xpAmount and reason
        }),
      })

      expect(response2.status).toBe(400)
    })

    it('should handle non-existent character or stat', async () => {
      const fakeCharacterId = '00000000-0000-0000-0000-000000000000'
      const fakeStatId = '00000000-0000-0000-0000-000000000000'

      const response = await app.request(`/api/characters/${fakeCharacterId}/stats/${fakeStatId}/award-xp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          xpAmount: 50,
          reason: 'Non-existent test'
        }),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/characters/:characterId/stats/:statId/progression', () => {
    beforeEach(async () => {
      // Set up stat with some progression
      await db.update(characterStats)
        .set({
          currentXp: 150,
          totalXp: 150,
          currentLevel: 2
        })
        .where(eq(characterStats.id, testStatId))
    })

    it('should retrieve stat progression details', async () => {
      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/progression?userId=${testUserId}`, {
        method: 'GET',
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.stat.currentXp).toBe(150)
      expect(result.data.stat.totalXp).toBe(150)
      expect(result.data.stat.currentLevel).toBe(2)
      
      // Should include progress calculations
      expect(result.data.progression).toBeDefined()
      expect(result.data.progression.xpToNextLevel).toBeDefined()
      expect(result.data.progression.progressPercent).toBeDefined()
      expect(result.data.progression.canLevelUp).toBeDefined()
    })

    it('should validate character ownership for progression view', async () => {
      // Create another user
      const [anotherUser] = await db.insert(users).values({
        email: `other-${Date.now()}@example.com`,
        name: 'Other User',
        timezone: 'UTC'
      }).returning()

      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/progression?userId=${anotherUser.id}`, {
        method: 'GET',
      })

      expect(response.status).toBe(403)

      // Clean up
      await db.delete(users).where(eq(users.id, anotherUser.id))
    })
  })

  describe('PUT /api/characters/:characterId/stats/:statId/progression', () => {
    it('should update stat XP and level directly', async () => {
      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/progression`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          currentXp: 350,
          totalXp: 350,
          currentLevel: 2,
          description: 'Updated description'
        }),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.currentXp).toBe(350)
      expect(result.data.totalXp).toBe(350)
      expect(result.data.currentLevel).toBe(2)
      expect(result.data.description).toBe('Updated description')
    })

    it('should validate XP and level consistency', async () => {
      // Test inconsistent XP and level (level 5 requires 1500 total XP)
      const response = await app.request(`/api/characters/${testCharacterId}/stats/${testStatId}/progression`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          currentXp: 100, // Not enough for level 5
          totalXp: 100,
          currentLevel: 5
        }),
      })

      expect(response.status).toBe(400)
      // Only check for error message if response is JSON
      if (response.headers.get('content-type')?.includes('application/json')) {
        const result = await response.json()
        expect(result.message).toContain('XP')
      }
    })
  })
})
