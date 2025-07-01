import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks, taskCompletions, familyMembers } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

describe('Feedback System for AI Task Completions - Task 3.3', () => {
  let testUserId: string
  let testCharacterId: string
  let testStatId: string
  let testFamilyMemberId: string
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupTaskIds: string[] = []

  beforeEach(async () => {
    // Create test user
    const testUserData = await createTestUser({
      email: `test-feedback-${Date.now()}@example.com`,
      name: 'Test User',
      timezone: 'UTC'
    })
    testUserId = testUserData.user.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Test Hero',
      class: 'Ranger',
      backstory: 'An adventurous soul who loves family time'
    }).returning()
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)

    // Create test character stats
    const [stat] = await db.insert(characterStats).values({
      characterId: testCharacterId,
      category: 'Adventure Spirit',
      currentXp: 50,
      currentLevel: 1,
      totalXp: 50,
      description: 'Track outdoor adventures and exploration'
    }).returning()
    testStatId = stat.id

    // Create family time stat
    await db.insert(characterStats).values({
      characterId: testCharacterId,
      category: 'Family Time',
      currentXp: 30,
      currentLevel: 1,
      totalXp: 30,
      description: 'Track family interactions and bonding'
    })

    // Create test family member
    const [familyMember] = await db.insert(familyMembers).values({
      userId: testUserId,
      name: 'Alice',
      age: 8,
      interests: ['soccer', 'art'],
      interactionFrequency: 'daily'
    }).returning()
    testFamilyMemberId = familyMember.id
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(taskCompletions).where(eq(taskCompletions.userId, testUserId))
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId))
    }
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characterStats).where(eq(characterStats.characterId, characterId))
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    await db.delete(familyMembers).where(eq(familyMembers.userId, testUserId))
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('POST /api/feedback/analyze - Feedback Analysis', () => {
    it('should analyze feedback patterns for AI learning', async () => {
      // Create multiple AI tasks with different feedback patterns
      const aiTasks = []
      
      // Positive feedback tasks
      for (let i = 0; i < 3; i++) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: `AI Adventure Task ${i + 1}`,
          description: 'AI-generated outdoor activity',
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 50,
          status: 'completed',
          completedAt: new Date()
        }).returning()
        cleanupTaskIds.push(task.id)
        
        await db.insert(taskCompletions).values({
          taskId: task.id,
          userId: testUserId,
          feedback: i === 0 ? 'Amazing hiking experience! Loved the scenic route.' :
                   i === 1 ? 'Perfect challenge level, great weather suggestion.' :
                           'Fantastic activity, exactly what I needed today.',
          actualXp: 50,
          statAwards: { 'Adventure Spirit': 50 },
          completedAt: new Date()
        })
        
        aiTasks.push(task.id)
      }

      // Negative feedback task
      const [negativeTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'AI Family Task',
        description: 'AI-generated family activity',
        source: 'ai',
        targetStats: ['Family Time'],
        estimatedXp: 40,
        status: 'completed',
        completedAt: new Date()
      }).returning()
      cleanupTaskIds.push(negativeTask.id)
      
      await db.insert(taskCompletions).values({
        taskId: negativeTask.id,
        userId: testUserId,
        feedback: 'This activity was too advanced for my 8-year-old daughter. She got frustrated.',
        actualXp: 20, // Less XP awarded due to poor execution
        statAwards: { 'Family Time': 20 },
        completedAt: new Date()
      })

      const response = await app.request('/api/feedback/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          timeframe: '30days'
        }),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.patterns).toBeDefined()
      expect(result.data.patterns.positive).toBeDefined()
      expect(result.data.patterns.negative).toBeDefined()
      expect(result.data.patterns.positive.length).toBeGreaterThan(0)
      expect(result.data.patterns.negative.length).toBeGreaterThan(0)
      
      // Check sentiment analysis
      expect(result.data.sentimentBreakdown).toBeDefined()
      expect(result.data.sentimentBreakdown.positive).toBeGreaterThan(0)
      expect(result.data.sentimentBreakdown.negative).toBeGreaterThan(0)
      
      // Check recommendations
      expect(result.data.recommendations).toBeDefined()
      expect(Array.isArray(result.data.recommendations)).toBe(true)
    })

    it('should identify task type preferences from feedback', async () => {
      // Create different types of AI tasks with feedback
      const taskTypes = [
        { type: 'outdoor', feedback: 'Loved being outside! Fresh air was perfect.' },
        { type: 'indoor', feedback: 'Great rainy day activity, very engaging.' },
        { type: 'family', feedback: 'Kids had a blast, perfect for our family time.' },
        { type: 'solo', feedback: 'Needed some alone time, this was ideal.' }
      ]

      for (const taskType of taskTypes) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: `${taskType.type} AI Task`,
          description: `AI-generated ${taskType.type} activity`,
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 30,
          status: 'completed',
          completedAt: new Date()
        }).returning()
        cleanupTaskIds.push(task.id)
        
        await db.insert(taskCompletions).values({
          taskId: task.id,
          userId: testUserId,
          feedback: taskType.feedback,
          actualXp: 30,
          statAwards: { 'Adventure Spirit': 30 },
          completedAt: new Date()
        })
      }

      const response = await app.request('/api/feedback/preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId
        })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.preferences).toBeDefined()
      expect(result.data.preferences.taskTypes).toBeDefined()
      expect(result.data.preferences.activityTypes).toBeDefined()
      expect(result.data.preferences.timing).toBeDefined()
    })

    it('should track family member interaction feedback', async () => {
      // Create family task with specific family member feedback
      const [familyTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Play soccer with Alice',
        description: 'AI-generated family activity for daughter',
        source: 'ai',
        targetStats: ['Family Time'],
        estimatedXp: 40,
        status: 'completed',
        completedAt: new Date()
      }).returning()
      cleanupTaskIds.push(familyTask.id)
      
      await db.insert(taskCompletions).values({
        taskId: familyTask.id,
        userId: testUserId,
        feedback: 'Alice really enjoyed this! She scored 3 goals and was so excited. Perfect activity for her energy level.',
        actualXp: 45,
        statAwards: { 'Family Time': 45 },
        completedAt: new Date()
      })

      const response = await app.request(`/api/feedback/family/${testFamilyMemberId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.patterns).toBeDefined()
      expect(result.data.successfulActivities).toBeDefined()
      expect(result.data.preferences).toBeDefined()
      expect(result.data.recommendations).toBeDefined()
    })

    it('should provide AI context for future task generation', async () => {
      // Create tasks with rich feedback for AI learning
      const feedbackData = [
        {
          task: 'Morning hike',
          feedback: 'Perfect timing! I\'m most energetic in the morning. Trail difficulty was just right.',
          sentiment: 'positive'
        },
        {
          task: 'Evening walk',
          feedback: 'Too tired after work. Would prefer morning activities.',
          sentiment: 'neutral'
        },
        {
          task: 'Weekend camping',
          feedback: 'Amazing! Loved the overnight aspect. More multi-day adventures please.',
          sentiment: 'positive'
        }
      ]

      for (const item of feedbackData) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: item.task,
          description: `AI-generated: ${item.task}`,
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 50,
          status: 'completed',
          completedAt: new Date()
        }).returning()
        cleanupTaskIds.push(task.id)
        
        await db.insert(taskCompletions).values({
          taskId: task.id,
          userId: testUserId,
          feedback: item.feedback,
          actualXp: 50,
          statAwards: { 'Adventure Spirit': 50 },
          completedAt: new Date()
        })
      }

      const response = await app.request('/api/feedback/ai-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          contextType: 'task_generation'
        }),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.userPreferences).toBeDefined()
      expect(result.data.userPreferences.timing).toBeDefined()
      expect(result.data.userPreferences.difficulty).toBeDefined()
      expect(result.data.userPreferences.duration).toBeDefined()
      expect(result.data.learningInsights).toBeDefined()
      expect(result.data.avoidPatterns).toBeDefined()
    })

    it('should handle feedback sentiment analysis', async () => {
      const sentimentTests = [
        {
          feedback: 'Absolutely fantastic! Best activity ever, can\'t wait to do it again!',
          expectedSentiment: 'positive'
        },
        {
          feedback: 'This was terrible. Boring and way too difficult for my skill level.',
          expectedSentiment: 'negative'
        },
        {
          feedback: 'It was okay. Nothing special, but not bad either.',
          expectedSentiment: 'neutral'
        }
      ]

      for (const test of sentimentTests) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: 'Sentiment Test Task',
          description: 'AI task for sentiment analysis',
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 30,
          status: 'completed',
          completedAt: new Date()
        }).returning()
        cleanupTaskIds.push(task.id)
        
        await db.insert(taskCompletions).values({
          taskId: task.id,
          userId: testUserId,
          feedback: test.feedback,
          actualXp: 30,
          statAwards: { 'Adventure Spirit': 30 },
          completedAt: new Date()
        })

        const response = await app.request('/api/feedback/sentiment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback: test.feedback
          }),
        })

        expect(response.status).toBe(200)
        const result = await response.json()
        
        expect(result.success).toBe(true)
        expect(result.data.sentiment).toBe(test.expectedSentiment)
        expect(result.data.confidence).toBeGreaterThan(0)
        expect(result.data.keywords).toBeDefined()
      }
    })

    it('should validate feedback processing for different task sources', async () => {
      // Test that non-AI tasks don't trigger advanced feedback processing
      const [questTask] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'Quest Task',
        description: 'Part of a user quest',
        source: 'quest',
        targetStats: ['Adventure Spirit'],
        estimatedXp: 30,
        status: 'completed',
        completedAt: new Date()
      }).returning()
      cleanupTaskIds.push(questTask.id)
      
      await db.insert(taskCompletions).values({
        taskId: questTask.id,
        userId: testUserId,
        feedback: 'Good progress on my quest',
        actualXp: 30,
        statAwards: { 'Adventure Spirit': 30 },
        completedAt: new Date()
      })

      const response = await app.request('/api/feedback/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUserId,
          timeframe: '30days',
          sourceFilter: 'quest'
        }),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      // Quest feedback should be simpler than AI feedback
      expect(result.data.message).toContain('Non-AI tasks')
    })
  })

  describe('GET /api/feedback/insights - Feedback Insights', () => {
    it('should provide aggregated feedback insights for user', async () => {
      // Create multiple completed AI tasks with various feedback
      const taskData = [
        { feedback: 'Loved this outdoor adventure!', xp: 50 },
        { feedback: 'Too challenging for today', xp: 20 },
        { feedback: 'Perfect difficulty and timing', xp: 45 },
        { feedback: 'Would prefer indoor activities when it\'s raining', xp: 30 }
      ]

      for (const data of taskData) {
        const [task] = await db.insert(tasks).values({
          userId: testUserId,
          title: 'AI Task',
          description: 'AI-generated task',
          source: 'ai',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 40,
          status: 'completed',
          completedAt: new Date()
        }).returning()
        cleanupTaskIds.push(task.id)
        
        await db.insert(taskCompletions).values({
          taskId: task.id,
          userId: testUserId,
          feedback: data.feedback,
          actualXp: data.xp,
          statAwards: { 'Adventure Spirit': data.xp },
          completedAt: new Date()
        })
      }

      const response = await app.request(`/api/feedback/insights?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.totalFeedbacks).toBe(4)
      expect(result.data.averageRating).toBeDefined()
      expect(result.data.commonThemes).toBeDefined()
      expect(result.data.improvementAreas).toBeDefined()
      expect(result.data.successPatterns).toBeDefined()
    })

    it('should handle empty feedback gracefully', async () => {
      const response = await app.request(`/api/feedback/insights?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      expect(result.success).toBe(true)
      expect(result.data.totalFeedbacks).toBe(0)
      expect(result.data.message).toContain('No feedback data available')
    })
  })
})
