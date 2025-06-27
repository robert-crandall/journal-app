import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { db } from '../db/connection'
import { 
  users, 
  characters, 
  characterStats as characterStatsTable, 
  familyMembers as familyMembersTable, 
  goals as goalsTable, 
  projects as projectsTable, 
  dailyFocuses as dailyFocusesTable, 
  tasks as tasksTable,
  taskCompletions as taskCompletionsTable
} from '../db/schema'
import { eq } from 'drizzle-orm'
import { AIContextService } from './ai-context-service'
// Simple UUID generator for tests
function generateUUID(): string {
  return crypto.randomUUID()
}

describe('AIContextService', () => {
  let contextService: AIContextService
  let testUserId: string
  let testCharacterId: string
  
  const cleanupUserIds: string[] = []
  const cleanupCharacterIds: string[] = []
  const cleanupStatIds: string[] = []
  const cleanupFamilyMemberIds: string[] = []
  const cleanupGoalIds: string[] = []
  const cleanupProjectIds: string[] = []
  const cleanupTaskIds: string[] = []
  const cleanupDailyFocusIds: string[] = []

  beforeAll(async () => {
    contextService = new AIContextService()
    
    // Create test user
    const [user] = await db.insert(users).values({
      id: generateUUID(),
      email: 'context-test@example.com',
      name: 'Context Test User',
      timezone: 'UTC'
    }).returning()
    
    testUserId = user.id
    cleanupUserIds.push(user.id)
    
    // Create test character
    const [character] = await db.insert(characters).values({
      id: generateUUID(),
      userId: testUserId,
      name: 'Test Adventure Seeker',
      class: 'Life Explorer',
      backstory: 'A curious individual seeking balance between adventure and family life'
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
  })

  afterAll(async () => {
    // Clean up in reverse order to respect foreign keys
    for (const focusId of cleanupDailyFocusIds) {
      await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.id, focusId))
    }
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasksTable).where(eq(tasksTable.id, taskId))
    }
    for (const projectId of cleanupProjectIds) {
      await db.delete(projectsTable).where(eq(projectsTable.id, projectId))
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

  describe('Basic Context Gathering', () => {
    it('should gather basic user context successfully', async () => {
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context).toBeDefined()
      
      const context = result.context!
      
      // Verify character data
      expect(context.character.id).toBe(testCharacterId)
      expect(context.character.name).toBe('Test Adventure Seeker')
      expect(context.character.class).toBe('Life Explorer')
      expect(context.character.backstory).toBe('A curious individual seeking balance between adventure and family life')
      
      // Verify character stats
      expect(context.characterStats).toHaveLength(3)
      const adventureStats = context.characterStats.find(s => s.category === 'Adventure Spirit')
      expect(adventureStats).toBeDefined()
      expect(adventureStats!.currentLevel).toBe(2)
      expect(adventureStats!.totalXp).toBe(350)
      
      // Verify AI context conversion
      expect(result.aiContext).toBeDefined()
      expect(result.aiContext!.characterClass).toBe('Life Explorer')
      expect(result.aiContext!.characterBackstory).toBe('A curious individual seeking balance between adventure and family life')
    })

    it('should handle user not found', async () => {
      const result = await contextService.gatherUserContext({
        userId: '00000000-0000-0000-0000-000000000000'
      })

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('not_found')
      expect(result.error?.message).toBe('User not found')
    })

    it('should handle character not found', async () => {
      // Create user without character
      const [userWithoutChar] = await db.insert(users).values({
        email: 'no-char@example.com',
        name: 'No Character User',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(userWithoutChar.id)

      const result = await contextService.gatherUserContext({
        userId: userWithoutChar.id
      })

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('not_found')
      expect(result.error?.message).toBe('No active character found for user')
    })
  })

  describe('Family Member Context', () => {
    beforeEach(async () => {
      // Clean up any existing family members for this user
      await db.delete(familyMembersTable).where(eq(familyMembersTable.userId, testUserId))
      
      // Create test family members
      const familyMembersData = [
        {
          userId: testUserId,
          name: 'Emma',
          age: 8,
          interests: ['art', 'nature', 'reading'],
          interactionFrequency: 'daily',
          lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 days ago
        },
        {
          userId: testUserId,
          name: 'Sarah',
          age: 35,
          interests: ['cooking', 'gardening', 'music'],
          interactionFrequency: 'weekly',
          lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 days ago
        },
        {
          userId: testUserId,
          name: 'Tom',
          age: 12,
          interests: ['sports', 'games'],
          interactionFrequency: 'daily'
          // No lastInteraction - never interacted
        }
      ]

      for (const memberData of familyMembersData) {
        const [member] = await db.insert(familyMembersTable).values(memberData).returning()
        cleanupFamilyMemberIds.push(member.id)
      }
    })

    it('should gather family member context with interaction timing', async () => {
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context!.familyMembers).toHaveLength(3)
      
      const emma = result.context!.familyMembers.find(m => m.name === 'Emma')
      expect(emma).toBeDefined()
      expect(emma!.age).toBe(8)
      expect(emma!.interests).toEqual(['art', 'nature', 'reading'])
      expect(emma!.interactionFrequency).toBe('daily')
      expect(emma!.daysSinceLastInteraction).toBe(2)
      expect(emma!.isOverdue).toBe(true) // Daily interaction, 2 days overdue
      
      const sarah = result.context!.familyMembers.find(m => m.name === 'Sarah')
      expect(sarah).toBeDefined()
      expect(sarah!.isOverdue).toBe(true) // Weekly interaction, 10 days overdue
      
      const tom = result.context!.familyMembers.find(m => m.name === 'Tom')
      expect(tom).toBeDefined()
      expect(tom!.daysSinceLastInteraction).toBeUndefined()
      expect(tom!.isOverdue).toBe(true) // Never interacted
      
      // Verify AI context conversion
      expect(result.aiContext!.familyMembers).toHaveLength(3)
      const aiEmma = result.aiContext!.familyMembers.find(m => m.name === 'Emma')
      expect(aiEmma).toBeDefined()
      expect(aiEmma!.age).toBe(8)
      expect(aiEmma!.interests).toEqual(['art', 'nature', 'reading'])
    })

    it('should get family interaction priorities', async () => {
      const result = await contextService.getFamilyInteractionPriorities(testUserId)
      
      expect(result.success).toBe(true)
      expect(result.priorities).toBeDefined()
      expect(result.totalOverdue).toBe(3) // All 3 family members from current test are overdue
      
      // Find our test family members in the priorities
      const tomPriority = result.priorities!.find(p => p.name === 'Tom')
      const sarahPriority = result.priorities!.find(p => p.name === 'Sarah')
      const emmaPriority = result.priorities!.find(p => p.name === 'Emma')
      
      expect(tomPriority).toBeDefined()
      expect(sarahPriority).toBeDefined()
      expect(emmaPriority).toBeDefined()
    })
  })

  describe('Goals and Projects Context', () => {
    beforeEach(async () => {
      // Create test goals
      const goalsData = [
        {
          userId: testUserId,
          title: 'Get more outdoor exercise',
          description: 'Aim for 4 outdoor activities per week',
          priority: 'high',
          status: 'active',
          relatedStats: ['Adventure Spirit', 'Physical Health']
        },
        {
          userId: testUserId,
          title: 'Improve family connections',
          description: 'Spend quality time with each family member',
          priority: 'high',
          status: 'active',
          relatedStats: ['Family Bonding']
        },
        {
          userId: testUserId,
          title: 'Learn new skills',
          description: 'Complete online courses',
          priority: 'medium',
          status: 'active'
        }
      ]

      for (const goalData of goalsData) {
        const [goal] = await db.insert(goalsTable).values(goalData).returning()
        cleanupGoalIds.push(goal.id)
      }

      // Create test projects
      const projectsData = [
        {
          userId: testUserId,
          title: 'Build backyard deck',
          description: 'Create outdoor family space',
          status: 'active',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        {
          userId: testUserId,
          title: 'Plan family vacation',
          description: 'Research and book summer trip',
          status: 'active'
        }
      ]

      for (const projectData of projectsData) {
        const [project] = await db.insert(projectsTable).values(projectData).returning()
        cleanupProjectIds.push(project.id)
      }
    })

    it('should gather goals and projects context', async () => {
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      
      // Verify goals
      expect(result.context!.goals).toHaveLength(3)
      const outdoorGoal = result.context!.goals.find(g => g.title === 'Get more outdoor exercise')
      expect(outdoorGoal).toBeDefined()
      expect(outdoorGoal!.priority).toBe('high')
      expect(outdoorGoal!.relatedStats).toEqual(['Adventure Spirit', 'Physical Health'])
      
      // Verify projects
      expect(result.context!.projects).toHaveLength(2)
      const deckProject = result.context!.projects.find(p => p.title === 'Build backyard deck')
      expect(deckProject).toBeDefined()
      expect(deckProject!.dueDate).toBeDefined()
      
      // Verify AI context conversion - goals order may vary
      const expectedGoals = ['Get more outdoor exercise', 'Improve family connections', 'Learn new skills']
      expect(result.aiContext!.userGoals).toHaveLength(3)
      expectedGoals.forEach(goal => {
        expect(result.aiContext!.userGoals).toContain(goal)
      })
    })
  })

  describe('Daily Focus Context', () => {
    beforeEach(async () => {
      // Clean up any existing daily focuses for this user
      await db.delete(dailyFocusesTable).where(eq(dailyFocusesTable.userId, testUserId))
    })

    it('should gather daily focus when present', async () => {
      const today = new Date().toISOString().split('T')[0]
      
      // Create today's daily focus
      const [focus] = await db.insert(dailyFocusesTable).values({
        userId: testUserId,
        focus: 'Adventure and Exploration',
        description: 'Focus on outdoor activities and trying new experiences',
        focusDate: today,
        isActive: true
      }).returning()
      cleanupDailyFocusIds.push(focus.id)

      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context!.dailyFocus).toBeDefined()
      expect(result.context!.dailyFocus!.focus).toBe('Adventure and Exploration')
      expect(result.context!.dailyFocus!.description).toBe('Focus on outdoor activities and trying new experiences')
      expect(result.context!.dailyFocus!.focusDate).toBe(today)
    })

    it('should handle no daily focus for today', async () => {
      // Ensure no daily focus exists for today by not creating one
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context!.dailyFocus).toBeUndefined()
    })
  })

  describe('Task History Context', () => {
    beforeEach(async () => {
      // Create test tasks with completions
      const tasksData = [
        {
          userId: testUserId,
          title: 'Take a nature hike',
          description: 'Explore local trail',
          source: 'ai',
          status: 'completed',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          estimatedXp: 30
        },
        {
          userId: testUserId,
          title: 'Play board games with family',
          description: 'Quality family time activity',
          source: 'ai', 
          status: 'completed',
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          estimatedXp: 25
        },
        {
          userId: testUserId,
          title: 'Read adventure novel',
          description: 'Personal growth reading',
          source: 'quest',
          status: 'pending'
        }
      ]

      for (const taskData of tasksData) {
        const [task] = await db.insert(tasksTable).values(taskData).returning()
        cleanupTaskIds.push(task.id)

        // Create completion for completed tasks
        if (taskData.status === 'completed') {
          await db.insert(taskCompletionsTable).values({
            taskId: task.id,
            userId: testUserId,
            feedback: taskData.title.includes('hike') ? 'Enjoyed the fresh air and exercise' : 'Kids loved the game night',
            actualXp: taskData.estimatedXp || 0,
            completedAt: taskData.completedAt!
          })
        }
      }
    })

    it('should gather task history with feedback', async () => {
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: true,
        taskHistoryDays: 7,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context!.recentTaskHistory).toHaveLength(3)
      
      const hikeTask = result.context!.recentTaskHistory.find(t => t.title === 'Take a nature hike')
      expect(hikeTask).toBeDefined()
      expect(hikeTask!.completed).toBe(true)
      expect(hikeTask!.feedback).toBe('Enjoyed the fresh air and exercise')
      expect(hikeTask!.xpAwarded).toBe(30)
      
      const boardGameTask = result.context!.recentTaskHistory.find(t => t.title === 'Play board games with family')
      expect(boardGameTask).toBeDefined()
      expect(boardGameTask!.completed).toBe(true)
      expect(boardGameTask!.feedback).toBe('Kids loved the game night')
      
      const readingTask = result.context!.recentTaskHistory.find(t => t.title === 'Read adventure novel')
      expect(readingTask).toBeDefined()
      expect(readingTask!.completed).toBe(false)
      expect(readingTask!.feedback).toBeUndefined()
      
      // Verify AI context conversion
      expect(result.aiContext!.taskHistory).toHaveLength(3)
      const aiHikeTask = result.aiContext!.taskHistory.find(t => t.title === 'Take a nature hike')
      expect(aiHikeTask).toBeDefined()
      if (aiHikeTask) {
        expect(aiHikeTask.completed).toBe(true)
        expect(aiHikeTask.feedback).toBe('Enjoyed the fresh air and exercise')
      }
    })

    it('should exclude task history when not requested', async () => {
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context!.recentTaskHistory).toHaveLength(0)
      expect(result.aiContext!.taskHistory).toHaveLength(0)
    })
  })

  describe('Daily Task Generation Context', () => {
    it('should get optimized context for daily task generation', async () => {
      const result = await contextService.getDailyTaskGenerationContext(testUserId)

      expect(result.success).toBe(true)
      expect(result.context).toBeDefined()
      expect(result.aiContext).toBeDefined()
      
      // Should include 14 days of task history and patterns by default
      // (We won't have patterns in this test, but structure should be correct)
      expect(result.context!.userPatterns).toHaveLength(0)
    })
  })

  describe('Context Validation', () => {
    it('should validate required character data is present', async () => {
      const result = await contextService.gatherUserContext({
        userId: testUserId
      })

      expect(result.success).toBe(true)
      expect(result.context!.character.class).toBeTruthy()
      expect(result.context!.characterStats.length).toBeGreaterThan(0)
      
      // Each stat should have required fields
      result.context!.characterStats.forEach(stat => {
        expect(stat.id).toBeTruthy()
        expect(stat.category).toBeTruthy()
        expect(typeof stat.currentLevel).toBe('number')
        expect(typeof stat.totalXp).toBe('number')
      })
    })

    it('should handle empty family members gracefully', async () => {
      // Create user with no family members
      const [userNoFamily] = await db.insert(users).values({
        email: 'no-family@example.com',
        name: 'No Family User',
        timezone: 'UTC'
      }).returning()
      cleanupUserIds.push(userNoFamily.id)

      const [charNoFamily] = await db.insert(characters).values({
        userId: userNoFamily.id,
        name: 'Solo Character',
        class: 'Independent Explorer',
        backstory: 'A self-reliant adventurer'
      }).returning()
      cleanupCharacterIds.push(charNoFamily.id)

      // Create basic stats
      const [stat] = await db.insert(characterStatsTable).values({
        characterId: charNoFamily.id,
        category: 'Self Reliance',
        currentXp: 100,
        currentLevel: 1,
        totalXp: 100
      }).returning()
      cleanupStatIds.push(stat.id)

      const result = await contextService.gatherUserContext({
        userId: userNoFamily.id
      })

      expect(result.success).toBe(true)
      expect(result.context!.familyMembers).toHaveLength(0)
      expect(result.aiContext!.familyMembers).toHaveLength(0)
    })
  })
})
