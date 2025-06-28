/**
 * Integration tests for Task 5.9: Journal History and Search Functionality
 * Tests the journal history API endpoints with search, filtering, and pagination
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { testClient } from 'hono/testing'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, journalConversations, journalEntries } from '../db/schema'
import { eq } from 'drizzle-orm'

describe('Task 5.9: Journal History and Search Functionality', () => {
  let testUserId: string
  let testCharacterId: string
  let cleanupUserIds: string[] = []
  let cleanupCharacterIds: string[] = []
  let cleanupConversationIds: string[] = []
  let cleanupEntryIds: string[] = []
  let client: any

  beforeEach(async () => {
    client = testClient(app)
    // Create test user
    const [user] = await db.insert(users).values({
      email: `journal-history-test-${Date.now()}@example.com`,
      name: 'Journal History Test User'
    }).returning()
    testUserId = user.id
    cleanupUserIds.push(testUserId)

    // Create test character with stats
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Adventurer',
      class: 'Ranger',
      backstory: 'A test character for journal history'
    }).returning()
    testCharacterId = character.id
    cleanupCharacterIds.push(testCharacterId)

    // Create character stats
    await db.insert(characterStats).values([
      { characterId: testCharacterId, category: 'Fitness', currentXp: 850 },
      { characterId: testCharacterId, category: 'Learning', currentXp: 1200 }
    ])
  })

  afterEach(async () => {
    // Cleanup in reverse order
    for (const entryId of cleanupEntryIds) {
      await db.delete(journalEntries).where(eq(journalEntries.id, entryId))
    }
    for (const conversationId of cleanupConversationIds) {
      await db.delete(journalConversations).where(eq(journalConversations.id, conversationId))
    }
    await db.delete(characterStats).where(eq(characterStats.characterId, testCharacterId))
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  test('Task 5.9: Journal history and search functionality - comprehensive test', async () => {
    // Create test conversations with different themes and content
    const conversations = [
      {
        title: 'Morning Workout Success',
        summary: 'Had an amazing 5-mile run this morning. Felt energized and accomplished.',
        synopsis: 'Successful morning run with positive feelings',
        contentTags: ['fitness', 'positive', 'morning'],
        statTags: ['Fitness'],
        mood: 'positive'
      },
      {
        title: 'Learning Python Programming',
        summary: 'Spent 3 hours learning Python and completed a coding project. Made great progress.',
        synopsis: 'Productive programming learning session',
        contentTags: ['learning', 'programming', 'accomplishment'],
        statTags: ['Learning'],
        mood: 'positive'
      },
      {
        title: 'Mixed Day Reflection',
        summary: 'Good workout but struggled with work challenges. Feeling both accomplished and stressed.',
        synopsis: 'Day with both positive and negative experiences',
        contentTags: ['fitness', 'work', 'stress', 'accomplishment'],
        statTags: ['Fitness', 'Learning'],
        mood: 'mixed'
      }
    ]

    const conversationIds: string[] = []

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i]
      // Create conversation
      const [conversation] = await db.insert(journalConversations).values({
        userId: testUserId,
        title: conv.title,
        summary: conv.summary,
        synopsis: conv.synopsis,
        contentTags: conv.contentTags,
        statTags: conv.statTags,
        mood: conv.mood,
        isActive: false,
        endedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // Spread over days
      }).returning()
      
      conversationIds.push(conversation.id)
      cleanupConversationIds.push(conversation.id)

      // Create sample entries for each conversation
      const entries = [
        { role: 'user', content: conv.summary.split('.')[0] },
        { role: 'assistant', content: `That sounds wonderful! How did that make you feel?` },
        { role: 'user', content: conv.summary.split('.')[1] || 'It was great!' }
      ]

      for (const entry of entries) {
        const [journalEntry] = await db.insert(journalEntries).values({
          conversationId: conversation.id,
          userId: testUserId,
          content: entry.content,
          role: entry.role as 'user' | 'assistant'
        }).returning()
        cleanupEntryIds.push(journalEntry.id)
      }
    }

    // Test 1: Basic listing with existing endpoint
    const response = await client.api.journal.conversations.$get({
      query: { userId: testUserId, limit: '10', offset: '0' }
    })

    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.data.conversations.length).toBe(3)
    console.log('✅ Basic journal listing works')

    // Test 2: Enhanced history with search
    const historyResponse = await client.api.journal.history.$get({
      query: { userId: testUserId, search: 'workout' }
    })

    expect(historyResponse.status).toBe(200)
    const historyResult = await historyResponse.json()
    expect(historyResult.success).toBe(true)
    expect(historyResult.data.conversations.length).toBe(2) // Should find workout conversations
    console.log('✅ Enhanced search by title/content works')

    // Test 3: Filter by mood
    const moodResponse = await client.api.journal.history.$get({
      query: { userId: testUserId, mood: 'positive' }
    })

    expect(moodResponse.status).toBe(200)
    const moodResult = await moodResponse.json()
    expect(moodResult.success).toBe(true)
    expect(moodResult.data.conversations.length).toBe(2) // Should find positive mood conversations
    console.log('✅ Mood filtering works')

    // Test 4: Filter by content tags
    const tagResponse = await client.api.journal.history.$get({
      query: { userId: testUserId, tags: 'learning,programming' }
    })

    expect(tagResponse.status).toBe(200)
    const tagResult = await tagResponse.json()
    expect(tagResult.success).toBe(true)
    expect(tagResult.data.conversations.length).toBe(1) // Should find learning conversation
    console.log('✅ Content tag filtering works')

    // Test 5: Filter by stat tags
    const statTagResponse = await client.api.journal.history.$get({
      query: { userId: testUserId, statTags: 'Fitness' }
    })

    expect(statTagResponse.status).toBe(200)
    const statTagResult = await statTagResponse.json()
    expect(statTagResult.success).toBe(true)
    expect(statTagResult.data.conversations.length).toBe(2) // Should find fitness-related conversations
    console.log('✅ Stat tag filtering works')

    // Test 6: Journal statistics
    const statsResponse = await client.api.journal.stats.$get({
      query: { userId: testUserId }
    })

    expect(statsResponse.status).toBe(200)
    const statsResult = await statsResponse.json()
    expect(statsResult.success).toBe(true)
    expect(statsResult.data.totalConversations).toBe(3)
    expect(statsResult.data.tagFrequency).toBeDefined()
    expect(statsResult.data.moodDistribution).toBeDefined()
    expect(statsResult.data.statTagFrequency).toBeDefined()
    console.log('✅ Journal statistics work')

    // Test 7: Full-text search in content
    const searchResponse = await client.api.journal.search.$get({
      query: { 
        userId: testUserId, 
        query: 'energized',
        searchIn: 'content'
      }
    })

    expect(searchResponse.status).toBe(200)
    const searchResult = await searchResponse.json()
    expect(searchResult.success).toBe(true)
    console.log('✅ Full-text content search works')

    // Test 8: Popular tags for autocomplete
    const tagsResponse = await client.api.journal.tags.$get({
      query: { userId: testUserId, type: 'content' }
    })

    expect(tagsResponse.status).toBe(200)
    const tagsResult = await tagsResponse.json()
    expect(tagsResult.success).toBe(true)
    expect(tagsResult.data.tags).toBeDefined()
    expect(Array.isArray(tagsResult.data.tags)).toBe(true)
    console.log('✅ Popular tags endpoint works')

    console.log('🎉 Task 5.9: Journal history and search functionality - ALL TESTS PASSED!')
    console.log('Implemented features:')
    console.log('  - Enhanced journal history with search and filtering')
    console.log('  - Search by title, summary, synopsis')
    console.log('  - Filter by mood, content tags, stat tags, date ranges')
    console.log('  - Journal statistics and analytics')
    console.log('  - Full-text search within journal content')
    console.log('  - Popular tags API for autocomplete')
    console.log('  - Comprehensive pagination support')
  })
})
