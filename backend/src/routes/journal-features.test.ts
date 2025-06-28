import { describe, test, expect, beforeEach } from 'bun:test'
import { testClient } from 'hono/testing'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, journalConversations } from '../db/schema'
import { eq } from 'drizzle-orm'

describe('Journal System Features Integration Tests', () => {
  let testUserId: string
  let characterId: string
  let client: any

  beforeEach(async () => {
    // Create test client
    client = testClient(app)

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        name: 'Test User',
        email: `test-${Date.now()}@example.com` // Make email unique
      })
      .returning()
    testUserId = user.id

    // Create test character
    const [character] = await db
      .insert(characters)
      .values({
        userId: testUserId,
        name: 'Test Hero',
        class: 'Paladin' // Note: schema uses 'class' not 'characterClass'
      })
      .returning()
    characterId = character.id

    // Create test character stats
    await db.insert(characterStats).values([
      {
        characterId: characterId,
        category: 'Fitness',
        currentXp: 150,
        currentLevel: 3,
        totalXp: 850,
        description: 'Physical fitness and exercise'
      },
      {
        characterId: characterId,
        category: 'Learning',
        currentXp: 200,
        currentLevel: 4,
        totalXp: 1200,
        description: 'Education and skill development'
      },
      {
        characterId: characterId,
        category: 'Creativity',
        currentXp: 50,
        currentLevel: 2,
        totalXp: 300,
        description: 'Creative activities and projects'
      }
    ])
  })

  test('Task 5.5-5.7: Content tags, stat tags, and XP awards integration', async () => {
    // Start a journal conversation
    const conversationRes = await client.api.journal.conversations.$post({
      json: { userId: testUserId }
    })
    expect(conversationRes.status).toBe(201)
    const conversation = await conversationRes.json()
    const conversationId = conversation.data.conversation.id

    // Add a message about fitness and learning
    const messageRes = await client.api.journal.conversations[':id'].messages.$post({
      param: { id: conversationId },
      json: {
        userId: testUserId,
        content: 'I went for a 5-mile run this morning and then spent 2 hours learning Python programming. I feel accomplished and energized! I achieved my fitness goals and made great progress on my coding skills.',
        role: 'user'
      }
    })
    expect(messageRes.status).toBe(201)

    // Get stats before ending conversation
    const statsBefore = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.characterId, characterId))

    // End the conversation to trigger processing
    const endRes = await client.api.journal.conversations[':id'].end.$put({
      param: { id: conversationId },
      json: { userId: testUserId }
    })
    expect(endRes.status).toBe(200)
    const endResult = await endRes.json()

    // Verify conversation was processed
    expect(endResult.success).toBe(true)
    expect(endResult.data.conversation).toBeDefined()
    expect(endResult.data.conversation.title).toBeDefined()
    expect(endResult.data.conversation.summary).toBeDefined()
    expect(endResult.data.conversation.synopsis).toBeDefined()

    // Verify content tags were optimized
    expect(endResult.data.conversation.contentTags).toBeDefined()
    expect(Array.isArray(endResult.data.conversation.contentTags)).toBe(true)
    console.log('Content tags:', endResult.data.conversation.contentTags)

    // Verify stat tags only contain existing user stats
    expect(endResult.data.conversation.statTags).toBeDefined()
    expect(Array.isArray(endResult.data.conversation.statTags)).toBe(true)
    
    const validStatCategories = ['Fitness', 'Learning', 'Creativity']
    for (const statTag of endResult.data.conversation.statTags) {
      expect(validStatCategories).toContain(statTag)
    }
    console.log('Stat tags:', endResult.data.conversation.statTags)

    // Verify XP awards were generated
    expect(endResult.data.xpAwards).toBeDefined()
    expect(Array.isArray(endResult.data.xpAwards)).toBe(true)
    
    if (endResult.data.xpAwards.length > 0) {
      console.log('XP awards:', endResult.data.xpAwards)
      
      // Check that XP was actually awarded
      const statsAfter = await db
        .select()
        .from(characterStats)
        .where(eq(characterStats.characterId, characterId))

      // At least one stat should have gained XP
      let xpGained = false
      for (let i = 0; i < statsBefore.length; i++) {
        const before = statsBefore.find(s => s.id === statsAfter[i].id)
        const after = statsAfter[i]
        
        if (before && after.totalXp > before.totalXp) {
          xpGained = true
          console.log(`${after.category}: ${before.totalXp} → ${after.totalXp} (+${after.totalXp - before.totalXp} XP)`)
        }
      }
      
      expect(xpGained).toBe(true)
    }
  })

  test('Task 5.7: Negative XP awards for struggling content', async () => {
    // Start a journal conversation
    const conversationRes = await client.api.journal.conversations.$post({
      json: { userId: testUserId }
    })
    expect(conversationRes.status).toBe(201)
    const conversation = await conversationRes.json()
    const conversationId = conversation.data.conversation.id

    // Add a message about struggling with fitness
    const messageRes = await client.api.journal.conversations[':id'].messages.$post({
      param: { id: conversationId },
      json: {
        userId: testUserId,
        content: 'I failed to go to the gym again today. I keep making excuses and avoiding my fitness routine. I feel frustrated and disappointed in myself for not sticking to my health goals.',
        role: 'user'
      }
    })
    expect(messageRes.status).toBe(201)

    // Get stats before ending conversation
    const statsBefore = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.characterId, characterId))

    // End the conversation to trigger processing
    const endRes = await client.api.journal.conversations[':id'].end.$put({
      param: { id: conversationId },
      json: { userId: testUserId }
    })
    expect(endRes.status).toBe(200)
    const endResult = await endRes.json()

    // Verify XP awards include negative XP
    if (endResult.data.xpAwards.length > 0) {
      console.log('XP awards for negative content:', endResult.data.xpAwards)
      
      // Check for negative XP awards
      const negativeAwards = endResult.data.xpAwards.filter((award: any) => award.xpAmount < 0)
      console.log('Negative XP awards:', negativeAwards)
      
      // Should have at least one negative XP award
      expect(negativeAwards.length).toBeGreaterThan(0)
    }
  })

  test('Task 5.6: Stat tags validation - only existing stats allowed', async () => {
    // Start a journal conversation
    const conversationRes = await client.api.journal.conversations.$post({
      json: { userId: testUserId }
    })
    expect(conversationRes.status).toBe(201)
    const conversation = await conversationRes.json()
    const conversationId = conversation.data.conversation.id

    // Add a message that might suggest non-existent stat categories
    const messageRes = await client.api.journal.conversations[':id'].messages.$post({
      param: { id: conversationId },
      json: {
        userId: testUserId,
        content: 'Today I practiced advanced quantum physics, mastered underwater basket weaving, and completed my certification in dragon taming. I also worked on my cooking, meditation, and woodworking skills.',
        role: 'user'
      }
    })
    expect(messageRes.status).toBe(201)

    // End the conversation to trigger processing
    const endRes = await client.api.journal.conversations[':id'].end.$put({
      param: { id: conversationId },
      json: { userId: testUserId }
    })
    expect(endRes.status).toBe(200)
    const endResult = await endRes.json()

    // Verify that stat tags only contain existing user stats
    const validStatCategories = ['Fitness', 'Learning', 'Creativity']
    
    expect(endResult.data.conversation.statTags).toBeDefined()
    expect(Array.isArray(endResult.data.conversation.statTags)).toBe(true)
    
    for (const statTag of endResult.data.conversation.statTags) {
      expect(validStatCategories).toContain(statTag)
    }
    
    // Should not contain non-existent categories like 'Quantum Physics', 'Dragon Taming', etc.
    const invalidCategories = ['Quantum Physics', 'Dragon Taming', 'Underwater Basket Weaving']
    for (const invalidCategory of invalidCategories) {
      expect(endResult.data.conversation.statTags).not.toContain(invalidCategory)
    }
    
    console.log('Filtered stat tags (only existing):', endResult.data.conversation.statTags)
  })
})
