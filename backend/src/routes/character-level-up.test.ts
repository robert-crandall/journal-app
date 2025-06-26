import { test, expect, describe, beforeEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats } from '../db/schema'
import { eq, and } from 'drizzle-orm'

describe('Character Level-Up System Integration Tests', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatIds: string[] = []

  beforeEach(async () => {
    // Clean up previous test data
    await db.delete(characterStats)
    await db.delete(characters)
    await db.delete(users)

    // Create test user
    const [user] = await db.insert(users).values({
      email: 'levelup@test.com',
      name: 'Level Up Test User'
    }).returning()
    testUserId = user.id

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Levelup Hero',
      class: 'Warrior'
    }).returning()
    testCharacterId = character.id

    // Create test stats with enough XP to level up
    const statInserts = [
      {
        characterId: testCharacterId,
        category: 'Physical Fitness',
        currentXp: 0,
        currentLevel: 1,
        totalXp: 400, // Enough for level 2 (300 total XP)
        description: 'Physical activities and exercise'
      },
      {
        characterId: testCharacterId,
        category: 'Learning',
        currentXp: 0,
        currentLevel: 1,
        totalXp: 700, // Enough for level 3 (600 total XP)
        description: 'Educational and skill development activities'
      },
      {
        characterId: testCharacterId,
        category: 'Social',
        currentXp: 0,
        currentLevel: 2,
        totalXp: 1200, // Enough for level 4 (1000 total XP)
        description: 'Social interactions and relationships'
      }
    ]

    const insertedStats = await db.insert(characterStats).values(statInserts).returning()
    testStatIds = insertedStats.map(stat => stat.id)
  })

  test('GET /api/characters/:id/level-up-opportunities should identify stats ready for level up', async () => {
    const res = await app.request(`/api/characters/${testCharacterId}/level-up-opportunities?userId=${testUserId}`)
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.opportunities).toHaveLength(3) // All 3 stats can level up
    
    // Check Physical Fitness (level 1 -> 2)
    const physicalStat = data.opportunities.find((opp: any) => opp.category === 'Physical Fitness')
    expect(physicalStat).toBeDefined()
    expect(physicalStat.currentLevel).toBe(1)
    expect(physicalStat.newLevel).toBe(2)
    expect(physicalStat.totalXp).toBe(400)
    expect(physicalStat.canLevelUp).toBe(true)
    
    // Check Learning (level 1 -> 3, skipping level 2)
    const learningStat = data.opportunities.find((opp: any) => opp.category === 'Learning')
    expect(learningStat).toBeDefined()
    expect(learningStat.currentLevel).toBe(1)
    expect(learningStat.newLevel).toBe(3)
    expect(learningStat.totalXp).toBe(700)
    expect(learningStat.canLevelUp).toBe(true)
    
    // Check Social (level 2 -> 4, skipping level 3)
    const socialStat = data.opportunities.find((opp: any) => opp.category === 'Social')
    expect(socialStat).toBeDefined()
    expect(socialStat.currentLevel).toBe(2)
    expect(socialStat.newLevel).toBe(4)
    expect(socialStat.totalXp).toBe(1200)
    expect(socialStat.canLevelUp).toBe(true)
  })

  test('POST /api/characters/:id/level-up should level up a single stat', async () => {
    const physicalStatId = testStatIds[0]
    
    const res = await app.request(`/api/characters/${testCharacterId}/level-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        statId: physicalStatId
      })
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.levelUpResult.category).toBe('Physical Fitness')
    expect(data.levelUpResult.oldLevel).toBe(1)
    expect(data.levelUpResult.newLevel).toBe(2)
    expect(data.levelUpResult.levelsGained).toBe(1)
    
    // Level title should be generated (but may be undefined if AI fails)
    if (data.levelUpResult.levelTitle) {
      expect(typeof data.levelUpResult.levelTitle).toBe('string')
    }
    
    // Verify database was updated
    const [updatedStat] = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.id, physicalStatId))
    
    expect(updatedStat.currentLevel).toBe(2)
    expect(updatedStat.totalXp).toBe(400)
  })

  test('POST /api/characters/:id/level-up should handle multi-level progression', async () => {
    const learningStatId = testStatIds[1]
    
    const res = await app.request(`/api/characters/${testCharacterId}/level-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        statId: learningStatId
      })
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.levelUpResult.category).toBe('Learning')
    expect(data.levelUpResult.oldLevel).toBe(1)
    expect(data.levelUpResult.newLevel).toBe(3)
    expect(data.levelUpResult.levelsGained).toBe(2)
    expect(data.levelUpResult.levelProgression).toHaveLength(2)
    
    // Verify progression details
    expect(data.levelUpResult.levelProgression[0].level).toBe(2)
    expect(data.levelUpResult.levelProgression[1].level).toBe(3)
    
    // Verify database was updated
    const [updatedStat] = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.id, learningStatId))
    
    expect(updatedStat.currentLevel).toBe(3)
    expect(updatedStat.totalXp).toBe(700)
  })

  test('POST /api/characters/:id/level-up-all should level up all eligible stats', async () => {
    const res = await app.request(`/api/characters/${testCharacterId}/level-up-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId
      })
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.levelUpResults).toHaveLength(3)
    
    // Verify all stats were leveled up
    const physicalResult = data.levelUpResults.find((result: any) => result.category === 'Physical Fitness')
    expect(physicalResult.newLevel).toBe(2)
    
    const learningResult = data.levelUpResults.find((result: any) => result.category === 'Learning')
    expect(learningResult.newLevel).toBe(3)
    
    const socialResult = data.levelUpResults.find((result: any) => result.category === 'Social')
    expect(socialResult.newLevel).toBe(4)
    
    // Verify level titles were generated for all stats
    data.levelUpResults.forEach((result: any) => {
      if (result.levelTitle) {
        expect(typeof result.levelTitle).toBe('string')
        expect(result.levelTitle.length).toBeGreaterThan(0)
      }
    })
    
    // Verify database was updated for all stats
    const updatedStats = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.characterId, testCharacterId))
    
    expect(updatedStats.find(s => s.category === 'Physical Fitness')?.currentLevel).toBe(2)
    expect(updatedStats.find(s => s.category === 'Learning')?.currentLevel).toBe(3)
    expect(updatedStats.find(s => s.category === 'Social')?.currentLevel).toBe(4)
  })

  test('POST /api/characters/:id/level-up should require stat to be ready for level up', async () => {
    // First level up the stat, then try to level it up again
    const physicalStatId = testStatIds[0]
    
    // Level up once
    await app.request(`/api/characters/${testCharacterId}/level-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        statId: physicalStatId
      })
    })
    
    // Try to level up again (should fail since not enough XP)
    const res = await app.request(`/api/characters/${testCharacterId}/level-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        statId: physicalStatId
      })
    })
    
    expect(res.status).toBe(400)
    const errorText = await res.text()
    expect(errorText).toContain('not ready for level up')
  })

  test('Level-up operations should verify character ownership', async () => {
    // Create different user
    const [otherUser] = await db.insert(users).values({
      email: 'other@test.com',
      name: 'Other Test User'
    }).returning()
    
    const res = await app.request(`/api/characters/${testCharacterId}/level-up-opportunities?userId=${otherUser.id}`)
    
    expect(res.status).toBe(404)
    const errorText = await res.text()
    expect(errorText).toBe('Character not found')
  })

  test('POST /api/characters/:id/level-up should validate required fields', async () => {
    const res = await app.request(`/api/characters/${testCharacterId}/level-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId
        // Missing statId
      })
    })
    
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.issues.some((issue: any) => issue.path.includes('statId'))).toBe(true)
  })

  test('GET /api/characters/:id/level-up-opportunities should return empty array when no level-ups available', async () => {
    // Update all stats to have insufficient XP
    await db
      .update(characterStats)
      .set({ totalXp: 50, currentLevel: 1 })
      .where(eq(characterStats.characterId, testCharacterId))
    
    const res = await app.request(`/api/characters/${testCharacterId}/level-up-opportunities?userId=${testUserId}`)
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.opportunities).toHaveLength(0)
  })

  test('POST /api/characters/:id/level-up should generate AI level titles', async () => {
    const physicalStatId = testStatIds[0]
    
    const res = await app.request(`/api/characters/${testCharacterId}/level-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        statId: physicalStatId
      })
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.levelUpResult.category).toBe('Physical Fitness')
    expect(data.levelUpResult.newLevel).toBe(2)
    
    // Verify level title was generated
    expect(data.levelUpResult.levelTitle).toBeDefined()
    expect(typeof data.levelUpResult.levelTitle).toBe('string')
    expect(data.levelUpResult.levelTitle.length).toBeGreaterThan(0)
    
    // Verify database was updated with level title
    const [updatedStat] = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.id, physicalStatId))
    
    expect(updatedStat.currentLevel).toBe(2)
    expect(updatedStat.levelTitle).toBe(data.levelUpResult.levelTitle)
    expect(updatedStat.levelTitle).toBeDefined()
  })
})
