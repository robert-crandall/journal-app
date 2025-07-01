import { db } from '../db/connection'
import { 
  taskCompletionPatterns, 
  taskCompletionEvents, 
  patternInsights,
  tasks,
  taskCompletions,
  familyMembers
} from '../db/schema'
import { eq, and, desc, gte, sql, count, avg } from 'drizzle-orm'

// Pattern tracking service for AI learning - Task 3.10
export class PatternTrackingService {
  // Record a task completion event for pattern analysis
  static async recordTaskCompletionEvent(data: {
    userId: string
    taskId: string
    completionId?: string
    eventType: 'completed' | 'skipped' | 'failed'
    taskSource: string
    xpAwarded?: number
    feedback?: string
    familyMemberId?: string
  }) {
    const {
      userId,
      taskId,
      completionId,
      eventType,
      taskSource,
      xpAwarded = 0,
      feedback,
      familyMemberId
    } = data

    // Get task details
    const [task] = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1)

    if (!task) {
      throw new Error('Task not found')
    }

    // Extract contextual information
    const now = new Date()
    const timeOfDay = this.getTimeOfDay(now)
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // Analyze feedback for sentiment and mood
    let feedbackSentiment = 0
    let userMood = null
    let feedbackKeywords: string[] = []
    
    if (feedback) {
      const analysis = this.analyzeFeedback(feedback)
      feedbackSentiment = analysis.sentiment
      userMood = analysis.mood
      feedbackKeywords = analysis.keywords
    }

    // Check if user completed previous task (last 24 hours)
    const previousTaskCompletion = await this.checkPreviousTaskCompletion(userId)

    // Create completion event record
    await db.insert(taskCompletionEvents).values({
      userId,
      taskId,
      completionId: completionId || null,
      eventType,
      eventTimestamp: now,
      taskSource,
      timeOfDay,
      dayOfWeek,
      userMood: userMood || null,
      previousTaskCompletion,
      xpAwarded,
      feedbackSentiment: feedbackSentiment.toString(),
      feedbackKeywords,
      involvesFamilyMember: familyMemberId || null,
    })

    // Update patterns based on this event
    await this.updatePatterns(userId, {
      eventType,
      taskSource,
      timeOfDay,
      dayOfWeek,
      xpAwarded,
      feedbackSentiment,
      task
    })
  }

  // Update patterns based on completion event
  private static async updatePatterns(userId: string, eventData: {
    eventType: string
    taskSource: string
    timeOfDay: string
    dayOfWeek: string
    xpAwarded: number
    feedbackSentiment: number
    task: any
  }) {
    const patterns = [
      // Timing patterns
      {
        type: 'timing',
        key: `${eventData.timeOfDay}_tasks`,
        value: { timeOfDay: eventData.timeOfDay }
      },
      {
        type: 'timing', 
        key: `${eventData.dayOfWeek}_tasks`,
        value: { dayOfWeek: eventData.dayOfWeek }
      },
      // Task type patterns
      {
        type: 'task_type',
        key: `${eventData.taskSource}_preference`,
        value: { taskSource: eventData.taskSource }
      },
      // Stat preference patterns (if target stats exist)
      ...(eventData.task.targetStats ? eventData.task.targetStats.map((stat: string) => ({
        type: 'stat_preference',
        key: `${stat}_tasks`,
        value: { statCategory: stat }
      })) : [])
    ]

    for (const pattern of patterns) {
      await this.updateOrCreatePattern(userId, pattern, {
        successful: eventData.eventType === 'completed',
        xpAwarded: eventData.xpAwarded,
        sentiment: eventData.feedbackSentiment
      })
    }
  }

  // Update or create a specific pattern
  private static async updateOrCreatePattern(
    userId: string, 
    pattern: { type: string, key: string, value: any },
    outcome: { successful: boolean, xpAwarded: number, sentiment: number }
  ) {
    // Try to find existing pattern
    const existing = await db.select()
      .from(taskCompletionPatterns)
      .where(and(
        eq(taskCompletionPatterns.userId, userId),
        eq(taskCompletionPatterns.patternType, pattern.type),
        eq(taskCompletionPatterns.patternKey, pattern.key)
      ))
      .limit(1)

    const now = new Date()

    if (existing.length > 0) {
      // Update existing pattern
      const currentPattern = existing[0]
      const newTotalOccurrences = currentPattern.totalOccurrences + 1
      const newSuccessful = currentPattern.successfulCompletions + (outcome.successful ? 1 : 0)
      const newFailed = currentPattern.failedCompletions + (outcome.successful ? 0 : 1)
      
      // Calculate new averages
      const currentAvgXp = parseFloat(currentPattern.averageXpAwarded || '0')
      const newAvgXp = ((currentAvgXp * currentPattern.totalOccurrences) + outcome.xpAwarded) / newTotalOccurrences
      
      const currentAvgSentiment = parseFloat(currentPattern.averageFeedbackSentiment || '0')
      const newAvgSentiment = ((currentAvgSentiment * currentPattern.totalOccurrences) + outcome.sentiment) / newTotalOccurrences
      
      // Calculate confidence and strength
      const successRate = newSuccessful / newTotalOccurrences
      const confidence = Math.min(newTotalOccurrences / 10, 1) // Full confidence after 10 occurrences
      const strength = successRate > 0.7 ? 'strong' : successRate > 0.4 ? 'moderate' : 'weak'

      await db.update(taskCompletionPatterns)
        .set({
          totalOccurrences: newTotalOccurrences,
          successfulCompletions: newSuccessful,
          failedCompletions: newFailed,
          averageXpAwarded: newAvgXp.toFixed(2),
          averageFeedbackSentiment: newAvgSentiment.toFixed(2),
          confidence: confidence.toFixed(2),
          strength,
          lastObserved: now,
          lastUpdated: now,
          updatedAt: now
        })
        .where(eq(taskCompletionPatterns.id, currentPattern.id))
    } else {
      // Create new pattern
      const confidence = Math.min(1 / 10, 1)
      const strength = outcome.successful ? 'weak' : 'weak' // Start as weak until more data

      await db.insert(taskCompletionPatterns).values({
        userId,
        patternType: pattern.type,
        patternKey: pattern.key,
        patternValue: pattern.value,
        totalOccurrences: 1,
        successfulCompletions: outcome.successful ? 1 : 0,
        failedCompletions: outcome.successful ? 0 : 1,
        averageXpAwarded: outcome.xpAwarded.toFixed(2),
        averageFeedbackSentiment: outcome.sentiment.toFixed(2),
        confidence: confidence.toFixed(2),
        strength,
        firstObserved: now,
        lastObserved: now,
        lastUpdated: now
      })
    }
  }

  // Get AI learning context for task generation
  static async getAILearningContext(userId: string) {
    // Get all patterns for comprehensive context
    const allPatterns = await db.select()
      .from(taskCompletionPatterns)
      .where(eq(taskCompletionPatterns.userId, userId))
      .orderBy(desc(taskCompletionPatterns.confidence))
      .limit(50)

    // Get strong patterns for recommendations
    const strongPatterns = allPatterns.filter(p => p.strength === 'strong')

    // Get patterns to avoid
    const avoidPatterns = await db.select()
      .from(taskCompletionPatterns)
      .where(and(
        eq(taskCompletionPatterns.userId, userId),
        eq(taskCompletionPatterns.shouldAvoid, true)
      ))
      .limit(10)

    // Get recent insights
    const insights = await db.select()
      .from(patternInsights)
      .where(and(
        eq(patternInsights.userId, userId),
        eq(patternInsights.isActive, true)
      ))
      .orderBy(desc(patternInsights.confidenceScore))
      .limit(10)

    // Get task completion statistics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentEvents = await db.select()
      .from(taskCompletionEvents)
      .where(and(
        eq(taskCompletionEvents.userId, userId),
        gte(taskCompletionEvents.eventTimestamp, thirtyDaysAgo)
      ))

    const totalCompletions = recentEvents.filter(e => e.eventType === 'completed').length
    const totalXp = recentEvents.reduce((sum, e) => sum + (e.xpAwarded || 0), 0)
    const averageXp = totalCompletions > 0 ? totalXp / totalCompletions : 0

    // Get timing preferences
    const timingPatterns = strongPatterns.filter(p => p.patternType === 'timing')
    const taskTypePatterns = strongPatterns.filter(p => p.patternType === 'task_type')
    const statPatterns = strongPatterns.filter(p => p.patternType === 'stat_preference')

    return {
      patterns: allPatterns.map(p => ({
        id: p.id,
        type: p.patternType,
        key: p.patternKey,
        value: p.patternValue,
        strength: p.strength,
        confidence: parseFloat(p.confidence || '0'),
        successRate: p.totalOccurrences > 0 ? p.successfulCompletions / p.totalOccurrences : 0,
        totalOccurrences: p.totalOccurrences,
        averageXp: parseFloat(p.averageXpAwarded || '0'),
        shouldAvoid: p.shouldAvoid
      })),
      taskHistory: {
        totalCompletions,
        averageXp,
        totalXp,
        recentEvents: recentEvents.length,
        successRate: recentEvents.length > 0 ? totalCompletions / recentEvents.length : 0
      },
      preferences: {
        optimalTiming: timingPatterns.map(p => ({
          pattern: p.patternKey,
          confidence: parseFloat(p.confidence || '0'),
          successRate: p.successfulCompletions / p.totalOccurrences,
          averageXp: parseFloat(p.averageXpAwarded || '0')
        })),
        preferredTaskTypes: taskTypePatterns.map(p => ({
          taskSource: p.patternKey,
          confidence: parseFloat(p.confidence || '0'),
          successRate: p.successfulCompletions / p.totalOccurrences
        })),
        preferredStats: statPatterns.map(p => ({
          statCategory: p.patternKey.replace('_tasks', ''),
          confidence: parseFloat(p.confidence || '0'),
          successRate: p.successfulCompletions / p.totalOccurrences
        }))
      },
      avoidances: avoidPatterns.map(p => ({
        pattern: p.patternKey,
        reason: p.recommendation || 'Low success rate',
        confidence: parseFloat(p.confidence || '0')
      })),
      insights: insights.map(i => ({
        type: i.insightType,
        title: i.title,
        description: i.description,
        aiContext: i.aiContext,
        priority: i.priority,
        confidence: parseFloat(i.confidenceScore || '0')
      })),
      familyContext: await this.getFamilyContext(userId)
    }
  }

  // Get family context for AI learning
  private static async getFamilyContext(userId: string) {
    const family = await db.select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId))

    return family.map(member => ({
      id: member.id,
      name: member.name,
      age: member.age,
      interests: member.interests,
      interactionFrequency: member.interactionFrequency,
      lastInteraction: member.lastInteraction
    }))
  }

  // Generate insights from patterns
  static async generateInsights(userId: string) {
    const patterns = await db.select()
      .from(taskCompletionPatterns)
      .where(eq(taskCompletionPatterns.userId, userId))
      .orderBy(desc(taskCompletionPatterns.confidence))

    const insights = []

    // Timing insights
    const timingPatterns = patterns.filter(p => p.patternType === 'timing')
    const bestTiming = timingPatterns
      .filter(p => p.totalOccurrences >= 3)
      .sort((a, b) => (b.successfulCompletions / b.totalOccurrences) - (a.successfulCompletions / a.totalOccurrences))[0]

    if (bestTiming) {
      insights.push({
        type: 'optimal_timing',
        title: `Peak Performance Time`,
        description: `You perform best during ${bestTiming.patternKey.replace('_tasks', '')} with ${Math.round((bestTiming.successfulCompletions / bestTiming.totalOccurrences) * 100)}% success rate`,
        confidenceScore: parseFloat(bestTiming.confidence || '0'),
        evidenceCount: bestTiming.totalOccurrences,
        aiContext: {
          preferredTime: bestTiming.patternKey.replace('_tasks', ''),
          successRate: bestTiming.successfulCompletions / bestTiming.totalOccurrences,
          averageXp: parseFloat(bestTiming.averageXpAwarded || '0')
        },
        priority: 'high'
      })
    }

    // Stat preference insights
    const statPatterns = patterns.filter(p => p.patternType === 'stat_preference')
    const preferredStats = statPatterns
      .filter(p => p.totalOccurrences >= 2)
      .sort((a, b) => parseFloat(b.averageFeedbackSentiment || '0') - parseFloat(a.averageFeedbackSentiment || '0'))
      .slice(0, 3)

    if (preferredStats.length > 0) {
      insights.push({
        type: 'stat_focus',
        title: 'Favorite Skill Areas',
        description: `You show strong engagement with: ${preferredStats.map(p => p.patternKey.replace('_tasks', '')).join(', ')}`,
        confidenceScore: preferredStats.reduce((sum, p) => sum + parseFloat(p.confidence || '0'), 0) / preferredStats.length,
        evidenceCount: preferredStats.reduce((sum, p) => sum + p.totalOccurrences, 0),
        aiContext: {
          preferredStats: preferredStats.map(p => p.patternKey.replace('_tasks', '')),
          avgSentiment: preferredStats.reduce((sum, p) => sum + parseFloat(p.averageFeedbackSentiment || '0'), 0) / preferredStats.length
        },
        priority: 'medium'
      })
    }

    // Save insights to database
    for (const insight of insights) {
      await db.insert(patternInsights).values({
        userId,
        insightType: insight.type,
        title: insight.title,
        description: insight.description,
        confidenceScore: insight.confidenceScore.toFixed(2),
        evidenceCount: insight.evidenceCount,
        aiContext: insight.aiContext,
        priority: insight.priority
      })
    }

    return insights
  }

  /**
   * Get pattern summary for user dashboard
   */
  static async getPatternSummary(userId: string): Promise<any> {
    try {
      // Get total patterns
      const totalPatterns = await db.select({ count: sql<number>`count(*)` })
        .from(taskCompletionPatterns)
        .where(eq(taskCompletionPatterns.userId, userId))

      // Get strong patterns (confidence > 0.7)
      const strongPatterns = await db.select({ count: sql<number>`count(*)` })
        .from(taskCompletionPatterns)
        .where(and(
          eq(taskCompletionPatterns.userId, userId),
          sql`${taskCompletionPatterns.confidence}::decimal > 0.7`
        ))

      // Get total events in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentEvents = await db.select({ count: sql<number>`count(*)` })
        .from(taskCompletionEvents)
        .where(and(
          eq(taskCompletionEvents.userId, userId),
          gte(taskCompletionEvents.eventTimestamp, thirtyDaysAgo)
        ))

      // Get active insights
      const activeInsights = await db.select({ count: sql<number>`count(*)` })
        .from(patternInsights)
        .where(and(
          eq(patternInsights.userId, userId),
          eq(patternInsights.isActive, true)
        ))

      return {
        totalPatterns: Number(totalPatterns[0]?.count) || 0,
        strongPatterns: Number(strongPatterns[0]?.count) || 0,
        recentEvents: Number(recentEvents[0]?.count) || 0,
        activeInsights: Number(activeInsights[0]?.count) || 0,
        lastUpdated: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error getting pattern summary:', error)
      throw error
    }
  }

  // Helper methods
  private static getTimeOfDay(date: Date): string {
    const hour = date.getHours()
    if (hour < 6) return 'night'
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }

  private static analyzeFeedback(feedback: string): { sentiment: number, mood: string | null, keywords: string[] } {
    // Simple sentiment analysis (in production, use a proper NLP service)
    const positive = ['great', 'amazing', 'fantastic', 'loved', 'enjoyed', 'perfect', 'excellent', 'wonderful']
    const negative = ['terrible', 'awful', 'hated', 'difficult', 'frustrating', 'boring', 'hard', 'challenging']
    
    const words = feedback.toLowerCase().split(/\s+/)
    let sentiment = 0
    const keywords: string[] = []
    
    for (const word of words) {
      if (positive.includes(word)) {
        sentiment += 1
        keywords.push(word)
      } else if (negative.includes(word)) {
        sentiment -= 1
        keywords.push(word)
      }
    }
    
    // Normalize sentiment to -1 to 1 range
    const normalizedSentiment = Math.max(-1, Math.min(1, sentiment / words.length * 10))
    
    // Determine mood
    let mood = null
    if (normalizedSentiment > 0.3) mood = 'positive'
    else if (normalizedSentiment < -0.3) mood = 'negative'
    else mood = 'neutral'
    
    return { sentiment: normalizedSentiment, mood, keywords }
  }

  private static async checkPreviousTaskCompletion(userId: string): Promise<boolean> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const previousCompletion = await db.select()
      .from(taskCompletionEvents)
      .where(and(
        eq(taskCompletionEvents.userId, userId),
        eq(taskCompletionEvents.eventType, 'completed'),
        gte(taskCompletionEvents.eventTimestamp, yesterday)
      ))
      .limit(1)
    
    return previousCompletion.length > 0
  }
}
