import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '../db/connection'
import { users, characters, characterStats, journalConversations, journalEntries } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq, and } from 'drizzle-orm'
import app from '../index'

describe('Journal Conversational API Integration Tests', () => {
  let testUserId: string
  let testCharacterId: string
  let testConversationId: string | null = null
  
  // Test data cleanup arrays
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupConversationIds: string[] = []
  const cleanupEntryIds: string[] = []

  beforeAll(async () => {
    // Create test user
    const { user: userRecord } = await createTestUser({
      email: 'journal-test@example.com',
      name: 'Journal Test User'
    })
    testUserId = userRecord.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [characterRecord] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Character',
      class: 'Journaler',
      backstory: 'A thoughtful individual who loves to reflect on life experiences.'
    }).returning()
    testCharacterId = characterRecord.id
    cleanupCharacterIds.push(testCharacterId)

    // Create test character stats
    await db.insert(characterStats).values([
      {
        characterId: testCharacterId,
        category: 'Emotional Intelligence',
        currentLevel: 3,
        totalXp: 650,
        description: 'Understanding and managing emotions'
      },
      {
        characterId: testCharacterId,
        category: 'Self Reflection',
        currentLevel: 4,
        totalXp: 950,
        description: 'Ability to examine thoughts and experiences'
      }
    ])
  })

  afterAll(async () => {
    // Clean up in reverse order due to foreign key constraints
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

  describe('POST /api/journal/conversations - Start new journal conversation', () => {
    test('should start a new journal conversation successfully', async () => {
      const response = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.conversation).toBeDefined()
      expect(result.data.conversation.id).toBeDefined()
      expect(result.data.conversation.userId).toBe(testUserId)
      expect(result.data.conversation.isActive).toBe(true)
      expect(result.data.conversation.startedAt).toBeDefined()
      expect(result.data.conversation.endedAt).toBeNull()
      
      // Store for cleanup and further tests
      testConversationId = result.data.conversation.id
      if (testConversationId) {
        cleanupConversationIds.push(testConversationId)
      }

      // Verify database state
      if (testConversationId) {
        const [dbConversation] = await db
          .select()
          .from(journalConversations)
          .where(eq(journalConversations.id, testConversationId))
          .limit(1)
        
        expect(dbConversation).toBeDefined()
        expect(dbConversation.userId).toBe(testUserId)
        expect(dbConversation.isActive).toBe(true)
      }
    })

    test('should fail when userId is missing', async () => {
      const response = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(JSON.stringify(result)).toContain('userId')
    })

    test('should fail when user does not exist', async () => {
      const fakeUserId = '550e8400-e29b-41d4-a716-446655440000'
      
      const response = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: fakeUserId
        })
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('User not found')
    })
  })

  describe('POST /api/journal/conversations/:id/messages - Add message to conversation', () => {
    test('should add user message to conversation successfully', async () => {
      expect(testConversationId).toBeTruthy()

      const userMessage = "I had a really challenging day at work today. My project presentation didn't go as planned."
      
      const response = await app.request(`/api/journal/conversations/${testConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: userMessage,
          role: 'user'
        })
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.entry).toBeDefined()
      expect(result.data.entry.content).toBe(userMessage)
      expect(result.data.entry.role).toBe('user')
      expect(result.data.entry.conversationId).toBe(testConversationId)
      expect(result.data.entry.userId).toBe(testUserId)
      
      cleanupEntryIds.push(result.data.entry.id)

      // Verify database state
      const [dbEntry] = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, result.data.entry.id))
        .limit(1)
      
      expect(dbEntry).toBeDefined()
      expect(dbEntry.content).toBe(userMessage)
      expect(dbEntry.role).toBe('user')
    })

    test('should add assistant message with GPT response', async () => {
      expect(testConversationId).toBeTruthy()

      const response = await app.request(`/api/journal/conversations/${testConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: '', // Empty content triggers GPT response
          role: 'assistant'
        })
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.entry).toBeDefined()
      expect(result.data.entry.role).toBe('assistant')
      expect(result.data.entry.content).toBeDefined()
      expect(result.data.entry.content.length).toBeGreaterThan(10) // Should have meaningful content
      expect(result.data.entry.conversationId).toBe(testConversationId)
      
      cleanupEntryIds.push(result.data.entry.id)

      // If AI is configured, the response should be more sophisticated
      if (process.env.OPENAI_API_KEY) {
        expect(result.data.entry.content).toMatch(/[.!?]/) // Should have proper punctuation
        expect(result.data.entry.content.split(' ').length).toBeGreaterThan(5) // Should be more than a few words
      }
    })

    test('should fail when conversation does not exist', async () => {
      const fakeConversationId = '550e8400-e29b-41d4-a716-446655440000'
      
      const response = await app.request(`/api/journal/conversations/${fakeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: 'Test message',
          role: 'user'
        })
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Conversation not found')
    })

    test('should fail when user does not own conversation', async () => {
      expect(testConversationId).toBeTruthy()

      // Create another user
      const { user: otherUser } = await createTestUser({
        email: 'other-journal-test@example.com',
        name: 'Other Journal Test User'
      })
      cleanupUserIds.push(otherUser.id)
      
      const response = await app.request(`/api/journal/conversations/${testConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otherUser.id,
          content: 'Test message',
          role: 'user'
        })
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    test('should fail when conversation is not active', async () => {
      // Create an inactive conversation
      const [inactiveConversation] = await db.insert(journalConversations).values({
        userId: testUserId,
        isActive: false,
        title: 'Inactive conversation'
      }).returning()
      cleanupConversationIds.push(inactiveConversation.id)
      
      const response = await app.request(`/api/journal/conversations/${inactiveConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: 'Test message',
          role: 'user'
        })
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Conversation is not active')
    })
  })

  describe('PUT /api/journal/conversations/:id/end - End conversation', () => {
    test('should end conversation and trigger AI processing successfully', async () => {
      expect(testConversationId).toBeTruthy()

      const response = await app.request(`/api/journal/conversations/${testConversationId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.conversation).toBeDefined()
      expect(result.data.conversation.isActive).toBe(false)
      expect(result.data.conversation.endedAt).toBeDefined()
      
      // Should have AI processing results
      expect(result.data.conversation.title).toBeDefined()
      expect(result.data.conversation.summary).toBeDefined()
      expect(result.data.conversation.synopsis).toBeDefined()
      expect(result.data.conversation.contentTags).toBeDefined()
      expect(Array.isArray(result.data.conversation.contentTags)).toBe(true)

      // If AI is configured, should have proper processing
      if (process.env.OPENAI_API_KEY) {
        expect(result.data.conversation.title.length).toBeGreaterThan(5)
        expect(result.data.conversation.summary.length).toBeGreaterThan(20)
        expect(result.data.conversation.synopsis.length).toBeGreaterThan(10)
        expect(result.data.conversation.contentTags.length).toBeGreaterThan(0)
      }

      // Should have XP awards if AI processed successfully
      if (result.data.xpAwards) {
        expect(Array.isArray(result.data.xpAwards)).toBe(true)
        if (result.data.xpAwards.length > 0) {
          expect(result.data.xpAwards[0]).toHaveProperty('statCategory')
          expect(result.data.xpAwards[0]).toHaveProperty('xpChange')
          expect(result.data.xpAwards[0]).toHaveProperty('reasoning')
        }
      }

      // Verify database state
      if (testConversationId) {
        const [dbConversation] = await db
          .select()
          .from(journalConversations)
          .where(eq(journalConversations.id, testConversationId))
          .limit(1)
        
        expect(dbConversation.isActive).toBe(false)
        expect(dbConversation.endedAt).toBeTruthy()
        expect(dbConversation.title).toBeTruthy()
      }
    })

    test('should fail when trying to end already ended conversation', async () => {
      expect(testConversationId).toBeTruthy()

      const response = await app.request(`/api/journal/conversations/${testConversationId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('already ended')
    })

    test('should fail when conversation has no messages', async () => {
      // Create a new conversation with no messages
      const [emptyConversation] = await db.insert(journalConversations).values({
        userId: testUserId,
        isActive: true
      }).returning()
      cleanupConversationIds.push(emptyConversation.id)
      
      const response = await app.request(`/api/journal/conversations/${emptyConversation.id}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('no messages')
    })
  })

  describe('GET /api/journal/conversations/:id - Get conversation details', () => {
    test('should get conversation with all messages', async () => {
      expect(testConversationId).toBeTruthy()

      const response = await app.request(`/api/journal/conversations/${testConversationId}?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.conversation).toBeDefined()
      expect(result.data.conversation.id).toBe(testConversationId)
      expect(result.data.messages).toBeDefined()
      expect(Array.isArray(result.data.messages)).toBe(true)
      expect(result.data.messages.length).toBeGreaterThanOrEqual(2) // At least user + assistant messages
      
      // Check message structure
      const firstMessage = result.data.messages[0]
      expect(firstMessage).toHaveProperty('id')
      expect(firstMessage).toHaveProperty('content')
      expect(firstMessage).toHaveProperty('role')
      expect(firstMessage).toHaveProperty('createdAt')
    })

    test('should fail for unauthorized user', async () => {
      expect(testConversationId).toBeTruthy()

      // Create another user for unauthorized test
      const { user: unauthorizedUser } = await createTestUser({
        email: 'unauthorized-journal@example.com',
        name: 'Unauthorized Journal User'
      })
      cleanupUserIds.push(unauthorizedUser.id)
      
      const response = await app.request(`/api/journal/conversations/${testConversationId}?userId=${unauthorizedUser.id}`, {
        method: 'GET'
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('GET /api/journal/conversations - List user conversations', () => {
    test('should list all conversations for user', async () => {
      const response = await app.request(`/api/journal/conversations?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.conversations).toBeDefined()
      expect(Array.isArray(result.data.conversations)).toBe(true)
      expect(result.data.conversations.length).toBeGreaterThanOrEqual(1)
      
      // Find our test conversation
      const ourConversation = result.data.conversations.find(
        (conv: any) => conv.id === testConversationId
      )
      expect(ourConversation).toBeDefined()
      expect(ourConversation.userId).toBe(testUserId)
    })

    test('should return empty array for user with no conversations', async () => {
      // Create user with no conversations
      const { user: newUser } = await createTestUser({
        email: 'no-conversations@example.com',
        name: 'No Conversations User'
      })
      cleanupUserIds.push(newUser.id)
      
      const response = await app.request(`/api/journal/conversations?userId=${newUser.id}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.conversations).toEqual([])
    })

    test('should support pagination', async () => {
      const response = await app.request(`/api/journal/conversations?userId=${testUserId}&limit=5&offset=0`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.conversations).toBeDefined()
      expect(result.data.total).toBeDefined()
      expect(typeof result.data.total).toBe('number')
    })
  })

  describe('AI Integration Tests', () => {
    test('should handle GPT conversation generation gracefully when AI is not configured', async () => {
      // This test ensures the API works even without OpenAI API key
      const response = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      expect(result.success).toBe(true)
      
      const conversationId = result.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add a user message
      const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: 'Test message for AI processing',
          role: 'user'
        })
      })

      expect(messageResponse.status).toBe(201)
      const messageResult = await messageResponse.json()
      expect(messageResult.success).toBe(true)
      cleanupEntryIds.push(messageResult.data.entry.id)

      // Trigger assistant response
      const assistantResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: '',
          role: 'assistant'
        })
      })

      expect(assistantResponse.status).toBe(201)
      const assistantResult = await assistantResponse.json()
      expect(assistantResult.success).toBe(true)
      expect(assistantResult.data.entry.content).toBeDefined()
      cleanupEntryIds.push(assistantResult.data.entry.id)

      // End conversation should work regardless of AI configuration
      const endResponse = await app.request(`/api/journal/conversations/${conversationId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(endResponse.status).toBe(200)
      const endResult = await endResponse.json()
      expect(endResult.success).toBe(true)
    })
  })

  describe('Task 5.2: Smart Follow-up Question Generation', () => {
    test('should generate mood-appropriate follow-up questions for positive content', async () => {
      // Create new conversation
      const createResponse = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(createResponse.status).toBe(201)
      const createResult = await createResponse.json()
      const conversationId = createResult.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add positive user message
      const userMessage = "I had an amazing day today! I got a promotion at work and spent quality time with my kids playing in the park. Everything felt perfect!"
      
      const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: userMessage,
          role: 'user'
        })
      })

      expect(messageResponse.status).toBe(201)
      const messageResult = await messageResponse.json()
      cleanupEntryIds.push(messageResult.data.entry.id)

      // Request AI follow-up (mood-aware)
      const followUpResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: '', // Empty triggers AI response
          role: 'assistant'
        })
      })

      expect(followUpResponse.status).toBe(201)
      const followUpResult = await followUpResponse.json()
      
      expect(followUpResult.success).toBe(true)
      expect(followUpResult.data.entry.content).toBeDefined()
      expect(followUpResult.data.entry.role).toBe('assistant')
      
      const response = followUpResult.data.entry.content.toLowerCase()
      
      // Should detect positive mood and ask appropriate follow-up
      // For positive content, should encourage elaboration on the positive experience
      expect(response).toMatch(/(celebrate|amazing|wonderful|great|promotion|kids|feeling|moment|experience|accomplishment)/i)
      
      cleanupEntryIds.push(followUpResult.data.entry.id)
    })

    test('should generate mood-appropriate follow-up questions for negative content', async () => {
      // Create new conversation
      const createResponse = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(createResponse.status).toBe(201)
      const createResult = await createResponse.json()
      const conversationId = createResult.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add negative user message
      const userMessage = "Today was really difficult. I had a big argument with my partner and I feel frustrated and overwhelmed. Work is stressing me out too."
      
      const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: userMessage,
          role: 'user'
        })
      })

      expect(messageResponse.status).toBe(201)
      const messageResult = await messageResponse.json()
      cleanupEntryIds.push(messageResult.data.entry.id)

      // Request AI follow-up (mood-aware)
      const followUpResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: '', // Empty triggers AI response
          role: 'assistant'
        })
      })

      expect(followUpResponse.status).toBe(201)
      const followUpResult = await followUpResponse.json()
      
      expect(followUpResult.success).toBe(true)
      expect(followUpResult.data.entry.content).toBeDefined()
      
      const response = followUpResult.data.entry.content.toLowerCase()
      
      // Should detect negative mood and ask supportive, understanding follow-up
      // For negative content, should focus on understanding and support
      expect(response).toMatch(/(understand|support|feel|difficult|challenge|cope|help|process|emotions|stress)/i)
      
      cleanupEntryIds.push(followUpResult.data.entry.id)
    })

    test('should generate content-specific follow-up questions', async () => {
      // Create new conversation
      const createResponse = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(createResponse.status).toBe(201)
      const createResult = await createResponse.json()
      const conversationId = createResult.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add content about family interaction
      const userMessage = "I taught my youngest daughter how to ride a bike today. She was scared at first but then got excited when she could balance on her own."
      
      const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: userMessage,
          role: 'user'
        })
      })

      expect(messageResponse.status).toBe(201)
      const messageResult = await messageResponse.json()
      cleanupEntryIds.push(messageResult.data.entry.id)

      // Request AI follow-up (content-aware)
      const followUpResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: '', // Empty triggers AI response
          role: 'assistant'
        })
      })

      expect(followUpResponse.status).toBe(201)
      const followUpResult = await followUpResponse.json()
      
      expect(followUpResult.success).toBe(true)
      expect(followUpResult.data.entry.content).toBeDefined()
      
      const response = followUpResult.data.entry.content.toLowerCase()
      
      // Should detect family/teaching content and ask relevant follow-up
      expect(response).toMatch(/(daughter|bike|teaching|proud|moment|learned|balance|parenting|child|experience)/i)
      
      cleanupEntryIds.push(followUpResult.data.entry.id)
    })

    test('should handle mixed emotions and generate nuanced follow-up questions', async () => {
      // Create new conversation
      const createResponse = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(createResponse.status).toBe(201)
      const createResult = await createResponse.json()
      const conversationId = createResult.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add message with mixed emotions
      const userMessage = "I completed a challenging project at work today, which feels great, but I'm also worried about the upcoming deadline for the next one. It's exciting but stressful."
      
      const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: userMessage,
          role: 'user'
        })
      })

      expect(messageResponse.status).toBe(201)
      const messageResult = await messageResponse.json()
      cleanupEntryIds.push(messageResult.data.entry.id)

      // Request AI follow-up
      const followUpResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: '', // Empty triggers AI response
          role: 'assistant'
        })
      })

      expect(followUpResponse.status).toBe(201)
      const followUpResult = await followUpResponse.json()
      
      expect(followUpResult.success).toBe(true)
      expect(followUpResult.data.entry.content).toBeDefined()
      
      const response = followUpResult.data.entry.content.toLowerCase()
      
      // Should acknowledge the complexity of mixed emotions
      expect(response).toMatch(/(balance|feeling|both|complex|mixed|challenging|accomplish|worry|stress|excitement)/i)
      
      cleanupEntryIds.push(followUpResult.data.entry.id)
    })
  })

  describe('Task 5.3: Enhanced Conversation Management', () => {
    test('should allow users to end conversation at any point with proper validation', async () => {
      // Create new conversation
      const createResponse = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(createResponse.status).toBe(201)
      const createResult = await createResponse.json()
      const conversationId = createResult.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add just one message
      const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: "Just a quick thought before I go.",
          role: 'user'
        })
      })

      expect(messageResponse.status).toBe(201)
      const messageResult = await messageResponse.json()
      cleanupEntryIds.push(messageResult.data.entry.id)

      // User should be able to end conversation immediately
      const endResponse = await app.request(`/api/journal/conversations/${conversationId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(endResponse.status).toBe(200)
      const endResult = await endResponse.json()
      
      expect(endResult.success).toBe(true)
      expect(endResult.data.conversation.isActive).toBe(false)
      expect(endResult.data.conversation.endedAt).toBeDefined()
    })

    test('should provide conversation summary and metadata when ending conversation', async () => {
      // Create new conversation
      const createResponse = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(createResponse.status).toBe(201)
      const createResult = await createResponse.json()
      const conversationId = createResult.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add meaningful conversation
      const messages = [
        "I went for a hike in the mountains today. The weather was perfect and the views were breathtaking.",
        "I felt so peaceful and connected to nature. It reminded me why I love outdoor adventures.",
        "I also realized I want to share more experiences like this with my family."
      ]

      for (const message of messages) {
        const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            content: message,
            role: 'user'
          })
        })

        expect(messageResponse.status).toBe(201)
        const messageResult = await messageResponse.json()
        cleanupEntryIds.push(messageResult.data.entry.id)
      }

      // End conversation and check metadata
      const endResponse = await app.request(`/api/journal/conversations/${conversationId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(endResponse.status).toBe(200)
      const endResult = await endResponse.json()
      
      expect(endResult.success).toBe(true)
      expect(endResult.data.conversation.isActive).toBe(false)
      expect(endResult.data.conversation.title).toBeDefined()
      expect(endResult.data.conversation.summary).toBeDefined()
      expect(endResult.data.conversation.synopsis).toBeDefined()
      expect(endResult.data.conversation.contentTags).toBeDefined()
      
      // Should detect adventure/nature content
      const title = endResult.data.conversation.title.toLowerCase()
      const summary = endResult.data.conversation.summary.toLowerCase()
      expect(title + ' ' + summary).toMatch(/(hike|mountain|nature|adventure|peaceful|outdoor)/i)
    })

    test('should handle conversation ending with appropriate mood detection', async () => {
      // Create new conversation
      const createResponse = await app.request('/api/journal/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(createResponse.status).toBe(201)
      const createResult = await createResponse.json()
      const conversationId = createResult.data.conversation.id
      cleanupConversationIds.push(conversationId)

      // Add emotionally charged content
      const messageResponse = await app.request(`/api/journal/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          content: "I'm feeling grateful for my family and excited about our upcoming vacation. Life feels wonderful right now!",
          role: 'user'
        })
      })

      expect(messageResponse.status).toBe(201)
      const messageResult = await messageResponse.json()
      cleanupEntryIds.push(messageResult.data.entry.id)

      // End conversation and check mood detection
      const endResponse = await app.request(`/api/journal/conversations/${conversationId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(endResponse.status).toBe(200)
      const endResult = await endResponse.json()
      
      expect(endResult.success).toBe(true)
      
      // Should detect positive mood in content tags or summary
      const contentTags = endResult.data.conversation.contentTags || []
      const summary = endResult.data.conversation.summary?.toLowerCase() || ''
      
      const positiveIndicators = contentTags.some((tag: string) => 
        ['happy', 'grateful', 'excited', 'positive', 'wonderful'].includes(tag.toLowerCase())
      ) || summary.includes('grateful') || summary.includes('excited') || summary.includes('wonderful')
      
      expect(positiveIndicators).toBe(true)
    })

    test('should prevent unauthorized users from ending conversations', async () => {
      expect(testConversationId).toBeTruthy()

      // Create another user
      const { user: otherUser } = await createTestUser({
        email: 'other-end-test@example.com',
        name: 'Other End Test User'
      })
      cleanupUserIds.push(otherUser.id)

      // Other user should not be able to end first user's conversation
      const endResponse = await app.request(`/api/journal/conversations/${testConversationId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otherUser.id
        })
      })

      expect(endResponse.status).toBe(404) // Should return 404 for conversations not belonging to user
      const endResult = await endResponse.json()
      expect(endResult.success).toBe(false)
      expect(endResult.error).toContain('Conversation not found')
    })
  })
})
