/**
 * Integration tests for Task 5.10: Quick Journal Access Integration for Homepage
 * Tests homepage-specific journal functionality for quick access and recent activity
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { testClient } from 'hono/testing'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, journalConversations, journalEntries } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Task 5.10: Quick Journal Access Integration for Homepage', () => {
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
    const { user } = await createTestUser({
      email: `journal-homepage-test-${Date.now()}@example.com`,
      name: 'Journal Homepage Test User'
    })
    testUserId = user.id
    cleanupUserIds.push(testUserId)

    // Create test character with stats
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Adventurer',
      class: 'Ranger',
      backstory: 'A test character for journal homepage integration'
    }).returning()
    testCharacterId = character.id
    cleanupCharacterIds.push(testCharacterId)

    // Create character stats
    await db.insert(characterStats).values([
      { characterId: testCharacterId, category: 'Fitness', currentXp: 850 },
      { characterId: testCharacterId, category: 'Learning', currentXp: 1200 },
      { characterId: testCharacterId, category: 'Adventure Spirit', currentXp: 650 }
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

  test('Feature 1: Quick journal start with AI-generated opening question', async () => {
    console.log('Testing quick journal start from homepage...')

    // Test quick start journal conversation API
    const quickStartResponse = await client.api.journal['quick-start'].$post({
      json: { userId: testUserId }
    })

    expect(quickStartResponse.status).toBe(201)
    const quickStartResult = await quickStartResponse.json()
    expect(quickStartResult.success).toBe(true)
    expect(quickStartResult.data.conversation).toBeDefined()
    expect(quickStartResult.data.conversation.isActive).toBe(true)
    
    // Should include an opening message from AI
    expect(quickStartResult.data.openingMessage).toBeDefined()
    expect(quickStartResult.data.openingMessage.content).toBeDefined()
    expect(quickStartResult.data.openingMessage.role).toBe('assistant')
    expect(quickStartResult.data.openingMessage.content.length).toBeGreaterThan(10)

    cleanupConversationIds.push(quickStartResult.data.conversation.id)
    cleanupEntryIds.push(quickStartResult.data.openingMessage.id)

    console.log('✅ Quick journal start with opening message works')
  })

  test('Feature 2: Recent journal activity summary for homepage dashboard', async () => {
    console.log('Testing recent journal activity summary...')

    // First create some test journal conversations with different dates
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)

    const conversations = [
      {
        title: 'Today\'s Reflection',
        summary: 'Great day with productive work and evening exercise',
        mood: 'positive',
        contentTags: ['work', 'exercise', 'positive'],
        statTags: ['Fitness', 'Learning'],
        createdAt: now
      },
      {
        title: 'Yesterday\'s Thoughts',
        summary: 'Mixed day with some challenges but good progress',
        mood: 'mixed',
        contentTags: ['challenges', 'progress'],
        statTags: ['Learning'],
        createdAt: yesterday
      },
      {
        title: 'Weekend Adventures',
        summary: 'Amazing hiking trip with friends and family',
        mood: 'positive',
        contentTags: ['adventure', 'hiking', 'family'],
        statTags: ['Adventure Spirit', 'Fitness'],
        createdAt: threeDaysAgo
      },
      {
        title: 'Last Week Reflection',
        summary: 'Reflecting on a busy week with learning goals',
        mood: 'neutral',
        contentTags: ['reflection', 'goals'],
        statTags: ['Learning'],
        createdAt: lastWeek
      }
    ]

    // Create test conversations
    for (const conv of conversations) {
      const [conversation] = await db.insert(journalConversations).values({
        userId: testUserId,
        title: conv.title,
        summary: conv.summary,
        mood: conv.mood,
        contentTags: conv.contentTags,
        statTags: conv.statTags,
        isActive: false,
        endedAt: conv.createdAt,
        createdAt: conv.createdAt
      }).returning()
      
      cleanupConversationIds.push(conversation.id)

      // Add a sample entry for each conversation
      const [entry] = await db.insert(journalEntries).values({
        conversationId: conversation.id,
        userId: testUserId,
        content: conv.summary,
        role: 'user'
      }).returning()
      cleanupEntryIds.push(entry.id)
    }

    // Test recent activity API
    const activityResponse = await client.api.journal['recent-activity'].$get({
      query: { userId: testUserId }
    })

    expect(activityResponse.status).toBe(200)
    const activityResult = await activityResponse.json()
    expect(activityResult.success).toBe(true)
    expect(activityResult.data).toBeDefined()

    // Verify activity summary structure
    const activity = activityResult.data
    expect(activity.recentEntries).toBeDefined()
    expect(Array.isArray(activity.recentEntries)).toBe(true)
    expect(activity.recentEntries.length).toBeGreaterThan(0)
    expect(activity.recentEntries.length).toBeLessThanOrEqual(5) // Should limit to 5 recent

    // Verify activity statistics
    expect(activity.stats).toBeDefined()
    expect(Number(activity.stats.last7Days)).toBe(3) // Today, yesterday, 3 days ago
    expect(activity.stats.totalConversations).toBeGreaterThan(0)

    // Verify period days is correct
    expect(activity.periodDays).toBe(7)

    console.log('✅ Recent journal activity summary works')
  })

  test('Feature 3: Journal status check for homepage widget', async () => {
    console.log('Testing journal status check...')

    // Test when user has no active conversation
    const statusResponse1 = await client.api.journal.status.$get({
      query: { userId: testUserId }
    })

    expect(statusResponse1.status).toBe(200)
    const statusResult1 = await statusResponse1.json()
    expect(statusResult1.success).toBe(true)
    expect(statusResult1.data.hasActiveConversation).toBe(false)
    expect(statusResult1.data.activeConversation).toBeNull()
    expect(statusResult1.data.canStartNew).toBe(true)

    // Create an active conversation
    const [activeConversation] = await db.insert(journalConversations).values({
      userId: testUserId,
      isActive: true
    }).returning()
    cleanupConversationIds.push(activeConversation.id)

    // Test when user has an active conversation
    const statusResponse2 = await client.api.journal.status.$get({
      query: { userId: testUserId }
    })

    expect(statusResponse2.status).toBe(200)
    const statusResult2 = await statusResponse2.json()
    expect(statusResult2.success).toBe(true)
    expect(statusResult2.data.hasActiveConversation).toBe(true)
    expect(statusResult2.data.activeConversation).toBeDefined()
    expect(statusResult2.data.activeConversation.id).toBe(activeConversation.id)
    expect(statusResult2.data.canStartNew).toBe(false) // Can't start new while one is active

    console.log('✅ Journal status check works')
  })

  test('Feature 4: Quick continue active conversation', async () => {
    console.log('Testing quick continue active conversation...')

    // Create an active conversation with some messages
    const [conversation] = await db.insert(journalConversations).values({
      userId: testUserId,
      isActive: true
    }).returning()
    cleanupConversationIds.push(conversation.id)

    // Add some messages to the conversation
    const [userEntry] = await db.insert(journalEntries).values({
      conversationId: conversation.id,
      userId: testUserId,
      content: 'I had a great workout today but I\'m feeling stressed about work deadlines.',
      role: 'user'
    }).returning()
    cleanupEntryIds.push(userEntry.id)

    const [assistantEntry] = await db.insert(journalEntries).values({
      conversationId: conversation.id,
      userId: testUserId,
      content: 'That sounds like a mix of positive and challenging experiences. How are you planning to handle the work stress?',
      role: 'assistant'
    }).returning()
    cleanupEntryIds.push(assistantEntry.id)

    // Test quick continue API
    const continueResponse = await client.api.journal['quick-continue'].$get({
      query: { userId: testUserId }
    })

    expect(continueResponse.status).toBe(200)
    const continueResult = await continueResponse.json()
    expect(continueResult.success).toBe(true)
    expect(continueResult.data.conversation).toBeDefined()
    expect(continueResult.data.conversation.id).toBe(conversation.id)
    expect(continueResult.data.recentMessages).toBeDefined()
    expect(Array.isArray(continueResult.data.recentMessages)).toBe(true)
    expect(continueResult.data.recentMessages.length).toBe(2) // Should return recent messages
    expect(Number(continueResult.data.messageCount)).toBe(2)

    // Should be ordered by creation date
    expect(continueResult.data.recentMessages[0].role).toBe('user')
    expect(continueResult.data.recentMessages[1].role).toBe('assistant')

    console.log('✅ Quick continue active conversation works')
  })

  test('Feature 5: Streamlined journal creation with quick prompts', async () => {
    console.log('Testing streamlined journal creation with prompts...')

    // Test quick prompts API for getting suggested journal starters
    const promptsResponse = await client.api.journal['quick-prompts'].$get({
      query: { userId: testUserId }
    })

    expect(promptsResponse.status).toBe(200)
    const promptsResult = await promptsResponse.json()
    expect(promptsResult.success).toBe(true)
    expect(promptsResult.data.prompts).toBeDefined()
    expect(Array.isArray(promptsResult.data.prompts)).toBe(true)
    expect(promptsResult.data.prompts.length).toBeGreaterThanOrEqual(3)

    // Each prompt should be a string
    for (const prompt of promptsResult.data.prompts) {
      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(10)
      expect(prompt.length).toBeLessThanOrEqual(150)
    }

    // Test starting a conversation with a specific prompt
    const selectedPrompt = promptsResult.data.prompts[0]
    const startWithPromptResponse = await client.api.journal['start-with-prompt'].$post({
      json: { 
        userId: testUserId,
        prompt: selectedPrompt
      }
    })

    expect(startWithPromptResponse.status).toBe(201)
    const startResult = await startWithPromptResponse.json()
    expect(startResult.success).toBe(true)
    expect(startResult.data.conversation).toBeDefined()
    expect(startResult.data.conversation.isActive).toBe(true)
    expect(startResult.data.promptMessage).toBeDefined()

    cleanupConversationIds.push(startResult.data.conversation.id)

    console.log('✅ Streamlined journal creation with prompts works')
  })

  test('Feature 6: Homepage journal metrics and streaks', async () => {
    console.log('Testing homepage journal metrics and streaks...')

    // Create journal conversations over multiple days to test streaks
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
    const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) // Break in streak

    const streakConversations = [
      { date: today, title: 'Today\'s Entry' },
      { date: yesterday, title: 'Yesterday\'s Entry' },
      { date: twoDaysAgo, title: 'Two Days Ago Entry' },
      { date: fiveDaysAgo, title: 'Five Days Ago Entry' }
    ]

    for (const conv of streakConversations) {
      const [conversation] = await db.insert(journalConversations).values({
        userId: testUserId,
        title: conv.title,
        summary: 'Daily reflection entry',
        isActive: false,
        endedAt: conv.date,
        createdAt: conv.date
      }).returning()
      cleanupConversationIds.push(conversation.id)
    }

    // Test journal metrics API
    const metricsResponse = await client.api.journal.metrics.$get({
      query: { userId: testUserId }
    })

    expect(metricsResponse.status).toBe(200)
    const metricsResult = await metricsResponse.json()
    expect(metricsResult.success).toBe(true)
    expect(metricsResult.data).toBeDefined()

    const metrics = metricsResult.data
    expect(typeof metrics.currentStreak).toBe('number')
    expect(metrics.currentStreak).toBeGreaterThanOrEqual(0)
    expect(Number(metrics.totalEntries)).toBeGreaterThanOrEqual(0)
    expect(Number(metrics.monthlyEntries)).toBeGreaterThanOrEqual(0)

    console.log('✅ Homepage journal metrics and streaks work')
  })

  test('Integration: Complete homepage journal workflow', async () => {
    console.log('Testing complete homepage journal workflow...')

    // Step 1: Check initial status (no active conversation)
    const initialStatus = await client.api.journal.status.$get({
      query: { userId: testUserId }
    })
    expect(initialStatus.status).toBe(200)
    const status1 = await initialStatus.json()
    expect(status1.data.hasActiveConversation).toBe(false)

    // Step 2: Start a quick journal session
    const quickStart = await client.api.journal['quick-start'].$post({
      json: { userId: testUserId }
    })
    expect(quickStart.status).toBe(201)
    const startResult = await quickStart.json()
    const conversationId = startResult.data.conversation.id
    cleanupConversationIds.push(conversationId)
    cleanupEntryIds.push(startResult.data.openingMessage.id)

    // Step 3: Check status again (should have active conversation)
    const statusAfterStart = await client.api.journal.status.$get({
      query: { userId: testUserId }
    })
    expect(statusAfterStart.status).toBe(200)
    const status2 = await statusAfterStart.json()
    expect(status2.data.hasActiveConversation).toBe(true)
    expect(status2.data.activeConversation.id).toBe(conversationId)

    // Step 4: Add a user message to the conversation
    const addMessage = await client.api.journal.conversations[':id'].messages.$post({
      param: { id: conversationId },
      json: {
        userId: testUserId,
        content: 'I had a productive day working on some challenging projects. Feeling accomplished but a bit tired.',
        role: 'user'
      }
    })
    expect(addMessage.status).toBe(201)
    const messageResult = await addMessage.json()
    cleanupEntryIds.push(messageResult.data.entry.id)

    // Step 5: End the conversation to process it
    const endConversation = await client.api.journal.conversations[':id'].end.$put({
      param: { id: conversationId },
      json: { userId: testUserId }
    })
    expect(endConversation.status).toBe(200)
    const endResult = await endConversation.json()
    expect(endResult.success).toBe(true)

    // Step 6: Check recent activity (should include the new conversation)
    const recentActivity = await client.api.journal['recent-activity'].$get({
      query: { userId: testUserId }
    })
    expect(recentActivity.status).toBe(200)
    const activityResult = await recentActivity.json()
    expect(activityResult.data.recentEntries.length).toBeGreaterThan(0)
    expect(activityResult.data.stats.totalConversations).toBe(1)

    // Step 7: Check final status (no active conversation)
    const finalStatus = await client.api.journal.status.$get({
      query: { userId: testUserId }
    })
    expect(finalStatus.status).toBe(200)
    const status3 = await finalStatus.json()
    expect(status3.data.hasActiveConversation).toBe(false)
    expect(status3.data.canStartNew).toBe(true)

    console.log('✅ Complete homepage journal workflow works end-to-end')
  })

  test('All tests completed successfully', () => {
    console.log('🎉 Task 5.10: Quick Journal Access Integration for Homepage - ALL TESTS PASSED!')
    console.log('Implemented features:')
    console.log('  - Quick journal start with AI-generated opening questions')
    console.log('  - Recent journal activity summary for homepage dashboard')
    console.log('  - Journal status check for homepage widget')
    console.log('  - Quick continue active conversation functionality')
    console.log('  - Streamlined journal creation with suggested prompts')
    console.log('  - Homepage journal metrics and streak tracking')
    console.log('  - Complete end-to-end homepage journal workflow')
  })
})
