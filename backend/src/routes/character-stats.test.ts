import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'bun:test'
import { testClient } from 'hono/testing'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq, and } from 'drizzle-orm'

describe('Character Stats Management API Integration Tests', () => {
  const client = testClient<typeof app>(app)
  let testUserId: string
  let testCharacterId: string

  beforeAll(async () => {
    // Create a test user
    const testUserData = await createTestUser({
      email: 'stats-test@example.com',
      name: 'Stats Test User',
      timezone: 'UTC',
    })
    testUserId = testUserData.user.id

    // Create a test character (which will auto-create default stats)
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Hero',
      class: 'Life Explorer',
      isActive: true,
    }).returning()
    testCharacterId = character.id

    // Create default stats manually for testing
    const defaultStats = [
      {
        characterId: testCharacterId,
        category: 'Physical Health',
        description: 'Activities that improve physical fitness and wellbeing',
        sampleActivities: ['Take a 30-minute walk', 'Do 15 push-ups', 'Stretch for 10 minutes']
      },
      {
        characterId: testCharacterId,
        category: 'Mental Wellness',
        description: 'Activities that support mental health and mindfulness',
        sampleActivities: ['Meditate for 10 minutes', 'Journal about your day', 'Practice deep breathing']
      },
      {
        characterId: testCharacterId,
        category: 'Family Bonding',
        description: 'Quality time and activities with family members',
        sampleActivities: ['Play a board game', 'Cook a meal together', 'Take family photos']
      }
    ]
    await db.insert(characterStats).values(defaultStats)
  })

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId))
    }
  })

  test('GET /api/characters/:id/stats should return all character stats', async () => {
    const res = await client.api.characters[':id'].stats.$get({
      param: { id: testCharacterId },
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.stats).toBeDefined()
    expect(Array.isArray(data.stats)).toBe(true)
    expect(data.stats.length).toBe(3)
    
    // Check stat structure
    const stat = data.stats[0]
    expect(stat.id).toBeDefined()
    expect(stat.category).toBeDefined()
    expect(stat.currentXp).toBeDefined()
    expect(stat.currentLevel).toBeDefined()
    expect(stat.totalXp).toBeDefined()
    expect(stat.description).toBeDefined()
    expect(stat.sampleActivities).toBeDefined()
  })

  test('GET /api/characters/:id/stats/:statId should return individual stat', async () => {
    // Get all stats first to get a valid statId
    const statsRes = await client.api.characters[':id'].stats.$get({
      param: { id: testCharacterId },
      query: { userId: testUserId }
    })
    const { stats } = await statsRes.json()
    const statId = stats[0].id

    const res = await client.api.characters[':id'].stats[':statId'].$get({
      param: { id: testCharacterId, statId: statId },
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.stat).toBeDefined()
    expect(data.stat.id).toBe(statId)
    expect(data.stat.category).toBe('Physical Health')
  })

  test('PUT /api/characters/:id/stats/:statId should update stat details', async () => {
    // Get a stat to update
    const statsRes = await client.api.characters[':id'].stats.$get({
      param: { id: testCharacterId },
      query: { userId: testUserId }
    })
    const { stats } = await statsRes.json()
    const statId = stats[0].id

    const updateData = {
      category: 'Physical Fitness',
      description: 'Updated description for physical activities',
      sampleActivities: ['Updated activity 1', 'Updated activity 2', 'Updated activity 3']
    }

    const res = await client.api.characters[':id'].stats[':statId'].$put({
      param: { id: testCharacterId, statId: statId },
      query: { userId: testUserId },
      json: updateData
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.stat.category).toBe('Physical Fitness')
    expect(data.stat.description).toBe('Updated description for physical activities')
    expect(data.stat.sampleActivities).toEqual(['Updated activity 1', 'Updated activity 2', 'Updated activity 3'])
  })

  test('POST /api/characters/:id/stats should create new custom stat', async () => {
    const newStat = {
      category: 'Custom Hobby',
      description: 'Custom hobby activities',
      sampleActivities: ['Custom activity 1', 'Custom activity 2']
    }

    const res = await client.api.characters[':id'].stats.$post({
      param: { id: testCharacterId },
      query: { userId: testUserId },
      json: newStat
    })
    
    expect(res.status).toBe(201)
    const data = await res.json()
    
    expect(data.stat).toBeDefined()
    expect(data.stat.category).toBe('Custom Hobby')
    expect(data.stat.description).toBe('Custom hobby activities')
    expect(data.stat.currentXp).toBe(0)
    expect(data.stat.currentLevel).toBe(1)
    expect(data.stat.totalXp).toBe(0)
  })

  test('POST /api/characters/:id/stats should validate required fields', async () => {
    const invalidStat = {
      description: 'Missing category'
    }

    const res = await client.api.characters[':id'].stats.$post({
      param: { id: testCharacterId },
      query: { userId: testUserId },
      json: invalidStat
    })
    
    expect(res.status).toBe(400)
  })

  test('DELETE /api/characters/:id/stats/:statId should deactivate custom stat', async () => {
    // Create a custom stat first
    const newStat = {
      category: 'Deletable Stat',
      description: 'This will be deleted',
      sampleActivities: ['Activity 1']
    }

    const createRes = await client.api.characters[':id'].stats.$post({
      param: { id: testCharacterId },
      query: { userId: testUserId },
      json: newStat
    })
    const { stat } = await createRes.json()

    // Delete the custom stat
    const res = await client.api.characters[':id'].stats[':statId'].$delete({
      param: { id: testCharacterId, statId: stat.id },
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain('deleted')

    // Verify it's no longer returned in the stats list
    const statsRes = await client.api.characters[':id'].stats.$get({
      param: { id: testCharacterId },
      query: { userId: testUserId }
    })
    const { stats } = await statsRes.json()
    
    const deletedStat = stats.find((s: any) => s.id === stat.id)
    expect(deletedStat).toBeUndefined()
  })

  test('Stats operations should verify character ownership', async () => {
    // Create another user
    const [otherUser] = await db.insert(users).values({
      email: 'other-stats-test@example.com',
      name: 'Other User',
      timezone: 'UTC',
    }).returning()

    const res = await client.api.characters[':id'].stats.$get({
      param: { id: testCharacterId },
      query: { userId: otherUser.id }
    })
    
    expect(res.status).toBe(404)

    // Clean up other user
    await db.delete(users).where(eq(users.id, otherUser.id))
  })

  test('Should prevent deletion of predefined stat categories', async () => {
    // Try to delete a default stat - first check what stats exist
    const statsRes = await client.api.characters[':id'].stats.$get({
      param: { id: testCharacterId },
      query: { userId: testUserId }
    })
    const { stats } = await statsRes.json()
    
    // Find any predefined stat (Physical Health, Mental Wellness, or Family Bonding)
    const defaultStat = stats.find((s: any) => 
      ['Physical Health', 'Mental Wellness', 'Family Bonding'].includes(s.category)
    )

    // Make sure we found a default stat
    expect(defaultStat).toBeDefined()

    const res = await client.api.characters[':id'].stats[':statId'].$delete({
      param: { id: testCharacterId, statId: defaultStat.id },
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(400)
    // Clone response to check both JSON and text without "Body already used" error
    const clonedRes = res.clone()
    try {
      const data = await res.json()
      expect(data.message).toContain('Cannot delete predefined stat')
    } catch {
      // If parsing fails, check the response text using cloned response
      const text = await clonedRes.text()
      expect(text).toContain('Cannot delete predefined stat')
    }
  })
})
