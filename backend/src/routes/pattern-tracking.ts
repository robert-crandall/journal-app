import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PatternTrackingService } from '../services/pattern-tracking'
import { db } from '../db/connection'
import { taskCompletionPatterns, taskCompletionEvents, patternInsights, users } from '../db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'

// Pattern tracking routes for AI learning - Task 3.10
const app = new Hono()

// Validation schemas
const userIdQuerySchema = z.object({
  userId: z.string().uuid()
})

const recordEventSchema = z.object({
  userId: z.string().uuid(),
  taskId: z.string().uuid(),
  completionId: z.string().uuid().optional(),
  eventType: z.enum(['completed', 'skipped', 'failed']),
  taskSource: z.string(),
  xpAwarded: z.number().optional(),
  feedback: z.string().optional(),
  familyMemberId: z.string().uuid().optional()
})

const generateInsightsSchema = z.object({
  userId: z.string().uuid()
})

// POST /api/patterns/events - Record task completion event
app.post('/events',
  zValidator('json', recordEventSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')

      // Validate user exists
      const [user] = await db.select().from(users).where(eq(users.id, data.userId)).limit(1)
      if (!user) {
        return c.json({ 
          success: false, 
          message: 'User not found' 
        }, 404)
      }

      await PatternTrackingService.recordTaskCompletionEvent(data)

      return c.json({
        success: true,
        message: 'Task completion event recorded successfully'
      })

    } catch (error) {
      console.error('Error recording task completion event:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to record task completion event' 
      }, 500)
    }
  }
)

// GET /api/patterns/ai-context - Get AI learning context for task generation
app.get('/ai-context',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')

      // Validate user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user) {
        return c.json({ 
          success: false, 
          message: 'User not found' 
        }, 404)
      }

      const context = await PatternTrackingService.getAILearningContext(userId)

      return c.json({
        success: true,
        data: context
      })

    } catch (error) {
      console.error('Error getting AI learning context:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to get AI learning context' 
      }, 500)
    }
  }
)

// POST /api/patterns/insights - Generate new insights from patterns
app.post('/insights',
  zValidator('json', generateInsightsSchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('json')

      // Validate user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user) {
        return c.json({ 
          success: false, 
          message: 'User not found' 
        }, 404)
      }

      const insights = await PatternTrackingService.generateInsights(userId)

      return c.json({
        success: true,
        data: insights,
        message: `Generated ${insights.length} new insights`
      })

    } catch (error) {
      console.error('Error generating insights:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to generate insights' 
      }, 500)
    }
  }
)

// GET /api/patterns - Get user patterns summary
app.get('/',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')

      // Validate user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user) {
        return c.json({ 
          success: false, 
          message: 'User not found' 
        }, 404)
      }

      const summary = await PatternTrackingService.getPatternSummary(userId)

      // Get recent patterns
      const recentPatterns = await db.select()
        .from(taskCompletionPatterns)
        .where(eq(taskCompletionPatterns.userId, userId))
        .orderBy(desc(taskCompletionPatterns.lastObserved))
        .limit(10)

      // Get active insights
      const activeInsights = await db.select()
        .from(patternInsights)
        .where(and(
          eq(patternInsights.userId, userId),
          eq(patternInsights.isActive, true)
        ))
        .orderBy(desc(patternInsights.confidenceScore))
        .limit(5)

      return c.json({
        success: true,
        data: {
          summary,
          recentPatterns: recentPatterns.map(p => ({
            id: p.id,
            type: p.patternType,
            key: p.patternKey,
            strength: p.strength,
            confidence: parseFloat(p.confidence || '0'),
            successRate: p.successfulCompletions / p.totalOccurrences,
            totalOccurrences: p.totalOccurrences,
            lastObserved: p.lastObserved
          })),
          activeInsights: activeInsights.map(i => ({
            id: i.id,
            type: i.insightType,
            title: i.title,
            description: i.description,
            confidence: parseFloat(i.confidenceScore || '0'),
            priority: i.priority,
            evidenceCount: i.evidenceCount
          }))
        }
      })

    } catch (error) {
      console.error('Error getting patterns:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to get patterns' 
      }, 500)
    }
  }
)

// GET /api/patterns/events - Get recent completion events for analysis
app.get('/events',
  zValidator('query', userIdQuerySchema.extend({
    limit: z.string().transform(Number).optional(),
    days: z.string().transform(Number).optional()
  })),
  async (c) => {
    try {
      const query = c.req.valid('query')
      const { userId, limit = 50, days = 30 } = query

      // Validate user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user) {
        return c.json({ 
          success: false, 
          message: 'User not found' 
        }, 404)
      }

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const events = await db.select()
        .from(taskCompletionEvents)
        .where(and(
          eq(taskCompletionEvents.userId, userId),
          gte(taskCompletionEvents.eventTimestamp, cutoffDate)
        ))
        .orderBy(desc(taskCompletionEvents.eventTimestamp))
        .limit(limit)

      return c.json({
        success: true,
        data: {
          events: events.map(e => ({
            id: e.id,
            eventType: e.eventType,
            eventTimestamp: e.eventTimestamp,
            taskSource: e.taskSource,
            timeOfDay: e.timeOfDay,
            dayOfWeek: e.dayOfWeek,
            xpAwarded: e.xpAwarded,
            feedbackSentiment: e.feedbackSentiment ? parseFloat(e.feedbackSentiment) : null,
            userMood: e.userMood,
            previousTaskCompletion: e.previousTaskCompletion
          })),
          totalEvents: events.length,
          dateRange: {
            from: cutoffDate.toISOString(),
            to: new Date().toISOString()
          }
        }
      })

    } catch (error) {
      console.error('Error getting completion events:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to get completion events' 
      }, 500)
    }
  }
)

// PUT /api/patterns/:id - Update pattern (mark as avoid, add recommendation)
app.put('/:id',
  zValidator('query', userIdQuerySchema),
  zValidator('json', z.object({
    shouldAvoid: z.boolean().optional(),
    recommendation: z.string().optional()
  })),
  async (c) => {
    try {
      const patternId = c.req.param('id')
      const { userId } = c.req.valid('query')
      const updates = c.req.valid('json')

      // Validate user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user) {
        return c.json({ 
          success: false, 
          message: 'User not found' 
        }, 404)
      }

      // Validate pattern exists and belongs to user
      const [pattern] = await db.select()
        .from(taskCompletionPatterns)
        .where(and(
          eq(taskCompletionPatterns.id, patternId),
          eq(taskCompletionPatterns.userId, userId)
        ))
        .limit(1)

      if (!pattern) {
        return c.json({ 
          success: false, 
          message: 'Pattern not found' 
        }, 404)
      }

      // Update pattern
      const updateData: any = {
        updatedAt: new Date()
      }

      if (updates.shouldAvoid !== undefined) {
        updateData.shouldAvoid = updates.shouldAvoid
      }

      if (updates.recommendation) {
        updateData.recommendation = updates.recommendation
      }

      const [updatedPattern] = await db.update(taskCompletionPatterns)
        .set(updateData)
        .where(eq(taskCompletionPatterns.id, patternId))
        .returning()

      return c.json({
        success: true,
        data: updatedPattern,
        message: 'Pattern updated successfully'
      })

    } catch (error) {
      console.error('Error updating pattern:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to update pattern' 
      }, 500)
    }
  }
)

export default app
