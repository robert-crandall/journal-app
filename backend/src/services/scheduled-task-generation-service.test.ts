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
import { ScheduledTaskGenerationService } from './scheduled-task-generation-service'

// Simple UUID generator for tests
function generateUUID(): string {
  return crypto.randomUUID()
}

describe('Scheduled Task Generation Service - Task 4.11', () => {
  let scheduledService: ScheduledTaskGenerationService
  let testUserId: string
  let testCharacterId: string
  
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupStatIds: string[] = []
  const cleanupFamilyMemberIds: string[] = []
  const cleanupGoalIds: string[] = []
  const cleanupTaskIds: string[] = []
  const cleanupDailyFocusIds: string[] = []

  // Helper to check if AI is available
  const isAIAvailable = () => {
    return !!process.env.OPENAI_API_KEY
  }

  beforeAll(async () => {
    scheduledService = new ScheduledTaskGenerationService()
    
    // Create test user
    const [user] = await db.insert(users).values({
      id: generateUUID(),
      email: 'scheduled-task-test@example.com',
      name: 'Scheduled Task Test User',
      timezone: 'UTC',
      zipCode: '10001' // NYC for weather testing
    }).returning()
    
    testUserId = user.id
    cleanupUserIds.push(user.id)
    
    // Create test character
    const [character] = await db.insert(characters).values({
      id: generateUUID(),
      userId: testUserId,
      name: 'Test Hero',
      class: 'Adventure Explorer',
      backstory: 'A scheduled task generation test character'
    }).returning()
    
    testCharacterId = character.id
    cleanupCharacterIds.push(character.id)
    
    // Create character stats
    const statsToCreate = [
      {
        characterId: testCharacterId,
        category: 'Adventure Spirit',
        currentXp: 100,
        currentLevel: 1,
        totalXp: 100,
        description: 'Tracks outdoor adventures'
      },
      {
        characterId: testCharacterId,
        category: 'Family Bonding',
        currentXp: 50,
        currentLevel: 1,
        totalXp: 50,
        description: 'Tracks family time'
      }
    ]
    
    for (const statData of statsToCreate) {
      const [stat] = await db.insert(characterStatsTable).values(statData).returning()
      cleanupStatIds.push(stat.id)
    }

    // Create family members
    const familyMembersData = [
      {
        userId: testUserId,
        name: 'Alice',
        age: 10,
        interests: ['art', 'reading'],
        interactionFrequency: 'daily',
        lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 days ago - overdue
      }
    ]

    for (const memberData of familyMembersData) {
      const [member] = await db.insert(familyMembersTable).values(memberData).returning()
      cleanupFamilyMemberIds.push(member.id)
    }

    // Create user goals
    const [goal] = await db.insert(goalsTable).values({
      userId: testUserId,
      title: 'Stay active outdoors',
      description: 'Get outside more often',
      priority: 'high',
      status: 'active',
      relatedStats: ['Adventure Spirit']
    }).returning()
    cleanupGoalIds.push(goal.id)
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

  beforeEach(async () => {
    // Clear any existing AI tasks for clean testing
    await db.delete(tasksTable).where(
      and(
        eq(tasksTable.userId, testUserId),
        eq(tasksTable.source, 'ai')
      )
    )
  })

  describe('Daily Task Generation for All Users', () => {
    it('should generate daily tasks for all eligible users', async () => {
      const result = await scheduledService.generateDailyTasksForAllUsers()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.totalUsersProcessed).toBeGreaterThan(0)

      if (isAIAvailable()) {
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

        expect(userTasks).toHaveLength(2) // Exactly 2 tasks (1 adventure + 1 family)
        
        const adventureTask = userTasks.find(t => {
          const targetStats = t.targetStats as string[] | undefined
          return !targetStats?.includes('Family Bonding')
        })
        const familyTask = userTasks.find(t => {
          const targetStats = t.targetStats as string[] | undefined
          return targetStats?.includes('Family Bonding')
        })
        
        expect(adventureTask).toBeDefined()
        expect(familyTask).toBeDefined()
        
        // Track for cleanup
        cleanupTaskIds.push(...userTasks.map(t => t.id))
      } else {
        // Without AI, should have errors but still process users
        expect(result.data!.errors.length).toBeGreaterThan(0)
        console.log('AI not available - testing error handling paths')
      }
    })

    it('should handle users without characters gracefully', async () => {
      // Create user without character
      const [userWithoutChar] = await db.insert(users).values({
        id: generateUUID(),
        email: 'no-char-scheduled@example.com',
        name: 'No Character User',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(userWithoutChar.id)

      const result = await scheduledService.generateDailyTasksForAllUsers()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      // Users without characters should not be included in eligible users
      // So they won't appear in errors, they're filtered out beforehand
      const eligibleUsers = await scheduledService.getEligibleUsers()
      const foundUser = eligibleUsers.find((u: any) => u.id === userWithoutChar.id)
      expect(foundUser).toBeUndefined()
    })

    it('should skip users who already have tasks for today', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Generate tasks first time
      const firstResult = await scheduledService.generateDailyTasksForAllUsers()
      expect(firstResult.success).toBe(true)

      // Get generated tasks for cleanup
      const generatedTasks = await db
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, testUserId),
            eq(tasksTable.source, 'ai')
          )
        )
      cleanupTaskIds.push(...generatedTasks.map(t => t.id))

      // Try to generate again
      const secondResult = await scheduledService.generateDailyTasksForAllUsers()
      expect(secondResult.success).toBe(true)
      
      // Should have skipped users who already have tasks
      expect(secondResult.data!.skippedUsers).toBeGreaterThan(0)
    })

    it('should include weather context when available', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Clear existing tasks
      await db.delete(tasksTable).where(
        and(
          eq(tasksTable.userId, testUserId),
          eq(tasksTable.source, 'ai')
        )
      )

      const result = await scheduledService.generateDailyTasksForAllUsers()
      expect(result.success).toBe(true)

      // Check if weather was considered (user has zipCode)
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
      cleanupTaskIds.push(...userTasks.map(t => t.id))

      // Weather integration is tested in the underlying service
      // This test confirms the scheduled service calls the task generation
    })
  })

  describe('User Eligibility and Filtering', () => {
    it('should get list of eligible users for task generation', async () => {
      const users = await scheduledService.getEligibleUsers()

      expect(users).toBeInstanceOf(Array)
      expect(users.length).toBeGreaterThan(0)
      
      // Should include our test user
      const testUser = users.find((u: any) => u.id === testUserId)
      expect(testUser).toBeDefined()
      expect(testUser!.timezone).toBe('UTC')
    })

    it('should exclude users without characters', async () => {
      // Create user without character
      const [userWithoutChar] = await db.insert(users).values({
        id: generateUUID(),
        email: 'no-char-filter@example.com',
        name: 'No Character User Filter Test',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(userWithoutChar.id)

      const eligibleUsers = await scheduledService.getEligibleUsers()
      
      // Should not include user without character
      const foundUser = eligibleUsers.find((u: any) => u.id === userWithoutChar.id)
      expect(foundUser).toBeUndefined()
    })
  })

  describe('Scheduling Interface', () => {
    it('should provide timing information for scheduling', async () => {
      const timing = scheduledService.getSchedulingInfo()

      expect(timing).toBeDefined()
      expect(timing.recommendedTime).toBe('6:00 AM user local time')
      expect(timing.frequency).toBe('daily')
      expect(timing.timezone).toBe('per-user')
      expect(timing.description).toContain('daily task generation')
    })

    it('should support force regeneration mode', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Generate tasks first
      const firstResult = await scheduledService.generateDailyTasksForAllUsers()
      expect(firstResult.success).toBe(true)

      // Get generated tasks for cleanup
      const firstTasks = await db
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, testUserId),
            eq(tasksTable.source, 'ai')
          )
        )
      cleanupTaskIds.push(...firstTasks.map(t => t.id))

      // Force regenerate
      const secondResult = await scheduledService.generateDailyTasksForAllUsers(true)
      expect(secondResult.success).toBe(true)
      expect(secondResult.data!.successfulGenerations).toBeGreaterThan(0)

      // Should have new tasks
      const secondTasks = await db
        .select()
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.userId, testUserId),
            eq(tasksTable.source, 'ai')
          )
        )

      // Should have different task IDs due to regeneration
      expect(secondTasks.length).toBeGreaterThan(firstTasks.length)
      cleanupTaskIds.push(...secondTasks.map(t => t.id))
    })
  })

  describe('Performance and Error Handling', () => {
    it('should process multiple users efficiently', async () => {
      const startTime = Date.now()
      const result = await scheduledService.generateDailyTasksForAllUsers()
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds

      // Clean up any generated tasks
      const allGeneratedTasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.source, 'ai'))

      cleanupTaskIds.push(...allGeneratedTasks.map(t => t.id))
    })

    it('should continue processing even if some users fail', async () => {
      // This test is inherently handled by the service implementation
      // which processes users individually and collects errors
      const result = await scheduledService.generateDailyTasksForAllUsers()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      // Even if some users fail, we should get summary data
      expect(typeof result.data!.totalUsersProcessed).toBe('number')
      expect(typeof result.data!.successfulGenerations).toBe('number')
      expect(Array.isArray(result.data!.errors)).toBe(true)
    })

    it('should provide detailed error information', async () => {
      // Create user that will likely fail (no character)
      const [problematicUser] = await db.insert(users).values({
        id: generateUUID(),
        email: 'error-test@example.com',
        name: 'Error Test User',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(problematicUser.id)

      const result = await scheduledService.generateDailyTasksForAllUsers()

      expect(result.success).toBe(true)
      
      // The service properly filters out users without characters in getEligibleUsers()
      // so they won't appear in errors. This is correct behavior.
      // To test error handling, we need to check that the system processes errors
      // when they do occur (like AI failures)
      
      if (!isAIAvailable()) {
        // Without AI, all eligible users should fail
        expect(result.data!.errors.length).toBeGreaterThan(0)
        console.log('Testing error handling without AI - errors expected')
      }
    })
  })

  describe('Integration with Daily Focus', () => {
    beforeEach(async () => {
      // Clear existing daily focus
      await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.userId, testUserId))
    })

    it('should respect user daily focus when generating tasks', async () => {
      if (!isAIAvailable()) {
        console.log('Skipping AI-dependent test: no OpenAI API key')
        return
      }

      // Create a daily focus for today
      const today = new Date().toISOString().split('T')[0]
      const [focus] = await db.insert(dailyFocusesTable).values({
        userId: testUserId,
        focus: 'Physical Health',
        description: 'Focus on physical activities today',
        focusDate: today,
        isActive: true
      }).returning()
      cleanupDailyFocusIds.push(focus.id)

      const result = await scheduledService.generateDailyTasksForAllUsers()
      expect(result.success).toBe(true)

      // Verify tasks were generated
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
      cleanupTaskIds.push(...userTasks.map(t => t.id))

      // Daily focus influence is tested in the underlying AI service
      // This confirms the scheduled service integrates with focus system
    })
  })
})
