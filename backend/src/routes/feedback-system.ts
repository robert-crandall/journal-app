import { Hono } from 'hono'
import { db } from '../db/connection'
import { taskCompletions, tasks, familyMembers } from '../db/schema'
import { eq, and, desc, gte, count, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const feedbackApp = new Hono()

// Validation schemas
const analyzeSchema = z.object({
  userId: z.string().uuid(),
  timeframe: z.enum(['7days', '30days', '90days']).default('30days'),
  sourceFilter: z.enum(['ai', 'quest', 'user', 'all']).default('ai')
})

const contextSchema = z.object({
  userId: z.string().uuid(),
  contextType: z.enum(['task_generation', 'difficulty_adjustment', 'timing_optimization'])
})

const sentimentSchema = z.object({
  feedback: z.string().min(1)
})

// Simple sentiment analysis function
function analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral', confidence: number, keywords: string[] } {
  const positiveWords = ['love', 'amazing', 'fantastic', 'perfect', 'great', 'excellent', 'wonderful', 'enjoyed', 'fun', 'exciting', 'awesome', 'brilliant']
  const negativeWords = ['hate', 'terrible', 'awful', 'boring', 'difficult', 'frustrated', 'disappointed', 'bad', 'poor', 'worst', 'annoying', 'hard']
  const neutralWords = ['okay', 'fine', 'alright', 'decent', 'normal', 'average', 'nothing special']

  const words = text.toLowerCase().split(/\s+/)
  let positiveScore = 0
  let negativeScore = 0
  let neutralScore = 0
  const foundKeywords: string[] = []

  for (const word of words) {
    if (positiveWords.some(pw => word.includes(pw))) {
      positiveScore++
      foundKeywords.push(word)
    } else if (negativeWords.some(nw => word.includes(nw))) {
      negativeScore++
      foundKeywords.push(word)
    } else if (neutralWords.some(nuw => word.includes(nuw))) {
      neutralScore++
      foundKeywords.push(word)
    }
  }

  const totalScore = positiveScore + negativeScore + neutralScore
  
  if (totalScore === 0) {
    return { sentiment: 'neutral', confidence: 0.5, keywords: [] }
  }

  if (positiveScore > negativeScore && positiveScore > neutralScore) {
    return { 
      sentiment: 'positive', 
      confidence: Math.min(0.9, 0.5 + (positiveScore / totalScore) * 0.4),
      keywords: foundKeywords 
    }
  } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
    return { 
      sentiment: 'negative', 
      confidence: Math.min(0.9, 0.5 + (negativeScore / totalScore) * 0.4),
      keywords: foundKeywords 
    }
  } else {
    return { 
      sentiment: 'neutral', 
      confidence: Math.min(0.8, 0.5 + (neutralScore / totalScore) * 0.3),
      keywords: foundKeywords 
    }
  }
}

function getTimeframeCutoff(timeframe: string): Date {
  const now = new Date()
  switch (timeframe) {
    case '7days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90days':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

// POST /api/feedback/analyze - Analyze feedback patterns for AI learning
feedbackApp.post('/analyze', zValidator('json', analyzeSchema), async (c) => {
  try {
    const { userId, timeframe, sourceFilter } = c.req.valid('json')
    const cutoffDate = getTimeframeCutoff(timeframe)

    // Build query conditions
    let conditions = [
      eq(taskCompletions.userId, userId),
      gte(taskCompletions.completedAt, cutoffDate)
    ]

    // Add source filter if not 'all'
    if (sourceFilter !== 'all') {
      conditions.push(eq(tasks.source, sourceFilter))
    }

    const query = db
      .select({
        feedback: taskCompletions.feedback,
        actualXp: taskCompletions.actualXp,
        taskTitle: tasks.title,
        taskSource: tasks.source,
        completedAt: taskCompletions.completedAt
      })
      .from(taskCompletions)
      .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
      .where(and(...conditions))

    const feedbacks = await query.orderBy(desc(taskCompletions.completedAt))

    // Handle non-AI tasks with simpler response
    if (sourceFilter === 'quest' || sourceFilter === 'user') {
      return c.json({
        success: true,
        data: {
          message: `Non-AI tasks have simpler feedback tracking. Found ${feedbacks.length} completions.`,
          totalFeedbacks: feedbacks.length,
          averageXp: feedbacks.length > 0 ? feedbacks.reduce((sum, f) => sum + (f.actualXp || 0), 0) / feedbacks.length : 0
        }
      })
    }

    // Analyze AI task feedback
    const analysisResults = feedbacks
      .filter(f => f.feedback && f.feedback.trim().length > 0)
      .map(f => ({
        ...f,
        analysis: analyzeSentiment(f.feedback!)
      }))

    const positive = analysisResults.filter(r => r.analysis.sentiment === 'positive')
    const negative = analysisResults.filter(r => r.analysis.sentiment === 'negative')
    const neutral = analysisResults.filter(r => r.analysis.sentiment === 'neutral')

    const sentimentBreakdown = {
      positive: positive.length,
      negative: negative.length,
      neutral: neutral.length
    }

    // Extract patterns
    const positivePatterns = positive.map(p => ({
      feedback: p.feedback,
      keywords: p.analysis.keywords,
      xpAwarded: p.actualXp,
      taskTitle: p.taskTitle
    }))

    const negativePatterns = negative.map(n => ({
      feedback: n.feedback,
      keywords: n.analysis.keywords,
      xpAwarded: n.actualXp,
      taskTitle: n.taskTitle
    }))

    // Generate recommendations based on patterns
    const recommendations = []
    
    if (positive.length > negative.length) {
      recommendations.push('Continue generating similar tasks - user shows positive engagement')
    }
    
    if (negative.length > 0) {
      const commonNegativeKeywords = negativePatterns
        .flatMap(p => p.keywords)
        .reduce((acc, keyword) => {
          acc[keyword] = (acc[keyword] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      const topNegativeKeywords = Object.entries(commonNegativeKeywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([keyword]) => keyword)
      
      if (topNegativeKeywords.length > 0) {
        recommendations.push(`Avoid tasks that tend to be: ${topNegativeKeywords.join(', ')}`)
      }
    }

    if (positive.length > 0) {
      const commonPositiveKeywords = positivePatterns
        .flatMap(p => p.keywords)
        .reduce((acc, keyword) => {
          acc[keyword] = (acc[keyword] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      const topPositiveKeywords = Object.entries(commonPositiveKeywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([keyword]) => keyword)
      
      if (topPositiveKeywords.length > 0) {
        recommendations.push(`Focus on tasks that are: ${topPositiveKeywords.join(', ')}`)
      }
    }

    return c.json({
      success: true,
      data: {
        patterns: {
          positive: positivePatterns,
          negative: negativePatterns
        },
        sentimentBreakdown,
        recommendations,
        totalAnalyzed: analysisResults.length,
        timeframe,
        sourceFilter
      }
    })

  } catch (error) {
    console.error('Error analyzing feedback:', error)
    return c.json({ success: false, error: 'Failed to analyze feedback patterns' }, 500)
  }
})

// GET /api/feedback/preferences - Get user task preferences from feedback
feedbackApp.get('/preferences', zValidator('json', z.object({ userId: z.string().uuid() })), async (c) => {
  try {
    const { userId } = c.req.valid('json')
    const cutoffDate = getTimeframeCutoff('90days')

    const feedbacks = await db
      .select({
        feedback: taskCompletions.feedback,
        actualXp: taskCompletions.actualXp,
        taskTitle: tasks.title,
        taskDescription: tasks.description,
        completedAt: taskCompletions.completedAt
      })
      .from(taskCompletions)
      .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
      .where(and(
        eq(taskCompletions.userId, userId),
        eq(tasks.source, 'ai'),
        gte(taskCompletions.completedAt, cutoffDate)
      ))
      .orderBy(desc(taskCompletions.completedAt))

    const analyzedFeedbacks = feedbacks
      .filter(f => f.feedback && f.feedback.trim().length > 0)
      .map(f => ({
        ...f,
        analysis: analyzeSentiment(f.feedback!)
      }))

    // Extract preferences
    const taskTypes = {
      outdoor: 0,
      indoor: 0,
      family: 0,
      solo: 0,
      physical: 0,
      creative: 0
    }

    const activityTypes = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      weekend: 0
    }

    const timing = {
      quick: 0,   // < 30 min activities
      medium: 0,  // 30min - 2hr activities  
      long: 0     // > 2hr activities
    }

    analyzedFeedbacks.forEach(feedback => {
      const text = (feedback.feedback + ' ' + feedback.taskTitle + ' ' + feedback.taskDescription).toLowerCase()
      const isPositive = feedback.analysis.sentiment === 'positive'
      const weight = isPositive ? 1 : -0.5

      // Task type analysis
      if (text.includes('outdoor') || text.includes('outside') || text.includes('hike') || text.includes('park')) {
        taskTypes.outdoor += weight
      }
      if (text.includes('indoor') || text.includes('inside') || text.includes('home')) {
        taskTypes.indoor += weight
      }
      if (text.includes('family') || text.includes('kids') || text.includes('children')) {
        taskTypes.family += weight
      }
      if (text.includes('alone') || text.includes('solo') || text.includes('myself')) {
        taskTypes.solo += weight
      }
      if (text.includes('exercise') || text.includes('physical') || text.includes('run') || text.includes('sport')) {
        taskTypes.physical += weight
      }
      if (text.includes('creative') || text.includes('art') || text.includes('craft') || text.includes('write')) {
        taskTypes.creative += weight
      }

      // Activity timing analysis
      if (text.includes('morning') || text.includes('early')) {
        activityTypes.morning += weight
      }
      if (text.includes('afternoon') || text.includes('lunch')) {
        activityTypes.afternoon += weight
      }
      if (text.includes('evening') || text.includes('night')) {
        activityTypes.evening += weight
      }
      if (text.includes('weekend') || text.includes('saturday') || text.includes('sunday')) {
        activityTypes.weekend += weight
      }

      // Duration analysis (rough estimation from feedback)
      if (text.includes('quick') || text.includes('short') || text.includes('brief')) {
        timing.quick += weight
      }
      if (text.includes('long') || text.includes('extended') || text.includes('day')) {
        timing.long += weight
      } else {
        timing.medium += weight
      }
    })

    return c.json({
      success: true,
      data: {
        preferences: {
          taskTypes,
          activityTypes,
          timing
        },
        analysisBase: analyzedFeedbacks.length,
        confidence: Math.min(0.9, analyzedFeedbacks.length / 10) // Higher confidence with more data
      }
    })

  } catch (error) {
    console.error('Error getting preferences:', error)
    return c.json({ success: false, error: 'Failed to analyze user preferences' }, 500)
  }
})

// GET /api/feedback/family/:familyMemberId - Get family member specific feedback patterns
feedbackApp.get('/family/:familyMemberId', async (c) => {
  try {
    const familyMemberId = c.req.param('familyMemberId')

    // Get family member info
    const [familyMember] = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.id, familyMemberId))

    if (!familyMember) {
      return c.json({ success: false, error: 'Family member not found' }, 404)
    }

    // Get feedback from tasks that mention the family member
    const feedbacks = await db
      .select({
        feedback: taskCompletions.feedback,
        actualXp: taskCompletions.actualXp,
        taskTitle: tasks.title,
        taskDescription: tasks.description,
        completedAt: taskCompletions.completedAt
      })
      .from(taskCompletions)
      .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
      .where(and(
        eq(taskCompletions.userId, familyMember.userId),
        eq(tasks.source, 'ai')
      ))
      .orderBy(desc(taskCompletions.completedAt))

    // Filter for feedback that mentions the family member
    const relevantFeedbacks = feedbacks.filter(f => {
      if (!f.feedback) return false
      const text = (f.feedback + ' ' + f.taskTitle + ' ' + f.taskDescription).toLowerCase()
      return text.includes(familyMember.name.toLowerCase())
    })

    const analyzedFeedbacks = relevantFeedbacks.map(f => ({
      ...f,
      analysis: analyzeSentiment(f.feedback!)
    }))

    const successfulActivities = analyzedFeedbacks
      .filter(f => f.analysis.sentiment === 'positive')
      .map(f => ({
        activity: f.taskTitle,
        feedback: f.feedback,
        xpAwarded: f.actualXp
      }))

    const preferences = {
      interests: familyMember.interests,
      age: familyMember.age,
      successfulActivityTypes: successfulActivities.map(a => a.activity)
    }

    const recommendations = []
    if (successfulActivities.length > 0) {
      recommendations.push(`${familyMember.name} enjoys: ${successfulActivities.slice(0, 3).map(a => a.activity).join(', ')}`)
    }
    if (familyMember.age && familyMember.age <= 10) {
      recommendations.push('Focus on age-appropriate activities with shorter duration')
    }
    if (familyMember.interests && Array.isArray(familyMember.interests) && familyMember.interests.length > 0) {
      recommendations.push(`Incorporate ${familyMember.name}'s interests: ${familyMember.interests.join(', ')}`)
    }

    return c.json({
      success: true,
      data: {
        familyMember: {
          name: familyMember.name,
          age: familyMember.age,
          interests: familyMember.interests
        },
        patterns: analyzedFeedbacks,
        successfulActivities,
        preferences,
        recommendations
      }
    })

  } catch (error) {
    console.error('Error getting family feedback:', error)
    return c.json({ success: false, error: 'Failed to analyze family member feedback' }, 500)
  }
})

// POST /api/feedback/ai-context - Get AI context for future task generation
feedbackApp.post('/ai-context', zValidator('json', contextSchema), async (c) => {
  try {
    const { userId, contextType } = c.req.valid('json')
    const cutoffDate = getTimeframeCutoff('90days')

    const feedbacks = await db
      .select({
        feedback: taskCompletions.feedback,
        actualXp: taskCompletions.actualXp,
        taskTitle: tasks.title,
        taskDescription: tasks.description,
        targetStats: tasks.targetStats,
        estimatedXp: tasks.estimatedXp,
        completedAt: taskCompletions.completedAt
      })
      .from(taskCompletions)
      .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
      .where(and(
        eq(taskCompletions.userId, userId),
        eq(tasks.source, 'ai'),
        gte(taskCompletions.completedAt, cutoffDate)
      ))
      .orderBy(desc(taskCompletions.completedAt))

    const analyzedFeedbacks = feedbacks
      .filter(f => f.feedback && f.feedback.trim().length > 0)
      .map(f => ({
        ...f,
        analysis: analyzeSentiment(f.feedback!)
      }))

    const positiveTask = analyzedFeedbacks.filter(f => f.analysis.sentiment === 'positive')
    const negativeTask = analyzedFeedbacks.filter(f => f.analysis.sentiment === 'negative')

    // User preferences extraction
    const userPreferences = {
      timing: {
        preferred: [] as string[],
        avoid: [] as string[]
      },
      difficulty: {
        preferred: 'medium',
        evidence: [] as string[]
      },
      duration: {
        preferred: 'medium',
        evidence: [] as string[]
      }
    }

    // Learning insights
    const learningInsights = []
    
    if (positiveTask.length > 0) {
      const avgPositiveXp = positiveTask.reduce((sum, t) => sum + (t.actualXp || 0), 0) / positiveTask.length
      learningInsights.push(`User responds well to tasks with ~${Math.round(avgPositiveXp)} XP value`)
      
      const commonPositiveStats = positiveTask
        .flatMap(t => Array.isArray(t.targetStats) ? t.targetStats : [])
        .reduce((acc, stat) => {
          acc[stat as string] = (acc[stat as string] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      const topStats = Object.entries(commonPositiveStats)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 2)
        .map(([stat]) => stat)
      
      if (topStats.length > 0) {
        learningInsights.push(`Focus on ${topStats.join(' and ')} stat development`)
      }
    }

    // Patterns to avoid
    const avoidPatterns = []
    
    if (negativeTask.length > 0) {
      const avgNegativeXp = negativeTask.reduce((sum, t) => sum + (t.actualXp || 0), 0) / negativeTask.length
      const avgPositiveXp = positiveTask.reduce((sum, t) => sum + (t.actualXp || 0), 0) / (positiveTask.length || 1)
      
      if (avgNegativeXp < avgPositiveXp * 0.7) {
        avoidPatterns.push('Tasks with significantly lower XP awards indicate poor execution')
      }
      
      const negativeKeywords = negativeTask
        .flatMap(t => t.analysis.keywords)
        .reduce((acc, keyword) => {
          acc[keyword] = (acc[keyword] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      const topNegativeKeywords = Object.entries(negativeKeywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([keyword]) => keyword)
      
      if (topNegativeKeywords.length > 0) {
        avoidPatterns.push(`Avoid tasks described as: ${topNegativeKeywords.join(', ')}`)
      }
    }

    // Context-specific recommendations
    let contextRecommendations = []
    
    switch (contextType) {
      case 'task_generation':
        contextRecommendations = [
          'Generate tasks similar to high-feedback activities',
          'Maintain XP estimates within successful ranges',
          'Consider user\'s time preferences and energy levels'
        ]
        break
      case 'difficulty_adjustment':
        contextRecommendations = [
          'Monitor XP difference between estimated and actual',
          'Adjust difficulty based on completion feedback sentiment',
          'Track user progress and adapt challenge level'
        ]
        break
      case 'timing_optimization':
        contextRecommendations = [
          'Analyze time-of-day mentions in feedback',
          'Consider user\'s schedule patterns',
          'Optimize for periods with positive engagement'
        ]
        break
    }

    return c.json({
      success: true,
      data: {
        userPreferences,
        learningInsights,
        avoidPatterns,
        contextRecommendations,
        analysisBase: analyzedFeedbacks.length,
        positiveRatio: positiveTask.length / Math.max(1, analyzedFeedbacks.length),
        lastAnalyzed: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error getting AI context:', error)
    return c.json({ success: false, error: 'Failed to generate AI context' }, 500)
  }
})

// POST /api/feedback/sentiment - Analyze sentiment of feedback text
feedbackApp.post('/sentiment', zValidator('json', sentimentSchema), async (c) => {
  try {
    const { feedback } = c.req.valid('json')
    
    const analysis = analyzeSentiment(feedback)
    
    return c.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    return c.json({ success: false, error: 'Failed to analyze sentiment' }, 500)
  }
})

// GET /api/feedback/insights - Get aggregated feedback insights
feedbackApp.get('/insights', async (c) => {
  try {
    const userId = c.req.query('userId')
    
    if (!userId) {
      return c.json({ success: false, error: 'userId is required' }, 400)
    }

    const cutoffDate = getTimeframeCutoff('90days')

    const feedbacks = await db
      .select({
        feedback: taskCompletions.feedback,
        actualXp: taskCompletions.actualXp,
        estimatedXp: tasks.estimatedXp,
        taskTitle: tasks.title,
        completedAt: taskCompletions.completedAt
      })
      .from(taskCompletions)
      .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
      .where(and(
        eq(taskCompletions.userId, userId),
        eq(tasks.source, 'ai'),
        gte(taskCompletions.completedAt, cutoffDate)
      ))

    const feedbacksWithText = feedbacks.filter(f => f.feedback && f.feedback.trim().length > 0)

    if (feedbacksWithText.length === 0) {
      return c.json({
        success: true,
        data: {
          totalFeedbacks: 0,
          message: 'No feedback data available for insights analysis'
        }
      })
    }

    const analyzedFeedbacks = feedbacksWithText.map(f => ({
      ...f,
      analysis: analyzeSentiment(f.feedback!)
    }))

    const sentimentCounts = analyzedFeedbacks.reduce((acc, f) => {
      acc[f.analysis.sentiment] = (acc[f.analysis.sentiment] || 0) + 1
      return acc
    }, { positive: 0, negative: 0, neutral: 0 })

    const averageRating = (sentimentCounts.positive * 5 + sentimentCounts.neutral * 3 + sentimentCounts.negative * 1) / 
                         (sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative)

    // Common themes from positive feedback
    const positiveThemes = analyzedFeedbacks
      .filter(f => f.analysis.sentiment === 'positive')
      .flatMap(f => f.analysis.keywords)
      .reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const commonThemes = Object.entries(positiveThemes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, frequency: count }))

    // Improvement areas from negative feedback
    const negativeThemes = analyzedFeedbacks
      .filter(f => f.analysis.sentiment === 'negative')
      .flatMap(f => f.analysis.keywords)
      .reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const improvementAreas = Object.entries(negativeThemes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area, count]) => ({ area, frequency: count }))

    // Success patterns
    const successPatterns = analyzedFeedbacks
      .filter(f => f.analysis.sentiment === 'positive')
      .map(f => ({
        taskTitle: f.taskTitle,
        xpEfficiency: (f.actualXp || 0) / Math.max(1, f.estimatedXp || 1),
        feedback: f.feedback?.substring(0, 100) + (f.feedback!.length > 100 ? '...' : '')
      }))
      .sort((a, b) => b.xpEfficiency - a.xpEfficiency)
      .slice(0, 3)

    return c.json({
      success: true,
      data: {
        totalFeedbacks: feedbacksWithText.length,
        averageRating: Math.round(averageRating * 10) / 10,
        sentimentBreakdown: sentimentCounts,
        commonThemes,
        improvementAreas,
        successPatterns,
        analysisWindow: '90 days'
      }
    })

  } catch (error) {
    console.error('Error getting feedback insights:', error)
    return c.json({ success: false, error: 'Failed to get feedback insights' }, 500)
  }
})

export default feedbackApp
