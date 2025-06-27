import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/connection'
import { users, characters, characterStats, journalConversations, journalEntries } from '../db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { AIService } from '../services/ai-service'

// Initialize AI service
const aiService = new AIService()

// Validation schemas
const createConversationSchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
})

const addMessageSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  content: z.string(),
  role: z.enum(['user', 'assistant'])
})

const endConversationSchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
})

const userIdQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
})

const conversationListQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  limit: z.string().optional().default('20').transform(val => {
    const num = Number(val)
    if (isNaN(num) || num < 1 || num > 100) {
      throw new Error('Limit must be between 1 and 100')
    }
    return num
  }),
  offset: z.string().optional().default('0').transform(val => {
    const num = Number(val)
    if (isNaN(num) || num < 0) {
      throw new Error('Offset must be 0 or greater')
    }
    return num
  })
})

const app = new Hono()

// POST /api/journal/conversations - Start new journal conversation
app.post('/conversations',
  zValidator('json', createConversationSchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('json')

      // Verify user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        return c.json({
          success: false,
          error: 'User not found'
        }, 404)
      }

      // Create new conversation
      const [conversation] = await db
        .insert(journalConversations)
        .values({
          userId,
          isActive: true
        })
        .returning()

      return c.json({
        success: true,
        data: { conversation }
      }, 201)

    } catch (error) {
      console.error('Error creating journal conversation:', error)
      return c.json({
        success: false,
        error: 'Failed to create journal conversation'
      }, 500)
    }
  }
)

// POST /api/journal/conversations/:id/messages - Add message to conversation
app.post('/conversations/:id/messages',
  zValidator('json', addMessageSchema),
  async (c) => {
    try {
      const conversationId = c.req.param('id')
      const { userId, content, role } = c.req.valid('json')

      // First check if conversation exists at all
      const [conversationExists] = await db
        .select()
        .from(journalConversations)
        .where(eq(journalConversations.id, conversationId))
        .limit(1)

      if (!conversationExists) {
        return c.json({
          success: false,
          error: 'Conversation not found'
        }, 404)
      }

      // Then check if user owns this conversation
      if (conversationExists.userId !== userId) {
        return c.json({
          success: false,
          error: 'Unauthorized: You do not own this conversation'
        }, 403)
      }

      const conversation = conversationExists

      // Check if conversation is still active
      if (!conversation.isActive) {
        return c.json({
          success: false,
          error: 'Conversation is not active'
        }, 400)
      }

      let messageContent = content

      // If role is assistant and content is empty, generate GPT response
      if (role === 'assistant' && content.trim() === '') {
        // Get conversation history for context
        const existingMessages = await db
          .select()
          .from(journalEntries)
          .where(eq(journalEntries.conversationId, conversationId))
          .orderBy(journalEntries.createdAt)

        // Generate GPT response based on conversation history
        const conversationHistory = existingMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))

        // Generate follow-up question or response
        if (aiService.isConfigured()) {
          try {
            const response = await aiService.generateCompletion({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: `You are a supportive journal companion helping someone reflect on their day. Ask thoughtful follow-up questions to help them explore their experiences, emotions, and thoughts. Be empathetic, curious, and encouraging. Keep responses conversational and not too long.`
                },
                ...conversationHistory,
                {
                  role: 'user',
                  content: 'Please ask me a thoughtful follow-up question to help me reflect further on what I\'ve shared.'
                }
              ],
              maxTokens: 200,
              temperature: 0.7
            })

            if (response.success && response.content) {
              messageContent = response.content
            } else {
              messageContent = "That's interesting. How did that make you feel? Can you tell me more about what was going through your mind?"
            }
          } catch (error) {
            console.error('Error generating GPT response:', error)
            messageContent = "Thank you for sharing that with me. What was the most significant part of that experience for you?"
          }
        } else {
          // Fallback questions when AI is not configured
          const fallbackQuestions = [
            "That's interesting. How did that make you feel?",
            "Can you tell me more about what was going through your mind?",
            "What was the most significant part of that experience for you?",
            "How do you think that experience might influence you going forward?",
            "What emotions came up for you during that time?",
            "Is there anything about that situation you'd handle differently?",
            "What did you learn about yourself from that experience?"
          ]
          messageContent = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]
        }
      }

      // Create journal entry
      const [entry] = await db
        .insert(journalEntries)
        .values({
          conversationId,
          userId,
          content: messageContent,
          role
        })
        .returning()

      return c.json({
        success: true,
        data: { entry }
      }, 201)

    } catch (error) {
      console.error('Error adding message to conversation:', error)
      return c.json({
        success: false,
        error: 'Failed to add message to conversation'
      }, 500)
    }
  }
)

// PUT /api/journal/conversations/:id/end - End conversation and process with AI
app.put('/conversations/:id/end',
  zValidator('json', endConversationSchema),
  async (c) => {
    try {
      const conversationId = c.req.param('id')
      const { userId } = c.req.valid('json')

      // Verify conversation exists and belongs to user
      const [conversation] = await db
        .select()
        .from(journalConversations)
        .where(and(
          eq(journalConversations.id, conversationId),
          eq(journalConversations.userId, userId)
        ))
        .limit(1)

      if (!conversation) {
        return c.json({
          success: false,
          error: 'Conversation not found'
        }, 404)
      }

      // Check if conversation is already ended
      if (!conversation.isActive) {
        return c.json({
          success: false,
          error: 'Conversation has already ended'
        }, 400)
      }

      // Get all messages in the conversation
      const messages = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.conversationId, conversationId))
        .orderBy(journalEntries.createdAt)

      // Check if conversation has any messages
      if (messages.length === 0) {
        return c.json({
          success: false,
          error: 'Cannot end conversation with no messages'
        }, 400)
      }

      // Get user's character stats for AI processing
      const [userCharacter] = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId))
        .limit(1)

      let userCharacterStats: string[] = []
      if (userCharacter) {
        const stats = await db
          .select()
          .from(characterStats)
          .where(eq(characterStats.characterId, userCharacter.id))
        userCharacterStats = stats.map(stat => stat.category)
      }

      let processedData = {
        title: 'Journal Entry',
        summary: 'Daily reflection recorded',
        synopsis: 'User shared thoughts and experiences',
        contentTags: ['reflection'] as string[],
        statTags: [] as string[]
      }
      let xpAwards: any[] = []

      // Process conversation with AI if configured
      if (aiService.isConfigured() && messages.length > 0) {
        try {
          const conversationForAI = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }))

          const aiResult = await aiService.processJournal({
            userId,
            conversation: conversationForAI,
            characterStats: userCharacterStats
          })

          if (aiResult.success && aiResult.metadata) {
            processedData = {
              title: aiResult.metadata.title,
              summary: aiResult.metadata.summary,
              synopsis: aiResult.metadata.synopsis,
              contentTags: aiResult.metadata.contentTags,
              statTags: aiResult.metadata.characterStatTags
            }
            xpAwards = aiResult.xpAwards || []
          }
        } catch (error) {
          console.error('Error processing conversation with AI:', error)
          // Continue with fallback data
        }
      }

      // Update conversation with processed data
      const [updatedConversation] = await db
        .update(journalConversations)
        .set({
          isActive: false,
          endedAt: new Date(),
          title: processedData.title,
          summary: processedData.summary,
          synopsis: processedData.synopsis,
          contentTags: processedData.contentTags,
          statTags: processedData.statTags,
          updatedAt: new Date()
        })
        .where(eq(journalConversations.id, conversationId))
        .returning()

      return c.json({
        success: true,
        data: {
          conversation: updatedConversation,
          xpAwards
        }
      })

    } catch (error) {
      console.error('Error ending conversation:', error)
      return c.json({
        success: false,
        error: 'Failed to end conversation'
      }, 500)
    }
  }
)

// GET /api/journal/conversations/:id - Get conversation details with messages
app.get('/conversations/:id',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const conversationId = c.req.param('id')
      const { userId } = c.req.valid('query')

      // First check if conversation exists at all
      const [conversationExists] = await db
        .select()
        .from(journalConversations)
        .where(eq(journalConversations.id, conversationId))
        .limit(1)

      if (!conversationExists) {
        return c.json({
          success: false,
          error: 'Conversation not found'
        }, 404)
      }

      // Then check if user owns this conversation
      if (conversationExists.userId !== userId) {
        return c.json({
          success: false,
          error: 'Unauthorized: You do not own this conversation'
        }, 403)
      }

      const conversation = conversationExists

      // Get all messages in the conversation
      const messages = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.conversationId, conversationId))
        .orderBy(journalEntries.createdAt)

      return c.json({
        success: true,
        data: {
          conversation,
          messages
        }
      })

    } catch (error) {
      console.error('Error getting conversation:', error)
      return c.json({
        success: false,
        error: 'Failed to get conversation'
      }, 500)
    }
  }
)

// GET /api/journal/conversations - List user's conversations
app.get('/conversations',
  zValidator('query', conversationListQuerySchema),
  async (c) => {
    try {
      const { userId, limit, offset } = c.req.valid('query')

      // Verify user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        return c.json({
          success: false,
          error: 'User not found'
        }, 404)
      }

      // Get conversations for user
      const conversations = await db
        .select()
        .from(journalConversations)
        .where(eq(journalConversations.userId, userId))
        .orderBy(desc(journalConversations.createdAt))
        .limit(limit)
        .offset(offset)

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(journalConversations)
        .where(eq(journalConversations.userId, userId))

      return c.json({
        success: true,
        data: {
          conversations,
          total: Number(count)
        }
      })

    } catch (error) {
      console.error('Error listing conversations:', error)
      return c.json({
        success: false,
        error: 'Failed to list conversations'
      }, 500)
    }
  }
)

export default app
