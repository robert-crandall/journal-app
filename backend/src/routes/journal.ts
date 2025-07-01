import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/connection'
import { users, characters, characterStats, journalConversations, journalEntries } from '../db/schema'
import { eq, and, desc, sql, gte } from 'drizzle-orm'
import { AIService } from '../services/ai-service'
import { ContentTagService } from '../services/content-tag-service'
import { CharacterStatTagService } from '../services/character-stat-tag-service'
import { XpAwardService } from '../services/xp-award-service'
import { JournalHistoryService } from '../services/journal-history-service'
import { analyzeMoodAndContent, generateContextualQuestions, getFallbackQuestion, generateSystemPrompt, generateConversationMetadata } from '../utils/mood-content-analysis'

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

const journalHistoryQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  search: z.string().optional(), // Search in title, summary, synopsis
  tags: z.string().optional().transform(val => val ? val.split(',').map(t => t.trim()) : undefined), // Content tags
  statTags: z.string().optional().transform(val => val ? val.split(',').map(t => t.trim()) : undefined), // Stat tags
  mood: z.string().optional(), // Filter by mood
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined), // Date range start
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined), // Date range end
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

const journalSearchQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  query: z.string().min(1, 'Search query is required'),
  searchIn: z.enum(['content', 'metadata', 'all']).optional().default('all'),
  limit: z.string().optional().default('20').transform(val => {
    const num = Number(val)
    if (isNaN(num) || num < 1 || num > 50) {
      throw new Error('Limit must be between 1 and 50')
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
  .post('/conversations',
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
  })
  // POST /api/journal/conversations/:id/messages - Add message to conversation
  .post('/conversations/:id/messages',
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
      console.log('Initial messageContent:', messageContent, 'role:', role, 'content empty?', content.trim() === '')

      // Validate user messages have content
      if (role === 'user' && content.trim() === '') {
        return c.json({
          success: false,
          error: 'User messages cannot be empty'
        }, 400)
      }

      // If role is assistant and content is empty, generate GPT response
      if (role === 'assistant' && content.trim() === '') {
        console.log('Entering assistant message generation logic')
        // Get conversation history for context
        const existingMessages = await db
          .select()
          .from(journalEntries)
          .where(eq(journalEntries.conversationId, conversationId))
          .orderBy(journalEntries.createdAt)

        console.log('Found existing messages:', existingMessages.length)

        // Generate GPT response based on conversation history
        const conversationHistory = existingMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))

        // Get the most recent user message for mood/content analysis
        const recentUserMessage = existingMessages
          .filter(msg => msg.role === 'user')
          .slice(-1)[0]

        console.log('Recent user message found:', !!recentUserMessage, recentUserMessage?.content?.substring(0, 50))

        if (recentUserMessage) {
          // Analyze mood and content of the most recent user message
          const analysis = analyzeMoodAndContent(recentUserMessage.content, conversationHistory)

          // Generate follow-up question or response
          if (aiService.isConfigured()) {
            // Generate system prompt based on mood and content analysis
            const systemPrompt = generateSystemPrompt(analysis)
            
            try {
              const response = await aiService.generateCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: systemPrompt
                  },
                  ...conversationHistory.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                  }))
                ],
                maxTokens: 150,
                temperature: 0.7
              })

              if (response.success && response.content) {
                messageContent = response.content
              } else {
                // AI failed, use fallback
                messageContent = getFallbackQuestion(analysis)
              }
            } catch (error) {
              console.error('Error generating GPT response:', error)
              // AI failed, use fallback
              messageContent = getFallbackQuestion(analysis)
            }
          } else {
            // AI not configured, use fallback based on analysis
            messageContent = getFallbackQuestion(analysis)
          }
        } else {
          // No previous messages, use generic opening
          if (aiService.isConfigured()) {
            try {
              const response = await aiService.generateCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: `You are a supportive journal companion. The user has just started a new journal conversation. Ask them a warm, welcoming question to help them begin reflecting on their day or thoughts. Be encouraging and open-ended.`
                  },
                  {
                    role: 'user',
                    content: 'I\'d like to start journaling. Please ask me an opening question to help me begin.'
                  }
                ],
                maxTokens: 150,
                temperature: 0.7
              })

              if (response.success && response.content) {
                messageContent = response.content
              } else {
                messageContent = "Welcome to your journal! How has your day been so far? What's on your mind right now?"
              }
            } catch (error) {
              console.error('Error generating opening GPT response:', error)
              messageContent = "I'm here to listen. What would you like to reflect on today?"
            }
          } else {
            // Fallback opening questions when AI is not configured
            const openingQuestions = [
              "Welcome to your journal! How has your day been so far?",
              "I'm here to listen. What would you like to reflect on today?",
              "What's been on your mind lately that you'd like to explore?",
              "How are you feeling right now, and what's brought you to journal today?",
              "What happened in your day that you'd like to talk through?"
            ]
            messageContent = openingQuestions[Math.floor(Math.random() * openingQuestions.length)]
          }
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
  })
  // PUT /api/journal/conversations/:id/end - End conversation and process with AI
  .put('/conversations/:id/end',
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
        statTags: [] as string[],
        mood: 'neutral' as string
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
            // Optimize content tags using the ContentTagService
            const optimizedContentTags = await ContentTagService.optimizeContentTags(
              userId,
              aiResult.metadata.contentTags
            )
            
            // Map character stat tags to existing user stats only
            const validStatTags = await CharacterStatTagService.mapToExistingStats(
              userId,
              aiResult.metadata.characterStatTags
            )
            
            processedData = {
              title: aiResult.metadata.title,
              summary: aiResult.metadata.summary,
              synopsis: aiResult.metadata.synopsis,
              contentTags: optimizedContentTags,
              statTags: validStatTags,
              mood: 'neutral' // Default mood - AI service doesn't provide mood yet
            }
            xpAwards = aiResult.xpAwards || []
          }
        } catch (error) {
          console.error('Error processing conversation with AI:', error)
          // Continue with fallback data
        }
      } else {
        // Use content analysis when AI is not available
        const conversationForAnalysis = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
        const fallbackData = generateConversationMetadata(conversationForAnalysis)
        
        // Get mood from sentiment analysis of user content
        const userContent = messages
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join(' ')
        const sentimentAnalysis = analyzeMoodAndContent(userContent)
        
        // Optimize content tags using the ContentTagService
        const optimizedContentTags = await ContentTagService.optimizeContentTags(
          userId,
          fallbackData.contentTags
        )
        
        // Map character stat tags to existing user stats only
        const validStatTags = await CharacterStatTagService.mapToExistingStats(
          userId,
          fallbackData.statTags || []
        )
        
        processedData = {
          ...fallbackData,
          contentTags: optimizedContentTags,
          statTags: validStatTags,
          mood: sentimentAnalysis.mood.sentiment
        }
      }

      // Process XP awards based on stat tags and journal content
      let xpResult = { success: true, awards: [] as any[], errors: [] as string[] }
      if (processedData.statTags.length > 0) {
        // Get the full conversation content for XP processing
        const fullContent = messages
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join(' ')
        
        xpResult = await XpAwardService.processJournalForXp(
          userId,
          processedData.statTags,
          fullContent,
          processedData.contentTags
        )
        
        // Update xpAwards with the new awards (merging with any existing from AI)
        xpAwards = [...xpAwards, ...xpResult.awards]
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
          mood: processedData.mood,
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
  })
  // GET /api/journal/conversations/:id - Get conversation details with messages
  .get('/conversations/:id',
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
  })
  // GET /api/journal/conversations - List user's conversations
  .get('/conversations',
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
  })
  // GET /api/journal/history - Enhanced journal history with search and filtering
  .get('/history',
  zValidator('query', journalHistoryQuerySchema),
  async (c) => {
    try {
      const filters = c.req.valid('query')

      // Verify user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, filters.userId))
        .limit(1)

      if (!user) {
        return c.json({
          success: false,
          error: 'User not found'
        }, 404)
      }

      const result = await JournalHistoryService.searchConversations(filters)

      return c.json({
        success: true,
        data: result
      })

    } catch (error) {
      console.error('Error searching journal history:', error)
      return c.json({
        success: false,
        error: 'Failed to search journal history'
      }, 500)
    }
  })
  // GET /api/journal/stats - Journal statistics and analytics
  .get('/stats',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')

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

      const stats = await JournalHistoryService.getJournalStats(userId)

      return c.json({
        success: true,
        data: stats
      })

    } catch (error) {
      console.error('Error getting journal stats:', error)
      return c.json({
        success: false,
        error: 'Failed to get journal statistics'
      }, 500)
    }
  })
  // GET /api/journal/search - Full-text search within journal content
  .get('/search',
  zValidator('query', journalSearchQuerySchema),
  async (c) => {
    try {
      const { userId, query, searchIn, limit, offset } = c.req.valid('query')

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

      const result = await JournalHistoryService.searchJournalContent(
        userId,
        query,
        searchIn,
        limit,
        offset
      )

      return c.json({
        success: true,
        data: result
      })

    } catch (error) {
      console.error('Error searching journal content:', error)
      return c.json({
        success: false,
        error: 'Failed to search journal content'
      }, 500)
    }
  })
  // GET /api/journal/tags - Get popular tags for autocomplete
  .get('/tags',
  zValidator('query', z.object({
    userId: z.string().uuid('Invalid user ID format'),
    type: z.enum(['content', 'stat']).optional().default('content'),
    limit: z.string().optional().default('20').transform(val => {
      const num = Number(val)
      if (isNaN(num) || num < 1 || num > 50) {
        throw new Error('Limit must be between 1 and 50')
      }
      return num
    })
  })),
  async (c) => {
    try {
      const { userId, type, limit } = c.req.valid('query')

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

      const tags = await JournalHistoryService.getPopularTags(userId, type, limit)

      return c.json({
        success: true,
        data: { tags }
      })

    } catch (error) {
      console.error('Error getting popular tags:', error)
      return c.json({
        success: false,
        error: 'Failed to get popular tags'
      }, 500)
    }
  })
  // Homepage journal integration endpoints
  // POST /api/journal/quick-start - Start journal with AI opening question
  .post('/quick-start',
  zValidator('json', z.object({
    userId: z.string().uuid('Invalid user ID format')
  })),
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

      // Check if user already has an active conversation
      const [activeConversation] = await db
        .select()
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          eq(journalConversations.isActive, true)
        ))
        .limit(1)

      if (activeConversation) {
        return c.json({
          success: false,
          error: 'User already has an active conversation. Use /quick-continue instead.'
        }, 400)
      }

      // Create new conversation
      const [conversation] = await db
        .insert(journalConversations)
        .values({
          userId,
          isActive: true
        })
        .returning()

      // Generate AI opening question based on user's history
      const recentEntries = await db
        .select({
          content: journalEntries.content,
          createdAt: journalEntries.createdAt
        })
        .from(journalEntries)
        .innerJoin(journalConversations, eq(journalEntries.conversationId, journalConversations.id))
        .where(eq(journalConversations.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(5)

      // Generate opening question
      const response = await aiService.generateCompletion({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a thoughtful journal companion. Generate a brief, engaging opening question for a journal session. Make it personal and thoughtful, designed to help the user reflect on their current state, recent experiences, or goals. Keep it under 50 words and avoid generic questions. Recent user activity context: ${recentEntries.length > 0 ? 'User has been journaling regularly' : 'New or returning user'}`
          }
        ],
        maxTokens: 100,
        temperature: 0.8
      })

      const openingQuestion = response.success ? (response.content || 'How are you feeling today? What would you like to explore in your journal?') : 'How are you feeling today? What would you like to explore in your journal?'

      // Add the AI opening message to the conversation
      const [openingMessage] = await db
        .insert(journalEntries)
        .values({
          conversationId: conversation.id,
          userId: userId,
          content: openingQuestion,
          role: 'assistant'
        })
        .returning()

      return c.json({
        success: true,
        data: { 
          conversation,
          openingMessage: {
            id: openingMessage.id,
            content: openingMessage.content,
            role: openingMessage.role,
            createdAt: openingMessage.createdAt
          }
        }
      }, 201)

    } catch (error) {
      console.error('Error starting quick journal:', error)
      return c.json({
        success: false,
        error: 'Failed to start quick journal session'
      }, 500)
    }
  })
  // GET /api/journal/recent-activity - Recent activity summary for homepage dashboard
  .get('/recent-activity',
  zValidator('query', z.object({
    userId: z.string().uuid('Invalid user ID format'),
    days: z.string().optional().default('7').transform(val => {
      const num = Number(val)
      if (isNaN(num) || num < 1 || num > 30) {
        throw new Error('Days must be between 1 and 30')
      }
      return num
    })
  })),
  async (c) => {
    try {
      const { userId, days } = c.req.valid('query')

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

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get recent journal statistics
      const stats = await JournalHistoryService.getJournalStats(userId)
      
      // Get count for the specified time period
      const [periodCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          gte(journalConversations.createdAt, startDate)
        ))
      
      // Add period-specific stats
      const enhancedStats = {
        ...stats,
        [`last${days}Days`]: periodCount.count
      }
      
      // Get recent entries (last 3)
      const recentEntries = await db
        .select({
          id: journalConversations.id,
          title: journalConversations.title,
          summary: journalConversations.summary,
          mood: journalConversations.mood,
          createdAt: journalConversations.createdAt,
          updatedAt: journalConversations.updatedAt
        })
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          eq(journalConversations.isActive, false),
          gte(journalConversations.createdAt, startDate)
        ))
        .orderBy(desc(journalConversations.updatedAt))
        .limit(3)

      return c.json({
        success: true,
        data: {
          stats: enhancedStats,
          recentEntries,
          periodDays: days
        }
      })

    } catch (error) {
      console.error('Error getting recent activity:', error)
      return c.json({
        success: false,
        error: 'Failed to get recent journal activity'
      }, 500)
    }
  })
  // GET /api/journal/status - Check active conversation status
  .get('/status',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')

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

      // Check for active conversation
      const [activeConversation] = await db
        .select({
          id: journalConversations.id,
          createdAt: journalConversations.createdAt,
          updatedAt: journalConversations.updatedAt
        })
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          eq(journalConversations.isActive, true)
        ))
        .limit(1)

      // Get message count for active conversation
      let messageCount = 0
      if (activeConversation) {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(journalEntries)
          .where(eq(journalEntries.conversationId, activeConversation.id))
        messageCount = countResult.count
      }

      return c.json({
        success: true,
        data: {
          hasActiveConversation: !!activeConversation,
          activeConversation: activeConversation ? {
            id: activeConversation.id,
            createdAt: activeConversation.createdAt,
            updatedAt: activeConversation.updatedAt,
            messageCount
          } : null,
          canStartNew: !activeConversation
        }
      })

    } catch (error) {
      console.error('Error checking journal status:', error)
      return c.json({
        success: false,
        error: 'Failed to check journal status'
      }, 500)
    }
  })
  // GET /api/journal/quick-continue - Continue active conversation
  .get('/quick-continue',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')

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

      // Get active conversation
      const [activeConversation] = await db
        .select()
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          eq(journalConversations.isActive, true)
        ))
        .limit(1)

      if (!activeConversation) {
        return c.json({
          success: false,
          error: 'No active conversation found. Use /quick-start to begin.'
        }, 404)
      }

      // Get recent messages (last 5)
      const recentMessages = await db
        .select({
          id: journalEntries.id,
          content: journalEntries.content,
          role: journalEntries.role,
          createdAt: journalEntries.createdAt
        })
        .from(journalEntries)
        .where(eq(journalEntries.conversationId, activeConversation.id))
        .orderBy(desc(journalEntries.createdAt))
        .limit(5)

      // Reverse to get chronological order
      recentMessages.reverse()

      // Get total message count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalEntries)
        .where(eq(journalEntries.conversationId, activeConversation.id))

      return c.json({
        success: true,
        data: {
          conversation: activeConversation,
          recentMessages,
          messageCount: countResult.count
        }
      })

    } catch (error) {
      console.error('Error continuing journal conversation:', error)
      return c.json({
        success: false,
        error: 'Failed to continue journal conversation'
      }, 500)
    }
  })
  // GET /api/journal/quick-prompts - Get suggested journal starter prompts
  .get('/quick-prompts',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')

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

      // Get user's recent journal patterns for context
      const recentEntries = await db
        .select({
          content: journalEntries.content,
          createdAt: journalEntries.createdAt
        })
        .from(journalEntries)
        .innerJoin(journalConversations, eq(journalEntries.conversationId, journalConversations.id))
        .where(eq(journalConversations.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(10)

      // Generate contextual prompts
      const response = await aiService.generateCompletion({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate 4 diverse journal starter prompts that would be helpful for a user. Make them:
1. Specific and engaging (not generic)
2. Under 30 words each
3. Focused on different aspects: reflection, planning, gratitude, growth
4. Personalized based on their activity level: ${recentEntries.length > 0 ? 'regular journaler' : 'new or returning user'}

Return as a JSON array of strings.`
          }
        ],
        maxTokens: 200,
        temperature: 0.8
      })

      let prompts: string[]
      try {
        if (response.success && response.content) {
          prompts = JSON.parse(response.content)
          if (!Array.isArray(prompts) || prompts.length !== 4) {
            throw new Error('Invalid prompts format')
          }
        } else {
          throw new Error('AI generation failed')
        }
      } catch (parseError) {
        // Fallback prompts if AI response parsing fails
        prompts = [
          "What's one thing you're grateful for today, and why does it matter to you?",
          "Describe a challenge you're facing and one small step you could take toward solving it.",
          "What did you learn about yourself this week?",
          "If you could give your past self one piece of advice, what would it be?"
        ]
      }

      return c.json({
        success: true,
        data: { prompts }
      })

    } catch (error) {
      console.error('Error generating quick prompts:', error)
      return c.json({
        success: false,
        error: 'Failed to generate journal prompts'
      }, 500)
    }
  })
  // POST /api/journal/start-with-prompt - Start with specific prompt
  .post('/start-with-prompt',
  zValidator('json', z.object({
    userId: z.string().uuid('Invalid user ID format'),
    prompt: z.string().min(1, 'Prompt is required')
  })),
  async (c) => {
    try {
      const { userId, prompt } = c.req.valid('json')

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

      // Check if user already has an active conversation
      const [activeConversation] = await db
        .select()
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          eq(journalConversations.isActive, true)
        ))
        .limit(1)

      if (activeConversation) {
        return c.json({
          success: false,
          error: 'User already has an active conversation. Use /quick-continue instead.'
        }, 400)
      }

      // Create new conversation
      const [conversation] = await db
        .insert(journalConversations)
        .values({
          userId,
          isActive: true
        })
        .returning()

      // Add the prompt as the opening message
      const [promptMessage] = await db
        .insert(journalEntries)
        .values({
          conversationId: conversation.id,
          userId: userId,
          content: prompt,
          role: 'assistant'
        })
        .returning()

      return c.json({
        success: true,
        data: { 
          conversation,
          promptMessage: {
            id: promptMessage.id,
            content: promptMessage.content,
            role: promptMessage.role,
            createdAt: promptMessage.createdAt
          }
        }
      }, 201)

    } catch (error) {
      console.error('Error starting journal with prompt:', error)
      return c.json({
        success: false,
        error: 'Failed to start journal with prompt'
      }, 500)
    }
  })
  // GET /api/journal/metrics - Homepage metrics and streak tracking
  .get('/metrics',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')

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

      // Calculate current streak and metrics
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
      
      // Get all journal conversations in chronological order for streak calculation
      const allConversations = await db
        .select({
          createdAt: journalConversations.createdAt
        })
        .from(journalConversations)
        .where(eq(journalConversations.userId, userId))
        .orderBy(desc(journalConversations.createdAt))

      // Calculate current streak (consecutive days with journal entries)
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < allConversations.length; i++) {
        const entryDate = new Date(allConversations[i].createdAt)
        entryDate.setHours(0, 0, 0, 0)
        
        const expectedDate = new Date(today.getTime() - (currentStreak * 24 * 60 * 60 * 1000))
        
        if (entryDate.getTime() === expectedDate.getTime()) {
          currentStreak++
        } else if (entryDate.getTime() < expectedDate.getTime()) {
          break
        }
      }

      // Get total entries count
      const [totalEntriesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalConversations)
        .where(eq(journalConversations.userId, userId))
      
      const totalEntries = totalEntriesResult.count

      // Get entries this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const [monthlyEntriesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          sql`${journalConversations.createdAt} >= ${startOfMonth.toISOString()}`
        ))
      
      const monthlyEntries = monthlyEntriesResult.count

      // Get recent mood trend (last 7 entries)
      const recentMoods = await db
        .select({ mood: journalConversations.mood })
        .from(journalConversations)
        .where(and(
          eq(journalConversations.userId, userId),
          sql`${journalConversations.mood} IS NOT NULL`
        ))
        .orderBy(desc(journalConversations.createdAt))
        .limit(7)

      // Calculate average mood (if we have mood data)
      let averageMood = null
      if (recentMoods.length > 0) {
        const moodSum = recentMoods.reduce((sum, entry) => {
          const moodValue = typeof entry.mood === 'number' ? entry.mood : 0
          return sum + moodValue
        }, 0)
        averageMood = Math.round((moodSum / recentMoods.length) * 10) / 10
      }

      return c.json({
        success: true,
        data: {
          currentStreak,
          totalEntries,
          monthlyEntries,
          averageMood,
          streakUpdatedAt: now.toISOString()
        }
      })

    } catch (error) {
      console.error('Error getting journal metrics:', error)
      return c.json({
        success: false,
        error: 'Failed to get journal metrics'
      }, 500)
    }
  })

export default app
