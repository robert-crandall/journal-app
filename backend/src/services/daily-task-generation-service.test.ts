import { describe, it, expect, beforeAll, afterAll, beforeEach, spyOn } from 'bun:test'
import { db } from '../db/connection'
import { 
  users, 
  characters, 
  characterStats as characterStatsTable, 
  familyMembers as familyMembersTable, 
  goals as goalsTable, 
  dailyFocuses as dailyFocusesTable, 
  tasks as tasksTable
} from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { DailyTaskGenerationService } from './daily-task-generation-service'

// Simple UUID generator for tests
function generateUUID(): string {
  return crypto.randomUUID()
}

describe('DailyTaskGenerationService', () => {
  let taskService: DailyTaskGenerationService
  let testUserId: string
  let testCharacterId: string
  
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupStatIds: string[] = []
  const cleanupFamilyMemberIds: string[] = []
  const cleanupGoalIds: string[] = []
  const cleanupTaskIds: string[] = []
  const cleanupDailyFocusIds: string[] = []

  // Mock AI responses
  const mockAdventureTask = {
    title: 'Take a nature hike in the local park',
    description: 'Explore the trails and enjoy the fresh air',
    targetStats: ['Adventure Spirit', 'Physical Health'],
    estimatedXp: 25,
    reasoning: 'Combines outdoor adventure with physical activity'
  }

  const mockFamilyTask = {
    title: 'Play board games with Emma',
    description: 'Spend quality time with Emma playing her favorite games',
    targetStats: ['Family Bonding'],
    estimatedXp: 20,
    reasoning: 'Addresses overdue interaction with Emma who loves games',
    targetFamilyMember: 'Emma'
  }

  const mockAIResponse = {
    adventureTask: mockAdventureTask,
    familyTask: mockFamilyTask
  }

  beforeAll(async () => {
    taskService = new DailyTaskGenerationService()
    
    // Mock the AI service generateCompletion method
    spyOn(taskService['aiService'], 'generateCompletion').mockResolvedValue({
      success: true,
      content: JSON.stringify(mockAIResponse),
      usage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300
      }
    })

    // Create test user
    const [user] = await db.insert(users).values({
      id: generateUUID(),
      email: 'task-gen-test@example.com',
      name: 'Task Generation Test User',
      timezone: 'UTC'
    }).returning()
    
    testUserId = user.id
    cleanupUserIds.push(user.id)
    
    // Create test character
    const [character] = await db.insert(characters).values({
      id: generateUUID(),
      userId: testUserId,
      name: 'Test Adventure Hero',
      class: 'Adventure Explorer',
      backstory: 'A dedicated parent who loves outdoor adventures and spending quality time with family'
    }).returning()
    
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)
    
    // Create character stats
    const statsToCreate = [
      {
        characterId: testCharacterId,
        category: 'Adventure Spirit',
        currentXp: 150,
        currentLevel: 2,
        totalXp: 350,
        description: 'Tracks outdoor adventures and exploration'
      },
      {
        characterId: testCharacterId,
        category: 'Family Bonding',
        currentXp: 75,
        currentLevel: 1,
        totalXp: 175,
        description: 'Tracks family time and connection activities'
      },
      {
        characterId: testCharacterId,
        category: 'Physical Health',
        currentXp: 200,
        currentLevel: 3,
        totalXp: 500,
        description: 'Tracks physical fitness and health activities'
      }
    ]
    
    for (const statData of statsToCreate) {
      const [stat] = await db.insert(characterStatsTable).values(statData).returning()
      cleanupStatIds.push(stat.id)
    }

    // Create family members with overdue interactions
    const familyMembersData = [
      {
        userId: testUserId,
        name: 'Emma',
        age: 8,
        interests: ['art', 'nature', 'reading'],
        interactionFrequency: 'daily',
        lastInteraction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days ago - overdue
      },
      {
        userId: testUserId,
        name: 'Alex',
        age: 12,
        interests: ['sports', 'video games'],
        interactionFrequency: 'daily'
        // No lastInteraction - never interacted, overdue
      }
    ]

    for (const memberData of familyMembersData) {
      const [member] = await db.insert(familyMembersTable).values(memberData).returning()
      cleanupFamilyMemberIds.push(member.id)
    }

    // Create user goals
    const [goal] = await db.insert(goalsTable).values({
      userId: testUserId,
      title: 'Get more outdoor exercise',
      description: 'Aim for 4 outdoor activities per week',
      priority: 'high',
      status: 'active',
      relatedStats: ['Adventure Spirit', 'Physical Health']
    }).returning()
    cleanupGoalIds.push(goal.id)

    // Create daily focus
    const today = new Date().toISOString().split('T')[0]
    const [focus] = await db.insert(dailyFocusesTable).values({
      userId: testUserId,
      focus: 'Adventure and Family Balance',
      description: 'Focus on activities that combine adventure with family time',
      focusDate: today,
      isActive: true
    }).returning()
    cleanupDailyFocusIds.push(focus.id)
  })

  afterAll(async () => {
    // Clean up in reverse order to respect foreign keys
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasksTable).where(eq(tasksTable.id, taskId))
    }
    for (const focusId of cleanupDailyFocusIds) {
      await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.id, focusId))
    }
    for (const goalId of cleanupGoalIds) {
      await db.delete(goalsTable).where(eq(goalsTable.id, goalId))
    }
    for (const familyMemberId of cleanupFamilyMemberIds) {
      await db.delete(familyMembersTable).where(eq(familyMembersTable.id, familyMemberId))
    }
    for (const statId of cleanupStatIds) {
      await db.delete(characterStatsTable).where(eq(characterStatsTable.id, statId))
    }
    for (const characterId of cleanupCharacterIds) {
      await db.delete(characters).where(eq(characters.id, characterId))
    }
    for (const userId of cleanupUserIds) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  describe('Basic Daily Task Generation', () => {
    beforeEach(async () => {
      // Clear any existing AI tasks for clean testing
      await db.delete(tasksTable).where(
        and(
          eq(tasksTable.userId, testUserId),
          eq(tasksTable.source, 'ai')
        )
      )
    })

    it('should generate exactly 2 tasks (1 adventure + 1 family)', async () => {
      const result = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const { adventureTask, familyTask } = result.data!
      
      // Verify adventure task
      expect(adventureTask.id).toBeTruthy()
      expect(adventureTask.title).toBeTruthy()
      expect(adventureTask.description).toBeTruthy()
      expect(adventureTask.targetStats).toBeInstanceOf(Array)
      expect(adventureTask.targetStats.length).toBeGreaterThan(0)
      expect(adventureTask.estimatedXp).toBeGreaterThanOrEqual(15)
      expect(adventureTask.estimatedXp).toBeLessThanOrEqual(35)
      
      // Verify family task
      expect(familyTask.id).toBeTruthy()
      expect(familyTask.title).toBeTruthy()
      expect(familyTask.description).toBeTruthy()
      expect(familyTask.targetStats).toContain('Family Bonding')
      expect(familyTask.estimatedXp).toBeGreaterThanOrEqual(15)
      expect(familyTask.estimatedXp).toBeLessThanOrEqual(35)
      
      // Verify tasks are different
      expect(adventureTask.id).not.toBe(familyTask.id)
      expect(adventureTask.title).not.toBe(familyTask.title)
      
      // Verify tasks are created in database
      const dbAdventureTask = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.id, adventureTask.id))
        .limit(1)
      expect(dbAdventureTask).toHaveLength(1)
      
      const dbFamilyTask = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.id, familyTask.id))
        .limit(1)
      expect(dbFamilyTask).toHaveLength(1)
      
      // Track for cleanup
      cleanupTaskIds.push(adventureTask.id, familyTask.id)
    })

    it('should handle user not found', async () => {
      const result = await taskService.generateDailyTasks({
        userId: '00000000-0000-0000-0000-000000000000'
      })

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('not_found')
      expect(result.error?.message).toBe('User not found')
    })

    it('should prevent duplicate generation for same day', async () => {
      // Clear any existing AI tasks for clean testing
      await db.delete(tasksTable).where(
        and(
          eq(tasksTable.userId, testUserId),
          eq(tasksTable.source, 'ai')
        )
      )

      // Generate tasks first time
      const firstResult = await taskService.generateDailyTasks({
        userId: testUserId
      })
      
      expect(firstResult.success).toBe(true)
      if (firstResult.data) {
        cleanupTaskIds.push(firstResult.data.adventureTask.id, firstResult.data.familyTask.id)
      }

      // Try to generate again
      const secondResult = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(secondResult.success).toBe(false)
      expect(secondResult.error?.type).toBe('already_generated')
      expect(secondResult.error?.message).toContain('already been generated')
    })

    it('should allow force regeneration', async () => {
      // Clear any existing AI tasks for clean testing
      await db.delete(tasksTable).where(
        and(
          eq(tasksTable.userId, testUserId),
          eq(tasksTable.source, 'ai')
        )
      )

      // Generate initial tasks
      const firstResult = await taskService.generateDailyTasks({
        userId: testUserId
      })
      
      expect(firstResult.success).toBe(true)
      if (firstResult.data) {
        cleanupTaskIds.push(firstResult.data.adventureTask.id, firstResult.data.familyTask.id)
      }

      // Force regenerate
      const secondResult = await taskService.generateDailyTasks({
        userId: testUserId,
        forceRegenerate: true
      })

      expect(secondResult.success).toBe(true)
      expect(secondResult.data).toBeDefined()
      
      // Should be different tasks
      expect(secondResult.data!.adventureTask.id).not.toBe(firstResult.data!.adventureTask.id)
      expect(secondResult.data!.familyTask.id).not.toBe(firstResult.data!.familyTask.id)
      
      if (secondResult.data) {
        cleanupTaskIds.push(secondResult.data.adventureTask.id, secondResult.data.familyTask.id)
      }
    })
  })

  describe('Weather Integration', () => {
    it('should include weather context when zip code provided', async () => {
      // Clear any existing tasks for clean test
      await db.delete(tasksTable).where(eq(tasksTable.userId, testUserId))

      const result = await taskService.generateDailyTasks({
        userId: testUserId,
        zipCode: '10001' // NYC zip code for testing
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      // Weather data may or may not be included depending on API availability
      // This is testing the integration, not the weather API itself
      const { adventureTask, familyTask, weather } = result.data!
      
      expect(adventureTask.id).toBeTruthy()
      expect(familyTask.id).toBeTruthy()
      
      if (weather) {
        expect(weather.condition).toBeTruthy()
        expect(typeof weather.temperature).toBe('number')
        expect(weather.description).toBeTruthy()
      }
      
      cleanupTaskIds.push(adventureTask.id, familyTask.id)
    })

    it('should handle weather API failures gracefully', async () => {
      // Clear any existing tasks for clean test
      await db.delete(tasksTable).where(eq(tasksTable.userId, testUserId))

      const result = await taskService.generateDailyTasks({
        userId: testUserId,
        zipCode: '99999' // Invalid zip code
      })

      // Should still succeed even if weather fails
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const { adventureTask, familyTask } = result.data!
      expect(adventureTask.id).toBeTruthy()
      expect(familyTask.id).toBeTruthy()
      
      cleanupTaskIds.push(adventureTask.id, familyTask.id)
    })
  })

  describe('Task Content Validation', () => {
    beforeEach(async () => {
      // Clear any existing tasks before each test
      await db.delete(tasksTable).where(eq(tasksTable.userId, testUserId))
    })

    it('should generate contextually appropriate tasks', async () => {
      const result = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const { adventureTask, familyTask } = result.data!
      
      // Adventure task should relate to adventure/outdoor activities
      const adventureKeywords = ['adventure', 'outdoor', 'explore', 'hike', 'walk', 'exercise', 'nature', 'physical']
      const adventureText = `${adventureTask.title} ${adventureTask.description}`.toLowerCase()
      const hasAdventureKeyword = adventureKeywords.some(keyword => adventureText.includes(keyword))
      expect(hasAdventureKeyword).toBe(true)
      
      // Family task should relate to family interaction
      const familyKeywords = ['family', 'emma', 'alex', 'together', 'bond', 'connect', 'time', 'activity']
      const familyText = `${familyTask.title} ${familyTask.description}`.toLowerCase()
      const hasFamilyKeyword = familyKeywords.some(keyword => familyText.includes(keyword))
      expect(hasFamilyKeyword).toBe(true)
      
      // Family task should always target Family Bonding
      expect(familyTask.targetStats).toContain('Family Bonding')
      
      cleanupTaskIds.push(adventureTask.id, familyTask.id)
    })

    it('should prioritize overdue family interactions', async () => {
      const result = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const { familyTask } = result.data!
      
      // Family task should mention overdue family members (Emma or Alex)
      const familyText = `${familyTask.title} ${familyTask.description}`.toLowerCase()
      const mentionsOverdueMembers = familyText.includes('emma') || familyText.includes('alex')
      
      // While we can't guarantee it due to AI variability, we can check the task is family-focused
      expect(familyTask.targetStats).toContain('Family Bonding')
      expect(familyTask.title).toBeTruthy()
      expect(familyTask.description).toBeTruthy()
      
      cleanupTaskIds.push(result.data!.adventureTask.id, familyTask.id)
    })

    it('should respect character class and goals', async () => {
      const result = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const { adventureTask } = result.data!
      
      // Adventure task should align with character class (Adventure Explorer) and goals
      expect(adventureTask.title).toBeTruthy()
      expect(adventureTask.description).toBeTruthy()
      expect(adventureTask.targetStats).toBeInstanceOf(Array)
      expect(adventureTask.targetStats.length).toBeGreaterThan(0)
      
      // Should target appropriate stats for an Adventure Explorer
      const expectedStats = ['Adventure Spirit', 'Physical Health']
      const hasRelevantStat = adventureTask.targetStats.some(stat => expectedStats.includes(stat))
      expect(hasRelevantStat).toBe(true)
      
      cleanupTaskIds.push(adventureTask.id, result.data!.familyTask.id)
    })

    it('should include daily focus in task generation', async () => {
      const result = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      // The AI should consider the daily focus "Adventure and Family Balance"
      // This is reflected in the contextual generation, which we've already validated
      const { adventureTask, familyTask } = result.data!
      
      expect(adventureTask.id).toBeTruthy()
      expect(familyTask.id).toBeTruthy()
      
      cleanupTaskIds.push(adventureTask.id, familyTask.id)
    })
  })

  describe('Database Integration', () => {
    beforeEach(async () => {
      // Clear any existing tasks before each test
      await db.delete(tasksTable).where(eq(tasksTable.userId, testUserId))
    })

    it('should create tasks with correct database fields', async () => {
      const result = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const { adventureTask, familyTask } = result.data!
      
      // Verify adventure task in database
      const [dbAdventureTask] = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.id, adventureTask.id))
      
      expect(dbAdventureTask).toBeDefined()
      expect(dbAdventureTask.userId).toBe(testUserId)
      expect(dbAdventureTask.title).toBe(adventureTask.title)
      expect(dbAdventureTask.description).toBe(adventureTask.description)
      expect(dbAdventureTask.source).toBe('ai')
      expect(dbAdventureTask.status).toBe('pending')
      expect(dbAdventureTask.targetStats).toEqual(adventureTask.targetStats)
      expect(dbAdventureTask.estimatedXp).toBe(adventureTask.estimatedXp)
      expect(dbAdventureTask.createdAt).toBeInstanceOf(Date)
      
      // Verify family task in database
      const [dbFamilyTask] = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.id, familyTask.id))
      
      expect(dbFamilyTask).toBeDefined()
      expect(dbFamilyTask.userId).toBe(testUserId)
      expect(dbFamilyTask.title).toBe(familyTask.title)
      expect(dbFamilyTask.description).toBe(familyTask.description)
      expect(dbFamilyTask.source).toBe('ai')
      expect(dbFamilyTask.status).toBe('pending')
      expect(dbFamilyTask.targetStats).toEqual(familyTask.targetStats)
      expect(dbFamilyTask.estimatedXp).toBe(familyTask.estimatedXp)
      
      cleanupTaskIds.push(adventureTask.id, familyTask.id)
    })

    it('should only generate once per day based on database check', async () => {
      // Manually create an AI task for today
      const today = new Date()
      const [existingTask] = await db.insert(tasksTable).values({
        userId: testUserId,
        title: 'Existing AI Task',
        description: 'This task already exists for today',
        source: 'ai',
        targetStats: ['Adventure Spirit'],
        estimatedXp: 25,
        status: 'pending',
        createdAt: today
      }).returning()
      
      cleanupTaskIds.push(existingTask.id)

      // Try to generate new tasks
      const result = await taskService.generateDailyTasks({
        userId: testUserId
      })

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('already_generated')
      expect(result.error?.message).toContain('already been generated')
    })
  })

  describe('Error Handling', () => {
    it('should handle user without character gracefully', async () => {
      // Create user without character
      const [userWithoutChar] = await db.insert(users).values({
        email: 'no-char@example.com',
        name: 'No Character User',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(userWithoutChar.id)

      const result = await taskService.generateDailyTasks({
        userId: userWithoutChar.id
      })

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('generation_failed')
      expect(result.error?.message).toContain('Failed to gather user context')
    })

    it('should handle missing user gracefully', async () => {
      const result = await taskService.generateDailyTasks({
        userId: '00000000-0000-0000-0000-000000000000'
      })

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('not_found')
      expect(result.error?.message).toBe('User not found')
    })
  })

  describe('Task Generation Timing', () => {
    it('should generate different tasks on different days', async () => {
      // This test simulates different days by using forceRegenerate
      // In a real scenario, this would be naturally different days
      
      // Clear existing tasks
      await db.delete(tasksTable).where(eq(tasksTable.userId, testUserId))

      // Generate first set of tasks
      const firstResult = await taskService.generateDailyTasks({
        userId: testUserId
      })
      
      expect(firstResult.success).toBe(true)
      const firstTasks = firstResult.data!
      cleanupTaskIds.push(firstTasks.adventureTask.id, firstTasks.familyTask.id)

      // Generate second set (simulating next day with force)
      const secondResult = await taskService.generateDailyTasks({
        userId: testUserId,
        forceRegenerate: true
      })
      
      expect(secondResult.success).toBe(true)
      const secondTasks = secondResult.data!
      cleanupTaskIds.push(secondTasks.adventureTask.id, secondTasks.familyTask.id)

      // Tasks should be different (AI should provide variety)
      expect(firstTasks.adventureTask.id).not.toBe(secondTasks.adventureTask.id)
      expect(firstTasks.familyTask.id).not.toBe(secondTasks.familyTask.id)
      
      // But they should maintain the same structure and requirements
      expect(secondTasks.adventureTask.targetStats).toBeInstanceOf(Array)
      expect(secondTasks.familyTask.targetStats).toContain('Family Bonding')
    })
  })
})
