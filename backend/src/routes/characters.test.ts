import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'bun:test'
import { testClient } from 'hono/testing'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Character API Integration Tests', () => {
  const client = testClient(app)
  let testUserId: string

  beforeAll(async () => {
    // Create a test user
    const testUserData = await createTestUser({
      email: 'character-test@example.com',
      name: 'Character Test User',
      timezone: 'UTC',
    })
    testUserId = testUserData.user.id
  })

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId))
    }
  })

  beforeEach(async () => {
    // Clean up any existing characters for the test user
    await db.delete(characters).where(eq(characters.userId, testUserId))
  })

  test('GET /api/characters/classes should return available character classes', async () => {
    const res = await client.api.characters.classes.$get()
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.classes).toBeDefined()
    expect(Array.isArray(data.classes)).toBe(true)
    expect(data.classes.length).toBeGreaterThan(0)
    expect(data.classes).toContain('Life Explorer')
    expect(data.count).toBe(data.classes.length)
  })

  test('GET /api/characters should return empty array for user with no characters', async () => {
    const res = await client.api.characters.$get({
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.characters).toBeDefined()
    expect(Array.isArray(data.characters)).toBe(true)
    expect(data.characters.length).toBe(0)
  })

  test('GET /api/characters should require userId', async () => {
    const res = await client.api.characters.$get()
    
    expect(res.status).toBe(400)
    // Clone response to check both JSON and text without "Body already used" error
    const clonedRes = res.clone()
    try {
      const data = await res.json()
      expect(data.message).toBe('User ID is required')
    } catch {
      // If parsing fails, check the response text using cloned response
      const text = await clonedRes.text()
      expect(text).toContain('User ID is required')
    }
  })

  test('POST /api/characters should create a character with default stats', async () => {
    const characterData = {
      name: 'Test Hero',
      class: 'Life Explorer',
      backstory: 'A brave adventurer on a quest for better life balance.'
    }

    const res = await client.api.characters.$post({
      json: characterData,
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(201)
    const data = await res.json()
    
    expect(data.character).toBeDefined()
    expect(data.character.name).toBe(characterData.name)
    expect(data.character.class).toBe(characterData.class)
    expect(data.character.backstory).toBe(characterData.backstory)
    expect(data.character.isActive).toBe(true)
    expect(data.character.userId).toBe(testUserId)
    
    // Should have default stats
    expect(data.character.stats).toBeDefined()
    expect(Array.isArray(data.character.stats)).toBe(true)
    expect(data.character.stats.length).toBe(6) // 6 default stat categories
    
    // Check default stat categories
    const statCategories = data.character.stats.map((stat: any) => stat.category)
    expect(statCategories).toContain('Physical Health')
    expect(statCategories).toContain('Mental Wellness')
    expect(statCategories).toContain('Family Bonding')
    expect(statCategories).toContain('Professional Growth')
    expect(statCategories).toContain('Creative Expression')
    expect(statCategories).toContain('Social Connection')
    
    // Each stat should have sample activities
    data.character.stats.forEach((stat: any) => {
      expect(stat.sampleActivities).toBeDefined()
      expect(Array.isArray(stat.sampleActivities)).toBe(true)
      expect(stat.sampleActivities.length).toBeGreaterThan(0)
    })
  })

  test('POST /api/characters should validate required fields', async () => {
    const invalidData = {
      name: '', // Empty name
      class: 'Life Explorer'
    }

    const res = await client.api.characters.$post({
      json: invalidData,
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(400)
  })

  test('POST /api/characters should prevent multiple active characters', async () => {
    // Create first character
    const firstCharacter = {
      name: 'First Hero',
      class: 'Life Explorer'
    }

    const res1 = await client.api.characters.$post({
      json: firstCharacter,
      query: { userId: testUserId }
    })
    expect(res1.status).toBe(201)

    // Try to create second character
    const secondCharacter = {
      name: 'Second Hero',
      class: 'Daily Adventurer'
    }

    const res2 = await client.api.characters.$post({
      json: secondCharacter,
      query: { userId: testUserId }
    })
    
    expect(res2.status).toBe(409)
    // Clone response to check both JSON and text without "Body already used" error
    const clonedRes2 = res2.clone()
    try {
      const data = await res2.json()
      expect(data.message).toContain('already has an active character')
    } catch {
      // If parsing fails, check the response text using cloned response
      const text = await clonedRes2.text()
      expect(text).toContain('already has an active character')
    }
  })

  test('GET /api/characters/:id should return character with stats', async () => {
    // Create a character first
    const characterData = {
      name: 'Test Hero',
      class: 'Life Explorer'
    }

    const createRes = await client.api.characters.$post({
      json: characterData,
      query: { userId: testUserId }
    })
    expect(createRes.status).toBe(201)
    const createData = await createRes.json()
    const characterId = createData.character.id

    // Get the character
    const res = await client.api.characters[':id'].$get({
      param: { id: characterId },
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.character).toBeDefined()
    expect(data.character.id).toBe(characterId)
    expect(data.character.stats).toBeDefined()
    expect(Array.isArray(data.character.stats)).toBe(true)
    expect(data.character.stats.length).toBe(6)
  })

  test('GET /api/characters/:id should return 404 for non-existent character', async () => {
    const fakeId = '00000000-0000-4000-8000-000000000000'
    
    const res = await client.api.characters[':id'].$get({
      param: { id: fakeId },
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(404)
    // Clone response to check both JSON and text without "Body already used" error
    const clonedRes = res.clone()
    try {
      const data = await res.json()
      expect(data.message).toBe('Character not found')
    } catch {
      // If parsing fails, check the response text using cloned response
      const text = await clonedRes.text()
      expect(text).toContain('Character not found')
    }
  })

  test('PUT /api/characters/:id should update character', async () => {
    // Create a character first
    const characterData = {
      name: 'Test Hero',
      class: 'Life Explorer'
    }

    const createRes = await client.api.characters.$post({
      json: characterData,
      query: { userId: testUserId }
    })
    const createData = await createRes.json()
    const characterId = createData.character.id

    // Update the character
    const updateData = {
      name: 'Updated Hero',
      backstory: 'An updated backstory for our hero.'
    }

    const res = await client.api.characters[':id'].$put({
      param: { id: characterId },
      json: updateData,
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.character.name).toBe(updateData.name)
    expect(data.character.backstory).toBe(updateData.backstory)
    expect(data.character.class).toBe(characterData.class) // Should remain unchanged
  })

  test('DELETE /api/characters/:id should deactivate character', async () => {
    // Create a character first
    const characterData = {
      name: 'Test Hero',
      class: 'Life Explorer'
    }

    const createRes = await client.api.characters.$post({
      json: characterData,
      query: { userId: testUserId }
    })
    const createData = await createRes.json()
    const characterId = createData.character.id

    // Deactivate the character
    const res = await client.api.characters[':id'].$delete({
      param: { id: characterId },
      query: { userId: testUserId }
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.message).toContain('deactivated successfully')
    expect(data.character.isActive).toBe(false)
  })

  test('Character operations should verify user ownership', async () => {
    // Create another test user with unique email
    const [otherUser] = await db.insert(users).values({
      email: `other-user-${Date.now()}@example.com`,
      name: 'Other User'
    }).returning()

    // Create a character for the first user
    const characterData = {
      name: 'Test Hero',
      class: 'Life Explorer'
    }

    const createRes = await client.api.characters.$post({
      json: characterData,
      query: { userId: testUserId }
    })
    const createData = await createRes.json()
    const characterId = createData.character.id

    // Try to access with different user
    const getRes = await client.api.characters[':id'].$get({
      param: { id: characterId },
      query: { userId: otherUser.id }
    })
    
    expect(getRes.status).toBe(404) // Should not find character

    // Clean up
    await db.delete(users).where(eq(users.id, otherUser.id))
  })
})
