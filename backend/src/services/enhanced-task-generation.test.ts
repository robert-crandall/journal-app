import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { 
  users as usersTable, 
  characters as charactersTable,
  characterStats as characterStatsTable,
  familyMembers as familyMembersTable,
  goals as goalsTable,
  dailyFocuses as dailyFocusesTable,
  tasks as tasksTable,
  taskCompletions as taskCompletionsTable
} from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { DailyTaskGenerationService } from './daily-task-generation-service'
import { AIService } from './ai-service'
import { createTestUser } from '../utils/test-helpers'

// Mock the AI service to avoid real API calls
const mockAIService = {
  isConfigured: () => true,
  generateCompletion: async (request: any) => ({
    success: true,
    content: JSON.stringify({
      adventureTask: {
        title: 'Legacy Adventure Task',
        description: 'A simple adventure task for backward compatibility testing',
        targetStats: ['Adventure Spirit'],
        estimatedXp: 25,
        reasoning: 'Legacy format adventure task'
      },
      familyTask: {
        title: 'Legacy Family Task',
        description: 'A simple family interaction for backward compatibility testing',
        targetStats: ['Social Connection'],
        estimatedXp: 20,
        reasoning: 'Legacy format family task'
      }
    })
  }),
  generateFocusInfluencedTasks: async (request: any) => ({
    success: true,
    data: {
      adventureTask: {
        title: 'Morning Mindfulness Hike',
        description: 'Take a 30-minute mindful walk in a natural setting, focusing on present moment awareness',
        targetStats: [
          { category: 'Physical Health', xpWeight: 0.7, reasoning: 'Walking exercise benefits physical fitness' },
          { category: 'Emotional Intelligence', xpWeight: 0.9, reasoning: 'Mindfulness practice enhances emotional awareness' }
        ],
        estimatedXp: 28,
        difficulty: 'medium' as const,
        timeEstimate: '30-45 minutes',
        prerequisites: ['Find a nearby park or natural area'],
        reasoning: 'Combines physical activity with mindfulness practice, aligned with emotional intelligence focus',
        weatherInfluence: 'Pleasant weather makes outdoor mindfulness practice more enjoyable',
        goalAlignment: 'Directly supports daily focus on emotional intelligence through mindfulness'
      },
      familyTask: {
        title: 'Heart-to-Heart Chat with Sarah',
        description: 'Have a meaningful conversation with Sarah about her current interests and how she\'s feeling',
        targetStats: [
          { category: 'Social Connection', xpWeight: 1.0, reasoning: 'Deep family conversations strengthen social bonds' },
          { category: 'Emotional Intelligence', xpWeight: 0.8, reasoning: 'Active listening and empathy practice' }
        ],
        estimatedXp: 25,
        difficulty: 'easy' as const,
        timeEstimate: '20-30 minutes',
        reasoning: 'Quality time with daughter who hasn\'t been prioritized recently',
        targetFamilyMember: 'Sarah',
        interactionType: 'conversation' as const,
        overdueNotes: 'Sarah hasn\'t had focused attention in 8 days - high priority for reconnection'
      },
      generationMetadata: {
        contextFactorsConsidered: [
          'Daily focus on emotional intelligence',
          'Overdue family interaction with Sarah',
          'Pleasant weather for outdoor activities',
          'User\'s Wizard class preference for wisdom-based activities'
        ],
        alternativesConsidered: [
          'Indoor meditation session',
          'Reading emotional intelligence book',
          'Family game night'
        ],
        adaptationsFromHistory: [
          'User previously enjoyed mindfulness activities',
          'Short conversation tasks more successful than long activities'
        ]
      }
    }
  }),
  processFeedbackForLearning: async (request: any) => ({
    success: true,
    learningInsights: {
      preferencePatterns: [
        {
          type: 'likes' as const,
          pattern: 'Enjoys mindfulness and outdoor activities',
          confidence: 0.8
        },
        {
          type: 'time_preference' as const,
          pattern: 'Prefers 20-30 minute tasks over longer commitments',
          confidence: 0.7
        }
      ],
      taskAdjustments: [
        {
          aspect: 'duration' as const,
          recommendation: 'Keep tasks under 45 minutes for better completion rates',
          reasoning: 'User feedback indicates time constraints are a major factor'
        }
      ],
      futureConsiderations: [
        'Focus on quick wins and manageable time commitments',
        'Combine multiple stat benefits in single activities'
      ]
    }
  })
}

describe('Enhanced Task Generation - Tasks 4.7, 4.8, 4.9', () => {
  let service: DailyTaskGenerationService
  let testUserId: string
  let testCharacterId: string
  let cleanupTaskIds: string[] = []

  beforeEach(async () => {
    // Create test service with mocked AI service
    service = new DailyTaskGenerationService()
    // Replace the AI service with our mock
    ;(service as any).aiService = mockAIService

    // Create test user
    const testUserData = await createTestUser({
      email: `test-enhanced-${Date.now()}@example.com`,
      name: 'Enhanced Test User'
    })
    const user = testUserData.user
    testUserId = user.id

    // Create test character
    const [character] = await db.insert(charactersTable).values({
      userId: testUserId,
      name: 'Test Wizard',
      class: 'Wizard',
      backstory: 'A wise wizard focused on emotional intelligence and family connections'
    }).returning()
    testCharacterId = character.id

    // Create character stats
    await db.insert(characterStatsTable).values([
      {
        characterId: testCharacterId,
        category: 'Physical Health',
        currentLevel: 3,
        totalXp: 600,
        currentXp: 0
      },
      {
        characterId: testCharacterId,
        category: 'Emotional Intelligence',
        currentLevel: 5,
        totalXp: 1500,
        currentXp: 0
      },
      {
        characterId: testCharacterId,
        category: 'Social Connection',
        currentLevel: 2,
        totalXp: 300,
        currentXp: 0
      }
    ])

    // Create family member
    await db.insert(familyMembersTable).values({
      userId: testUserId,
      name: 'Sarah',
      age: 16,
      interests: ['music', 'art', 'books'],
      interactionFrequency: 'daily',
      lastInteraction: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 8 days ago
    })

    // Create daily focus
    await db.insert(dailyFocusesTable).values({
      userId: testUserId,
      focus: 'Emotional Intelligence',
      description: 'Focus on mindfulness and emotional awareness today',
      focusDate: new Date().toISOString().split('T')[0]
    })

    // Create user goal
    await db.insert(goalsTable).values({
      userId: testUserId,
      title: 'Improve Family Relationships',
      description: 'Spend more quality time with family members',
      priority: 'high',
      status: 'active',
      relatedStats: ['Social Connection', 'Emotional Intelligence']
    })
  })

  afterEach(async () => {
    // Clean up created tasks
    if (cleanupTaskIds.length > 0) {
      await db.delete(tasksTable).where(
        and(
          eq(tasksTable.userId, testUserId)
        )
      )
    }

    // Clean up test data
    await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.userId, testUserId))
    await db.delete(goalsTable).where(eq(goalsTable.userId, testUserId))
    await db.delete(familyMembersTable).where(eq(familyMembersTable.userId, testUserId))
    await db.delete(characterStatsTable).where(eq(characterStatsTable.characterId, testCharacterId))
    await db.delete(charactersTable).where(eq(charactersTable.id, testCharacterId))
    await db.delete(usersTable).where(eq(usersTable.id, testUserId))
  })

  describe('Task 4.7: AI Task Specification with Target Stats and Estimated XP', () => {
    it('should generate enhanced tasks with intelligent XP estimation', async () => {
      const result = await service.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Emotional Intelligence',
        focusWeight: 0.8
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // Adventure task validation
        expect(result.data.adventureTask.title).toBe('Morning Mindfulness Hike')
        expect(result.data.adventureTask.targetStats).toHaveLength(2)
        expect(result.data.adventureTask.targetStats[0]).toMatchObject({
          category: 'Physical Health',
          xpWeight: 0.7,
          reasoning: expect.any(String)
        })
        expect(result.data.adventureTask.estimatedXp).toBe(28)
        expect(result.data.adventureTask.difficulty).toBe('medium')
        expect(result.data.adventureTask.timeEstimate).toBe('30-45 minutes')
        expect(result.data.adventureTask.prerequisites).toContain('Find a nearby park or natural area')

        // Family task validation
        expect(result.data.familyTask.title).toBe('Heart-to-Heart Chat with Sarah')
        expect(result.data.familyTask.targetFamilyMember).toBe('Sarah')
        expect(result.data.familyTask.interactionType).toBe('conversation')
        expect(result.data.familyTask.overdueNotes).toContain('8 days')
        expect(result.data.familyTask.estimatedXp).toBe(25)

        // Metadata validation
        expect(result.data.generationMetadata.contextFactorsConsidered).toContain('Daily focus on emotional intelligence')
        expect(result.data.generationMetadata.dailyFocusInfluence).toContain('Emotional Intelligence')
      }
    })

    it('should adjust XP based on character stat levels', async () => {
      const result = await service.generateEnhancedDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // Higher level stats should have appropriate XP scaling
        const emotionalIntelligenceTargets = result.data.adventureTask.targetStats.filter(
          ts => ts.category === 'Emotional Intelligence'
        )
        
        if (emotionalIntelligenceTargets.length > 0) {
          expect(emotionalIntelligenceTargets[0].xpWeight).toBeGreaterThan(0.5)
        }

        // Verify XP estimation is reasonable for difficulty level
        expect(result.data.adventureTask.estimatedXp).toBeGreaterThan(15)
        expect(result.data.adventureTask.estimatedXp).toBeLessThan(100)
      }
    })

    it('should provide detailed task specifications', async () => {
      const result = await service.generateEnhancedDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // Adventure task should have comprehensive details
        expect(result.data.adventureTask.reasoning).toBeTruthy()
        expect(result.data.adventureTask.weatherInfluence).toBeTruthy()
        expect(result.data.adventureTask.goalAlignment).toBeTruthy()

        // Family task should have interaction details
        expect(result.data.familyTask.interactionType).toBeOneOf([
          'quality_time', 'activity', 'conversation', 'support', 'shared_interest'
        ])
        expect(result.data.familyTask.reasoning).toBeTruthy()
      }
    })
  })

  describe('Task 4.8: Feedback Processing for AI Learning', () => {
    it('should process positive feedback for learning insights', async () => {
      // First create a task to provide feedback on
      const taskResult = await service.generateEnhancedDailyTasks({
        userId: testUserId
      })
      
      expect(taskResult.success).toBe(true)
      expect(taskResult.data).toBeDefined()

      if (taskResult.data) {
        const taskId = taskResult.data.adventureTask.id
        cleanupTaskIds.push(taskId, taskResult.data.familyTask.id)

        // Process positive feedback
        const feedbackResult = await service.processFeedbackForLearning({
          userId: testUserId,
          taskId: taskId,
          feedback: 'Loved this mindfulness hike! Perfect length and very relaxing. Would like more outdoor activities.',
          actualXp: 35,
          wasCompleted: true,
          completionNotes: 'Completed in a local park, felt very peaceful'
        })

        expect(feedbackResult.success).toBe(true)
        expect(feedbackResult.learningInsights).toBeDefined()

        if (feedbackResult.learningInsights) {
          // Should identify preferences
          expect(feedbackResult.learningInsights.preferencePatterns).toBeDefined()
          expect(feedbackResult.learningInsights.preferencePatterns.length).toBeGreaterThan(0)
          
          const likePattern = feedbackResult.learningInsights.preferencePatterns.find(
            (p: any) => p.type === 'likes'
          )
          expect(likePattern).toBeDefined()
          expect(likePattern!.confidence).toBeGreaterThan(0.5)

          // Should provide task adjustments
          expect(feedbackResult.learningInsights.taskAdjustments).toBeDefined()
          expect(feedbackResult.learningInsights.taskAdjustments.length).toBeGreaterThan(0)

          // Should have future considerations
          expect(feedbackResult.learningInsights.futureConsiderations).toBeDefined()
          expect(feedbackResult.learningInsights.futureConsiderations.length).toBeGreaterThan(0)
        }
      }
    })

    it('should process negative feedback for improvements', async () => {
      const taskResult = await service.generateEnhancedDailyTasks({
        userId: testUserId
      })
      
      expect(taskResult.success).toBe(true)
      expect(taskResult.data).toBeDefined()

      if (taskResult.data) {
        const taskId = taskResult.data.familyTask.id
        cleanupTaskIds.push(taskResult.data.adventureTask.id, taskId)

        // Process negative feedback
        const feedbackResult = await service.processFeedbackForLearning({
          userId: testUserId,
          taskId: taskId,
          feedback: 'Too long - I only had 15 minutes and this required 30. Felt rushed and stressed.',
          wasCompleted: false,
          completionNotes: 'Abandoned due to time constraints'
        })

        expect(feedbackResult.success).toBe(true)
        expect(feedbackResult.learningInsights).toBeDefined()

        if (feedbackResult.learningInsights) {
          // Should identify time preference issues
          const timePattern = feedbackResult.learningInsights.preferencePatterns.find(
            (p: any) => p.type === 'time_preference'
          )
          expect(timePattern).toBeDefined()

          // Should recommend duration adjustments
          const durationAdjustment = feedbackResult.learningInsights.taskAdjustments.find(
            (a: any) => a.aspect === 'duration'
          )
          expect(durationAdjustment).toBeDefined()
          expect(durationAdjustment!.reasoning).toContain('time')
        }
      }
    })

    it('should handle incomplete tasks and extract learning patterns', async () => {
      const taskResult = await service.generateEnhancedDailyTasks({
        userId: testUserId
      })
      
      expect(taskResult.success).toBe(true)
      expect(taskResult.data).toBeDefined()

      if (taskResult.data) {
        const taskId = taskResult.data.adventureTask.id
        cleanupTaskIds.push(taskId, taskResult.data.familyTask.id)

        // Process feedback for incomplete task
        const feedbackResult = await service.processFeedbackForLearning({
          userId: testUserId,
          taskId: taskId,
          feedback: 'Started but got distracted. Need simpler tasks or better reminders.',
          wasCompleted: false
        })

        expect(feedbackResult.success).toBe(true)
        expect(feedbackResult.learningInsights).toBeDefined()

        if (feedbackResult.learningInsights) {
          expect(feedbackResult.learningInsights.preferencePatterns.length).toBeGreaterThan(0)
          expect(feedbackResult.learningInsights.futureConsiderations.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('Task 4.9: Daily Focus Influence System', () => {
    it('should prioritize tasks aligned with daily focus', async () => {
      const result = await service.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Emotional Intelligence',
        focusWeight: 0.9
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // Should include daily focus in generation metadata
        expect(result.data.generationMetadata.dailyFocusInfluence).toContain('Emotional Intelligence')
        expect(result.data.generationMetadata.dailyFocusInfluence).toContain('0.9')

        // Adventure task should align with emotional intelligence
        const emotionalIntelligenceTarget = result.data.adventureTask.targetStats.find(
          ts => ts.category === 'Emotional Intelligence'
        )
        expect(emotionalIntelligenceTarget).toBeDefined()
        expect(emotionalIntelligenceTarget!.xpWeight).toBeGreaterThan(0.7)

        // Should mention focus in reasoning or goal alignment
        const mentionsFocus = result.data.adventureTask.reasoning.toLowerCase().includes('emotional') ||
                            result.data.adventureTask.goalAlignment?.toLowerCase().includes('emotional')
        expect(mentionsFocus).toBe(true)
      }
    })

    it('should adjust focus weight appropriately', async () => {
      // Test with low focus weight
      const lowFocusResult = await service.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Physical Health',
        focusWeight: 0.3
      })

      expect(lowFocusResult.success).toBe(true)
      
      if (lowFocusResult.data) {
        cleanupTaskIds.push(lowFocusResult.data.adventureTask.id, lowFocusResult.data.familyTask.id)
        
        // Should still consider focus but with lower weight
        expect(lowFocusResult.data.generationMetadata.dailyFocusInfluence).toContain('0.3')
      }
    })

    it('should work without daily focus (default behavior)', async () => {
      const result = await service.generateEnhancedDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // Should not have daily focus influence when none provided
        expect(result.data.generationMetadata.dailyFocusInfluence).toBeUndefined()

        // Should still generate valid tasks
        expect(result.data.adventureTask.title).toBeTruthy()
        expect(result.data.familyTask.title).toBeTruthy()
      }
    })

    it('should integrate weather context with daily focus', async () => {
      const result = await service.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Physical Health',
        zipCode: '10001', // Mock will provide weather
        focusWeight: 0.8
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // Should consider both focus and weather
        expect(result.data.generationMetadata.dailyFocusInfluence).toContain('Physical Health')
        expect(result.data.adventureTask.weatherInfluence).toBeTruthy()

        // Should show integration in context factors
        expect(result.data.generationMetadata.contextFactorsConsidered).toContain('Daily focus on emotional intelligence')
      }
    })
  })

  describe('Integration Tests: All Features Together', () => {
    it('should generate enhanced tasks with full feature integration', async () => {
      const result = await service.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Emotional Intelligence',
        focusWeight: 0.8,
        zipCode: '10001'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // All enhanced features should be present
        expect(result.data.adventureTask.targetStats.length).toBeGreaterThan(0)
        expect(result.data.adventureTask.difficulty).toBeOneOf(['easy', 'medium', 'hard', 'epic'])
        expect(result.data.adventureTask.timeEstimate).toBeTruthy()
        expect(result.data.adventureTask.reasoning).toBeTruthy()
        expect(result.data.adventureTask.weatherInfluence).toBeTruthy()

        expect(result.data.familyTask.interactionType).toBeTruthy()
        expect(result.data.familyTask.targetFamilyMember).toBe('Sarah')
        expect(result.data.familyTask.overdueNotes).toBeTruthy()

        expect(result.data.generationMetadata.contextFactorsConsidered.length).toBeGreaterThan(0)
        expect(result.data.generationMetadata.dailyFocusInfluence).toBeTruthy()
      }
    })

    it('should maintain backward compatibility with legacy interface', async () => {
      // Test that the old generateDailyTasks method still works
      const result = await service.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        cleanupTaskIds.push(result.data.adventureTask.id, result.data.familyTask.id)

        // Legacy format should work
        expect(result.data.adventureTask.title).toBeTruthy()
        expect(result.data.adventureTask.targetStats).toBeInstanceOf(Array)
        expect(typeof result.data.adventureTask.estimatedXp).toBe('number')
        
        expect(result.data.familyTask.title).toBeTruthy()
        expect(result.data.familyTask.targetStats).toBeInstanceOf(Array)
        expect(typeof result.data.familyTask.estimatedXp).toBe('number')
      }
    })
  })
})
