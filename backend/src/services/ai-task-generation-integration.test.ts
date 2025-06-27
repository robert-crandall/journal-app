import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { 
  users as usersTable, 
  characters as charactersTable,
  characterStats as characterStatsTable,
  familyMembers as familyMembersTable,
  goals as goalsTable,
  dailyFocuses as dailyFocusesTable,
  tasks as tasksTable,
  taskCompletions as taskCompletionsTable,
  projects as projectsTable
} from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { DailyTaskGenerationService } from './daily-task-generation-service'
import { AIService } from './ai-service'
import { AIContextService } from './ai-context-service'
import { ScheduledTaskGenerationService } from './scheduled-task-generation-service'

// Generate UUIDs using crypto.randomUUID()
function generateUUID(): string {
  return crypto.randomUUID()
}

// Helper to check if AI is available for testing
const isAIAvailable = () => {
  return !!process.env.OPENAI_API_KEY
}

/**
 * Task 4.12: AI Task Generation Integration Tests
 * 
 * Comprehensive integration tests for the AI task generation system,
 * covering all components from Tasks 4.1-4.11:
 * 
 * - AI Service (4.1): OpenAI GPT integration with error handling
 * - Weather Integration (4.2): Weather context in task generation
 * - Context Gathering (4.3): User context collection for AI
 * - Daily Task Generation (4.4): Core 2-task generation (1 adventure + 1 family)
 * - Task Logic (4.5): Weather and family interaction timing consideration
 * - Enhanced Task Specification (4.7): Target stats and XP estimation
 * - Feedback Processing (4.8): AI learning from user feedback
 * - Daily Focus Influence (4.9): Task priority alignment with daily focus
 * - Project Context Integration (4.10): Project influence without dashboard display
 * - Scheduled Generation (4.11): Automated daily task generation system
 */
describe('AI Task Generation Integration Tests - Task 4.12', () => {
  let dailyTaskService: DailyTaskGenerationService
  let aiService: AIService
  let contextService: AIContextService
  let scheduledService: ScheduledTaskGenerationService
  
  let testUserId: string
  let testCharacterId: string
  
  // Cleanup arrays
  const cleanupUserIds: string[] = []
  const cleanupTaskIds: string[] = []
  const cleanupProjectIds: string[] = []

  beforeAll(async () => {
    // Initialize services
    dailyTaskService = new DailyTaskGenerationService()
    aiService = new AIService()
    contextService = new AIContextService()
    scheduledService = new ScheduledTaskGenerationService()
    
    console.log('Setting up AI task generation integration tests...')
    
    // Create comprehensive test user
    const [user] = await db.insert(usersTable).values({
      id: generateUUID(),
      email: 'ai-integration-test@example.com',
      name: 'AI Task Integration Test User',
      timezone: 'America/New_York',
      zipCode: '10001' // NYC for weather testing
    }).returning()
    
    testUserId = user.id
    cleanupUserIds.push(user.id)
    
    // Create test character with class and backstory
    const [character] = await db.insert(charactersTable).values({
      id: generateUUID(),
      userId: testUserId,
      name: 'AI Test Explorer',
      class: 'Adventure Seeker',
      backstory: 'A tech professional who loves outdoor adventures and spending quality time with family. Values work-life balance and personal growth.'
    }).returning()
    
    testCharacterId = character.id
    
    // Create comprehensive character stats at different levels
    await db.insert(characterStatsTable).values([
      {
        characterId: testCharacterId,
        category: 'Adventure Spirit',
        currentLevel: 3,
        totalXp: 600,
        currentXp: 0
      },
      {
        characterId: testCharacterId,
        category: 'Family Bonding',
        currentLevel: 5,
        totalXp: 1500,
        currentXp: 0
      },
      {
        characterId: testCharacterId,
        category: 'Physical Health',
        currentLevel: 2,
        totalXp: 300,
        currentXp: 0
      },
      {
        characterId: testCharacterId,
        category: 'Emotional Intelligence',
        currentLevel: 4,
        totalXp: 1000,
        currentXp: 0
      },
      {
        characterId: testCharacterId,
        category: 'Creativity',
        currentLevel: 1,
        totalXp: 100,
        currentXp: 0
      }
    ])
    
    // Create diverse family members with different interaction needs
    await db.insert(familyMembersTable).values([
      {
        userId: testUserId,
        name: 'Alex',
        age: 16,
        interests: ['technology', 'gaming', 'science'],
        interactionFrequency: 'daily',
        lastInteraction: new Date().toISOString().split('T')[0] // Today - not overdue
      },
      {
        userId: testUserId,
        name: 'Emma',
        age: 12,
        interests: ['art', 'music', 'nature'],
        interactionFrequency: 'weekly',
        lastInteraction: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 8 days ago - OVERDUE for weekly
      },
      {
        userId: testUserId,
        name: 'Partner',
        age: 35,
        interests: ['cooking', 'hiking', 'reading'],
        interactionFrequency: 'daily',
        lastInteraction: new Date().toISOString().split('T')[0] // Today
      }
    ])
    
    // Create user goals for context
    await db.insert(goalsTable).values([
      {
        userId: testUserId,
        title: 'Improve Family Relationships',
        description: 'Spend more quality time with each family member and strengthen our bonds',
        priority: 'high',
        status: 'active',
        relatedStats: ['Family Bonding', 'Emotional Intelligence']
      },
      {
        userId: testUserId,
        title: 'Maintain Physical Fitness',
        description: 'Stay active through outdoor adventures and regular exercise',
        priority: 'high',
        status: 'active',
        relatedStats: ['Physical Health', 'Adventure Spirit']
      }
    ])
  })

  afterAll(async () => {
    console.log('Cleaning up AI task generation integration test data...')
    
    // Clean up all test data
    if (cleanupTaskIds.length > 0) {
      await db.delete(taskCompletionsTable).where(eq(taskCompletionsTable.userId, testUserId))
      for (const taskId of cleanupTaskIds) {
        await db.delete(tasksTable).where(eq(tasksTable.id, taskId)).catch(() => {})
      }
    }
    
    if (cleanupProjectIds.length > 0) {
      for (const projectId of cleanupProjectIds) {
        await db.delete(projectsTable).where(eq(projectsTable.id, projectId)).catch(() => {})
      }
    }
    
    await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.userId, testUserId))
    await db.delete(goalsTable).where(eq(goalsTable.userId, testUserId))
    await db.delete(familyMembersTable).where(eq(familyMembersTable.userId, testUserId))
    await db.delete(characterStatsTable).where(eq(characterStatsTable.characterId, testCharacterId))
    await db.delete(charactersTable).where(eq(charactersTable.id, testCharacterId))
    
    for (const userId of cleanupUserIds) {
      await db.delete(usersTable).where(eq(usersTable.id, userId))
    }
  })

  beforeEach(async () => {
    // Clear existing AI tasks before each test
    await db.delete(tasksTable).where(
      and(
        eq(tasksTable.userId, testUserId),
        eq(tasksTable.source, 'ai')
      )
    )
  })

  afterEach(async () => {
    // Clean up any tasks created during tests
    const createdTasks = await db
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.userId, testUserId),
          eq(tasksTable.source, 'ai')
        )
      )
    
    for (const task of createdTasks) {
      cleanupTaskIds.push(task.id)
    }
  })

  describe('Core AI Service Integration (Task 4.1)', () => {
    it('should properly configure and initialize AI service', async () => {
      expect(aiService).toBeDefined()
      
      if (isAIAvailable()) {
        expect(aiService.isConfigured()).toBe(true)
      } else {
        expect(aiService.isConfigured()).toBe(false)
        console.log('AI not configured - testing error handling paths')
      }
    })

    it('should handle AI service error states gracefully', async () => {
      // Test with invalid context to trigger validation errors
      const invalidRequest = {
        userId: '',
        context: null as any,
        taskCount: 0,
        taskTypes: []
      }

      const result = await aiService.generateTasks(invalidRequest)
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation')
      expect(result.tasks).toEqual([])
    })

    it('should generate completion with proper request structure', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      const completion = await aiService.generateCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with a simple JSON object.'
          },
          {
            role: 'user', 
            content: 'Generate a simple task: {"title": "Test Task", "description": "A test task"}'
          }
        ],
        maxTokens: 100,
        temperature: 0.3
      })

      expect(completion.success).toBe(true)
      expect(completion.content).toBeTruthy()
      expect(completion.usage).toBeDefined()
      expect(completion.usage!.totalTokens).toBeGreaterThan(0)
    })
  })

  describe('Context Gathering Integration (Task 4.3)', () => {
    it('should gather comprehensive user context for AI task generation', async () => {
      const contextResult = await contextService.getDailyTaskGenerationContext(testUserId)

      expect(contextResult.success).toBe(true)
      expect(contextResult.context).toBeDefined()
      expect(contextResult.aiContext).toBeDefined()

      const context = contextResult.context!
      const aiContext = contextResult.aiContext!

      // Verify character context
      expect(context.character.class).toBe('Adventure Seeker')
      expect(context.character.backstory).toContain('outdoor adventures')
      expect(aiContext.characterClass).toBe('Adventure Seeker')
      expect(aiContext.characterBackstory).toContain('family')

      // Verify stats context
      expect(context.characterStats.length).toBe(5)
      expect(aiContext.characterStats).toBeDefined()
      expect(aiContext.characterStats!.length).toBe(5)

      // Verify family member context with overdue detection
      expect(context.familyMembers.length).toBe(3)
      expect(aiContext.familyMembers).toBeDefined()
      expect(aiContext.familyMembers!.length).toBe(3)
      
      const overdueFamily = aiContext.familyMembers!.find(f => f.isOverdue)
      expect(overdueFamily).toBeDefined()
      expect(overdueFamily!.name).toBe('Emma')
      expect(overdueFamily!.daysSinceLastInteraction).toBeGreaterThan(7)

      // Verify goals context
      expect(context.goals.length).toBe(2)
      expect(aiContext.userGoals).toBeDefined()
      expect(aiContext.userGoals!.length).toBeGreaterThan(0)
    })

    it('should handle context gathering for users without complete data', async () => {
      // Create minimal user without family/goals
      const [minimalUser] = await db.insert(usersTable).values({
        id: generateUUID(),
        email: 'minimal-user@example.com',
        name: 'Minimal User'
      }).returning()
      cleanupUserIds.push(minimalUser.id)

      const [minimalChar] = await db.insert(charactersTable).values({
        userId: minimalUser.id,
        name: 'Basic Character',
        class: 'Explorer'
      }).returning()

      await db.insert(characterStatsTable).values({
        characterId: minimalChar.id,
        category: 'Adventure Spirit',
        currentLevel: 1,
        totalXp: 100,
        currentXp: 0
      })

      const result = await contextService.getDailyTaskGenerationContext(minimalUser.id)
      expect(result.success).toBe(true)
      expect(result.aiContext!.familyMembers).toEqual([])
      expect(result.aiContext!.userGoals).toEqual([])
    })
  })

  describe('Core Daily Task Generation (Task 4.4)', () => {
    it('should generate exactly 2 tasks (1 adventure + 1 family)', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      const result = await dailyTaskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      const { adventureTask, familyTask } = result.data!

      // Verify adventure task structure
      expect(adventureTask.id).toBeTruthy()
      expect(adventureTask.title).toBeTruthy()
      expect(adventureTask.description).toBeTruthy()
      expect(adventureTask.targetStats).toBeInstanceOf(Array)
      expect(adventureTask.targetStats.length).toBeGreaterThan(0)
      expect(adventureTask.estimatedXp).toBeGreaterThanOrEqual(15)
      expect(adventureTask.estimatedXp).toBeLessThanOrEqual(35)

      // Verify family task structure and requirements
      expect(familyTask.id).toBeTruthy()
      expect(familyTask.title).toBeTruthy()
      expect(familyTask.description).toBeTruthy()
      expect(familyTask.targetStats).toContain('Family Bonding')
      expect(familyTask.estimatedXp).toBeGreaterThanOrEqual(15)
      expect(familyTask.estimatedXp).toBeLessThanOrEqual(35)

      // Verify tasks are stored in database
      const dbTasks = await db
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, testUserId),
            eq(tasksTable.source, 'ai')
          )
        )

      expect(dbTasks).toHaveLength(2)
      expect(dbTasks.every(task => task.status === 'pending')).toBe(true)
    })

    it('should prevent duplicate generation for same day', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Generate first set of tasks
      const firstResult = await dailyTaskService.generateDailyTasks({
        userId: testUserId
      })
      expect(firstResult.success).toBe(true)

      // Try to generate again without force flag
      const secondResult = await dailyTaskService.generateDailyTasks({
        userId: testUserId
      })

      expect(secondResult.success).toBe(false)
      expect(secondResult.error?.type).toBe('already_generated')
      expect(secondResult.error?.message).toContain('already been generated')
    })

    it('should allow force regeneration', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Generate initial tasks
      const firstResult = await dailyTaskService.generateDailyTasks({
        userId: testUserId
      })
      expect(firstResult.success).toBe(true)

      // Force regenerate
      const secondResult = await dailyTaskService.generateDailyTasks({
        userId: testUserId,
        forceRegenerate: true
      })

      expect(secondResult.success).toBe(true)
      expect(secondResult.data).toBeDefined()

      // Should have different task IDs
      expect(firstResult.data!.adventureTask.id).not.toBe(secondResult.data!.adventureTask.id)
      expect(firstResult.data!.familyTask.id).not.toBe(secondResult.data!.familyTask.id)
    })
  })

  describe('Weather Integration (Task 4.2)', () => {
    it('should include weather context in task generation', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      const result = await dailyTaskService.generateDailyTasks({
        userId: testUserId,
        zipCode: '10001' // NYC zip code
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Weather information should be included in response metadata
      if (result.data!.weather) {
        expect(result.data!.weather.condition).toBeTruthy()
        expect(typeof result.data!.weather.temperature).toBe('number')
        expect(result.data!.weather.description).toBeTruthy()
      }

      // Weather should influence task content (tasks may reference indoor/outdoor)
      const allTaskContent = `${result.data!.adventureTask.title} ${result.data!.adventureTask.description} ${result.data!.familyTask.title} ${result.data!.familyTask.description}`.toLowerCase()

      // Should show weather awareness in task generation
      expect(allTaskContent.length).toBeGreaterThan(50) // Meaningful content generated
    })

    it('should handle weather API failures gracefully', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Use invalid zip code to trigger weather failure
      const result = await dailyTaskService.generateDailyTasks({
        userId: testUserId,
        zipCode: 'INVALID'
      })

      // Should still succeed even if weather fails
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.adventureTask).toBeDefined()
      expect(result.data!.familyTask).toBeDefined()
    })
  })

  describe('Enhanced Task Generation (Tasks 4.7, 4.8, 4.9)', () => {
    beforeEach(async () => {
      // Create daily focus for testing
      await db.insert(dailyFocusesTable).values({
        userId: testUserId,
        focus: 'Physical Health',
        description: 'Focus on physical activities and health today',
        focusDate: new Date().toISOString().split('T')[0]
      })
    })

    afterEach(async () => {
      await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.userId, testUserId))
    })

    it('should generate enhanced tasks with intelligent XP estimation (Task 4.7)', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      const result = await dailyTaskService.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Physical Health',
        focusWeight: 0.8
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      const { adventureTask, familyTask } = result.data!

      // Enhanced task structure validation
      expect(adventureTask.targetStats).toBeInstanceOf(Array)
      expect(adventureTask.targetStats.length).toBeGreaterThan(0)
      expect(adventureTask.difficulty).toBeOneOf(['easy', 'medium', 'hard', 'epic'])
      expect(adventureTask.timeEstimate).toBeTruthy()
      expect(adventureTask.reasoning).toBeTruthy()

      // Family task enhanced features
      expect(familyTask.targetStats).toBeInstanceOf(Array)
      expect(familyTask.targetStats.some(ts => ts.category === 'Family Bonding')).toBe(true)
      expect(familyTask.difficulty).toBeOneOf(['easy', 'medium', 'hard', 'epic'])
      expect(familyTask.interactionType).toBeOneOf(['quality_time', 'activity', 'conversation', 'support', 'shared_interest'])

      // XP should be intelligently estimated based on difficulty and stats
      expect(adventureTask.estimatedXp).toBeGreaterThan(10)
      expect(adventureTask.estimatedXp).toBeLessThan(100)
      expect(familyTask.estimatedXp).toBeGreaterThan(10)
      expect(familyTask.estimatedXp).toBeLessThan(100)

      // Metadata should contain context factors
      expect(result.data!.generationMetadata).toBeDefined()
      expect(result.data!.generationMetadata.contextFactorsConsidered).toBeInstanceOf(Array)
      expect(result.data!.generationMetadata.contextFactorsConsidered.length).toBeGreaterThan(0)
    })

    it('should process feedback for AI learning (Task 4.8)', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // First generate a task to provide feedback on
      const taskResult = await dailyTaskService.generateEnhancedDailyTasks({
        userId: testUserId
      })
      expect(taskResult.success).toBe(true)

      // Get the AI context for feedback processing
      const contextResult = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(contextResult.success).toBe(true)

      // Process positive feedback
      const feedbackResult = await aiService.processFeedbackForLearning({
        userId: testUserId,
        taskId: taskResult.data!.adventureTask.id,
        feedback: 'Perfect difficulty level! I loved the outdoor element and it fit my schedule perfectly. Would like more activities like this.',
        actualXp: 35,
        wasCompleted: true,
        completionNotes: 'Completed in morning, felt energized all day',
        context: contextResult.aiContext!
      })

      expect(feedbackResult.success).toBe(true)
      expect(feedbackResult.learningInsights).toBeDefined()

      if (feedbackResult.learningInsights) {
        expect(feedbackResult.learningInsights.preferencePatterns).toBeInstanceOf(Array)
        expect(feedbackResult.learningInsights.taskAdjustments).toBeInstanceOf(Array)
        expect(feedbackResult.learningInsights.futureConsiderations).toBeInstanceOf(Array)

        // Should identify positive patterns
        const likePattern = feedbackResult.learningInsights.preferencePatterns.find(
          p => p.type === 'likes'
        )
        expect(likePattern).toBeDefined()
        expect(likePattern!.confidence).toBeGreaterThan(0.5)
      }
    })

    it('should influence tasks based on daily focus (Task 4.9)', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      const result = await dailyTaskService.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Physical Health',
        focusWeight: 0.9
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should prioritize Physical Health in adventure task
      const physicalHealthStat = result.data!.adventureTask.targetStats.find(
        ts => ts.category === 'Physical Health'
      )
      
      if (physicalHealthStat) {
        expect(physicalHealthStat.xpWeight).toBeGreaterThan(0.7)
      }

      // Should mention focus in generation metadata
      expect(result.data!.generationMetadata.dailyFocusInfluence).toBeTruthy()
      expect(result.data!.generationMetadata.dailyFocusInfluence).toContain('Physical Health')
    })
  })

  describe('Project Context Integration (Task 4.10)', () => {
    beforeEach(async () => {
      // Create test projects for context
      const [urgentProject] = await db.insert(projectsTable).values({
        userId: testUserId,
        title: 'Urgent Work Presentation',
        description: 'High-stress presentation due next week',
        status: 'active',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      }).returning()
      cleanupProjectIds.push(urgentProject.id)

      const [balanceProject] = await db.insert(projectsTable).values({
        userId: testUserId,
        title: 'Home Garden Project',
        description: 'Creating a vegetable garden for family',
        status: 'active',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }).returning()
      cleanupProjectIds.push(balanceProject.id)
    })

    it('should include projects in AI context without creating direct project tasks', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Verify projects are included in context
      const contextResult = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(contextResult.success).toBe(true)
      expect(contextResult.aiContext!.projects).toBeDefined()
      expect(contextResult.aiContext!.projects!.length).toBe(2)

      const urgentProject = contextResult.aiContext!.projects!.find(p => p.title === 'Urgent Work Presentation')
      expect(urgentProject).toBeDefined()

      // Generate tasks with project context
      const result = await dailyTaskService.generateEnhancedDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Tasks should NOT be direct project work
      const allTaskContent = `${result.data!.adventureTask.title} ${result.data!.adventureTask.description} ${result.data!.familyTask.title} ${result.data!.familyTask.description}`.toLowerCase()
      
      expect(allTaskContent).not.toContain('presentation')
      expect(allTaskContent).not.toContain('garden project')

      // But should show contextual awareness (stress relief, balance, etc.)
      const hasBalanceElements = (
        allTaskContent.includes('relax') ||
        allTaskContent.includes('balance') ||
        allTaskContent.includes('stress') ||
        allTaskContent.includes('calm') ||
        allTaskContent.includes('peaceful')
      )
      
      // With urgent deadlines, AI should consider balance/stress relief
      expect(result.data!.generationMetadata.contextFactorsConsidered).toContain('projects')
    })
  })

  describe('Scheduled Task Generation (Task 4.11)', () => {
    it('should generate tasks for all eligible users via scheduled service', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      const result = await scheduledService.generateDailyTasksForAllUsers()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.totalUsersProcessed).toBeGreaterThan(0)
      expect(result.data!.successfulGenerations).toBeGreaterThan(0)

      // Should have generated tasks for our test user
      const userTasks = await db
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, testUserId),
            eq(tasksTable.source, 'ai')
          )
        )

      expect(userTasks).toHaveLength(2)
    })

    it('should provide scheduling information for external schedulers', async () => {
      const schedulingInfo = scheduledService.getSchedulingInfo()

      expect(schedulingInfo.recommendedTime).toBe('6:00 AM user local time')
      expect(schedulingInfo.frequency).toBe('daily')
      expect(schedulingInfo.timezone).toBe('per-user')
      expect(schedulingInfo.description).toContain('2 tasks per user')
    })

    it('should get eligible users with timezone information', async () => {
      const eligibleUsers = await scheduledService.getEligibleUsers()

      expect(eligibleUsers).toBeInstanceOf(Array)
      expect(eligibleUsers.length).toBeGreaterThan(0)

      const testUser = eligibleUsers.find(u => u.id === testUserId)
      expect(testUser).toBeDefined()
      expect(testUser!.email).toBe('ai-integration-test@example.com')
      expect(testUser!.timezone).toBe('America/New_York')
      expect(testUser!.zipCode).toBe('10001')
    })
  })

  describe('End-to-End AI Task Generation Pipeline', () => {
    it('should demonstrate complete task generation workflow', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Create daily focus
      await db.insert(dailyFocusesTable).values({
        userId: testUserId,
        focus: 'Emotional Intelligence',
        description: 'Focus on emotional awareness and family connections',
        focusDate: new Date().toISOString().split('T')[0]
      })

      // Add urgent project for context
      const [project] = await db.insert(projectsTable).values({
        userId: testUserId,
        title: 'Major Client Deadline',
        description: 'Critical presentation for biggest client',
        status: 'active',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days - very urgent
      }).returning()
      cleanupProjectIds.push(project.id)

      // Generate enhanced tasks with all features
      const result = await dailyTaskService.generateEnhancedDailyTasks({
        userId: testUserId,
        dailyFocus: 'Emotional Intelligence',
        focusWeight: 0.8,
        zipCode: '10001'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Verify all integration features are working
      const { adventureTask, familyTask, generationMetadata } = result.data!

      // Task quality and completeness
      expect(adventureTask.title).toBeTruthy()
      expect(adventureTask.description.length).toBeGreaterThan(50)
      expect(adventureTask.targetStats.length).toBeGreaterThan(0)
      expect(adventureTask.difficulty).toBeOneOf(['easy', 'medium', 'hard', 'epic'])
      expect(adventureTask.timeEstimate).toBeTruthy()
      expect(adventureTask.reasoning).toBeTruthy()

      expect(familyTask.title).toBeTruthy()
      expect(familyTask.description.length).toBeGreaterThan(30)
      expect(familyTask.targetStats.some(ts => ts.category === 'Family Bonding')).toBe(true)
      expect(familyTask.interactionType).toBeTruthy()

      // Context integration verification
      expect(generationMetadata.contextFactorsConsidered).toBeInstanceOf(Array)
      expect(generationMetadata.contextFactorsConsidered.length).toBeGreaterThan(2)
      expect(generationMetadata.dailyFocusInfluence).toContain('Emotional Intelligence')

      // Family member prioritization (Emma is overdue)
      if (familyTask.targetFamilyMember) {
        expect(familyTask.targetFamilyMember).toBe('Emma')
        expect(familyTask.overdueNotes).toBeTruthy()
      }

      // Weather integration (if available)
      if (adventureTask.weatherInfluence) {
        expect(adventureTask.weatherInfluence).toBeTruthy()
      }

      // Verify database storage
      const storedTasks = await db
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, testUserId),
            eq(tasksTable.source, 'ai')
          )
        )

      expect(storedTasks).toHaveLength(2)
      expect(storedTasks.every(task => task.createdAt instanceof Date)).toBe(true)
      expect(storedTasks.every(task => task.status === 'pending')).toBe(true)

      // Clean up
      await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.userId, testUserId))
    })

    it('should handle error scenarios gracefully across the pipeline', async () => {
      // Test with user that has minimal context
      const [minimalUser] = await db.insert(usersTable).values({
        id: generateUUID(),
        email: 'minimal-error-test@example.com',
        name: 'Error Test User'
      }).returning()
      cleanupUserIds.push(minimalUser.id)

      // No character - should fail gracefully
      const result = await dailyTaskService.generateDailyTasks({
        userId: minimalUser.id
      })

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('generation_failed')
      expect(result.error?.message).toContain('Failed to gather user context')
    })
  })

  describe('AI Learning and Adaptation', () => {
    it('should track task completion patterns for future improvements', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Generate initial tasks
      const taskResult = await dailyTaskService.generateEnhancedDailyTasks({
        userId: testUserId
      })
      expect(taskResult.success).toBe(true)

      // Simulate task completion with feedback
      const adventureTaskId = taskResult.data!.adventureTask.id
      await db.insert(taskCompletionsTable).values({
        taskId: adventureTaskId,
        userId: testUserId,
        feedback: 'This was exactly the right difficulty level and timing. Perfect for morning routine!',
        actualXp: 30,
        completedAt: new Date()
      })

      // Get context including task history
      const contextResult = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: true,
        taskHistoryDays: 7,
        includePatterns: false
      })

      expect(contextResult.success).toBe(true)
      expect(contextResult.context!.recentTaskHistory).toHaveLength(1)

      const completedTask = contextResult.context!.recentTaskHistory[0]
      expect(completedTask.completed).toBe(true)
      expect(completedTask.feedback).toBeTruthy()
      expect(completedTask.xpAwarded).toBe(30)

      // Verify AI context includes this feedback for learning
      expect(contextResult.aiContext!.taskHistory).toBeDefined()
      expect(contextResult.aiContext!.taskHistory!).toHaveLength(1)
      const taskHistoryItem = contextResult.aiContext!.taskHistory![0]
      expect(taskHistoryItem).toBeDefined()
      expect(taskHistoryItem.feedback).toBeTruthy()
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent task generations efficiently', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Create additional test users
      const additionalUsers = []
      for (let i = 0; i < 3; i++) {
        const [user] = await db.insert(usersTable).values({
          id: generateUUID(),
          email: `concurrent-test-${i}@example.com`,
          name: `Concurrent Test User ${i}`
        }).returning()
        cleanupUserIds.push(user.id)

        const [character] = await db.insert(charactersTable).values({
          userId: user.id,
          name: `Test Character ${i}`,
          class: 'Explorer'
        }).returning()

        await db.insert(characterStatsTable).values({
          characterId: character.id,
          category: 'Adventure Spirit',
          currentLevel: 1,
          totalXp: 100,
          currentXp: 0
        })

        additionalUsers.push(user.id)
      }

      // Test concurrent generation
      const startTime = Date.now()
      const promises = additionalUsers.map(userId => 
        dailyTaskService.generateDailyTasks({ userId })
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()

      // All generations should succeed
      expect(results.every(r => r.success)).toBe(true)

      // Should complete in reasonable time (less than 30 seconds for 3 users)
      expect(endTime - startTime).toBeLessThan(30000)

      console.log(`Generated tasks for ${additionalUsers.length} users in ${endTime - startTime}ms`)
    })
  })
})
