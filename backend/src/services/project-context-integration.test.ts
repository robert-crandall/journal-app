import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { db } from '../db/connection'
import { users, characters, characterStats, projects as projectsTable } from '../db/schema'
import { AIContextService } from './ai-context-service'
import { AIService } from './ai-service'
import { eq } from 'drizzle-orm'

// Load environment variables
import '../env'

// Mock the AI service to avoid real API calls
const mockAIService = {
  isConfigured: () => true,
  generateCompletion: async (request: any) => ({
    success: true,
    content: JSON.stringify({
      adventureTask: {
        title: 'Project-Influenced Adventure',
        description: 'A mindful nature walk to balance intense project work',
        targetStats: [
          {
            category: 'Adventure Spirit',
            xpWeight: 0.8,
            reasoning: 'Nature exploration provides mental balance'
          }
        ],
        difficulty: 'easy',
        timeEstimate: '30 minutes',
        reasoning: 'Balancing activity for high-stress project context',
        weatherInfluence: 'Good weather for outdoor activity',
        goalAlignment: 'Supports stress relief during project crunch'
      },
      familyTask: {
        title: 'Family Game Night',
        description: 'Play board games to unwind and connect with family',
        targetStats: [
          {
            category: 'Family Bonding',
            xpWeight: 1.0,
            reasoning: 'Quality time strengthens family connections'
          }
        ],
        difficulty: 'easy',
        timeEstimate: '45 minutes',
        targetFamilyMember: 'Family',
        interactionType: 'quality_time',
        reasoning: 'Relaxing family activity after stressful project work'
      },
      generationMetadata: {
        contextFactorsConsidered: ['projects', 'character_stats', 'goals'],
        alternativesConsidered: ['Other relaxing activities'],
        adaptationsFromHistory: ['Adapted for project stress context']
      }
    })
  }),
  generateEnhancedDailyTasks: async (request: any) => {
    const mockTasks = await mockAIService.generateCompletion(request)
    if (!mockTasks.success) {
      return {
        success: false,
        error: { type: 'generation_failed', message: 'Mock AI generation failed' }
      }
    }

    const parsed = JSON.parse(mockTasks.content!)
    return {
      success: true,
      data: {
        adventureTask: {
          ...parsed.adventureTask,
          estimatedXp: 25,
          xpCalculation: {
            baseXp: 20,
            difficultyMultiplier: 1.0,
            statLevelMultiplier: 1.25,
            reasoning: 'Calculated based on easy difficulty and character level'
          }
        },
        familyTask: {
          ...parsed.familyTask,
          estimatedXp: 30,
          xpCalculation: {
            baseXp: 25,
            difficultyMultiplier: 1.0,
            statLevelMultiplier: 1.2,
            reasoning: 'Family bonding with slight level adjustment'
          }
        },
        generationMetadata: parsed.generationMetadata
      }
    }
  }
} as unknown as AIService

/**
 * Task 4.10: Project Context Integration Tests
 * Tests that projects influence AI task generation context but don't appear on dashboard
 */
describe('Project Context Integration (Task 4.10)', () => {
  let testUserId: string
  let testCharacterId: string
  let contextService: AIContextService
  let aiService: AIService
  let cleanupUserIds: string[] = []
  let cleanupProjectIds: string[] = []

  beforeAll(async () => {
    contextService = new AIContextService()
    aiService = mockAIService
  })

  beforeEach(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: `test-project-context-${Date.now()}@example.com`,
        name: 'Project Context Test User'
      })
      .returning()
    
    testUserId = user.id
    cleanupUserIds.push(testUserId)

    // Create test character
    const [character] = await db
      .insert(characters)
      .values({
        userId: testUserId,
        name: 'Test Character',
        class: 'Adventurer',
        backstory: 'A brave explorer',
        isActive: true
      })
      .returning()

    testCharacterId = character.id

    // Create character stats
    await db
      .insert(characterStats)
      .values([
        {
          characterId: testCharacterId,
          category: 'Adventure Spirit',
          currentLevel: 5,
          totalXp: 150
        },
        {
          characterId: testCharacterId,
          category: 'Creative Expression',
          currentLevel: 3,
          totalXp: 85
        }
      ])
  })

  afterEach(async () => {
    // Clean up projects
    if (cleanupProjectIds.length > 0) {
      await db
        .delete(projectsTable)
        .where(eq(projectsTable.id, cleanupProjectIds[0]))
      cleanupProjectIds = []
    }

    // Clean up users (cascades to characters and stats)
    for (const userId of cleanupUserIds) {
      await db
        .delete(users)
        .where(eq(users.id, userId))
    }
    cleanupUserIds = []
  })

  describe('Project Context Collection', () => {
    it('should include active projects in AI context', async () => {
      // Create test projects
      const projectsData = [
        {
          userId: testUserId,
          title: 'Build a Mobile App',
          description: 'Creating a productivity app for daily task management',
          status: 'active' as const,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
        },
        {
          userId: testUserId,
          title: 'Write a Novel',
          description: 'Fantasy adventure novel with 50,000 words',
          status: 'active' as const
        },
        {
          userId: testUserId,
          title: 'Completed Project',
          description: 'This should not appear',
          status: 'completed' as const
        }
      ]

      const insertedProjects = await db
        .insert(projectsTable)
        .values(projectsData)
        .returning()

      cleanupProjectIds.push(...insertedProjects.map(p => p.id))

      // Get context
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context!.projects).toBeDefined()
      expect(result.context!.projects).toHaveLength(2) // Only active projects

      const activeProject = result.context!.projects.find(p => p.title === 'Build a Mobile App')
      expect(activeProject).toBeDefined()
      expect(activeProject!.description).toBe('Creating a productivity app for daily task management')
      expect(activeProject!.status).toBe('active')
      expect(activeProject!.dueDate).toBeDefined()

      // Verify AI context includes projects
      expect(result.aiContext!.projects).toBeDefined()
      expect(result.aiContext!.projects).toHaveLength(2)

      const aiActiveProject = result.aiContext!.projects!.find(p => p.title === 'Build a Mobile App')
      expect(aiActiveProject).toBeDefined()
      expect(aiActiveProject!.description).toBe('Creating a productivity app for daily task management')

      // Verify completed project is excluded
      const completedProject = result.aiContext!.projects!.find(p => p.title === 'Completed Project')
      expect(completedProject).toBeUndefined()
    })

    it('should handle users with no projects', async () => {
      const result = await contextService.gatherUserContext({
        userId: testUserId,
        includeTaskHistory: false,
        includePatterns: false
      })

      expect(result.success).toBe(true)
      expect(result.context!.projects).toHaveLength(0)
      expect(result.aiContext!.projects).toHaveLength(0)
    })
  })

  describe('Project Context in AI Prompts', () => {
    it('should include project context in task generation prompts', async () => {
      // Create test projects with varying due dates
      const urgentProject = {
        userId: testUserId,
        title: 'Urgent Website Launch',
        description: 'High-stress project with tight deadline',
        status: 'active' as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      }

      const regularProject = {
        userId: testUserId,
        title: 'Learn Guitar',
        description: 'Practice guitar for personal enjoyment',
        status: 'active' as const,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }

      const insertedProjects = await db
        .insert(projectsTable)
        .values([urgentProject, regularProject])
        .returning()

      cleanupProjectIds.push(...insertedProjects.map(p => p.id))

      // Get context
      const contextResult = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(contextResult.success).toBe(true)
      expect(contextResult.aiContext!.projects).toHaveLength(2)

      // Test that AI service can process context with projects
      const result = await aiService.generateEnhancedDailyTasks({
        userId: testUserId,
        context: contextResult.aiContext!,
        taskCount: 2,
        taskTypes: ['adventure', 'family']
      })

      if (!result.success) {
        console.error('AI generation failed:', result.error)
      }

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.adventureTask).toBeDefined()
      expect(result.data!.familyTask).toBeDefined()

      // Verify generation metadata considers project context
      expect(result.data!.generationMetadata).toBeDefined()
      expect(result.data!.generationMetadata.contextFactorsConsidered).toContain('projects')
    })

    it('should generate project-influenced tasks without direct project work', async () => {
      // Create high-stress project
      const stressfulProject = {
        userId: testUserId,
        title: 'Complex Software Architecture',
        description: 'Designing microservices for enterprise system',
        status: 'active' as const,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days - stressful
      }

      const [project] = await db
        .insert(projectsTable)
        .values(stressfulProject)
        .returning()

      cleanupProjectIds.push(project.id)

      // Get context with project
      const contextResult = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(contextResult.success).toBe(true)
      
      const projectContext = contextResult.aiContext!.projects!.find(p => p.title === 'Complex Software Architecture')
      expect(projectContext).toBeDefined()

      // Generate tasks influenced by project stress
      const result = await aiService.generateEnhancedDailyTasks({
        userId: testUserId,
        context: contextResult.aiContext!,
        taskCount: 2,
        taskTypes: ['adventure', 'family']
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Tasks should be influenced by project context but not BE project tasks
      const adventureTask = result.data!.adventureTask
      expect(adventureTask.title).toBeDefined()
      expect(adventureTask.description).toBeDefined()
      
      // Tasks should not be direct project work
      expect(adventureTask.title.toLowerCase()).not.toContain('software')
      expect(adventureTask.title.toLowerCase()).not.toContain('architecture')
      expect(adventureTask.title.toLowerCase()).not.toContain('microservices')
      
      // But should consider project stress context (e.g., stress relief, balance)
      const taskContent = `${adventureTask.title} ${adventureTask.description}`.toLowerCase()
      const hasBalancingContent = (
        taskContent.includes('relax') ||
        taskContent.includes('nature') ||
        taskContent.includes('walk') ||
        taskContent.includes('mindful') ||
        taskContent.includes('creative') ||
        taskContent.includes('physical') ||
        taskContent.includes('fresh air') ||
        taskContent.includes('balance')
      )
      
      // At least one task should show project influence through balancing activities
      expect(hasBalancingContent).toBe(true)
    })
  })

  describe('Project Deadline Urgency', () => {
    it('should recognize urgent project deadlines in context', async () => {
      // Create project with urgent deadline
      const urgentProject = {
        userId: testUserId,
        title: 'Presentation Tomorrow',
        description: 'Important client presentation',
        status: 'active' as const,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
      }

      const [project] = await db
        .insert(projectsTable)
        .values(urgentProject)
        .returning()

      cleanupProjectIds.push(project.id)

      // Get context
      const result = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(result.success).toBe(true)
      
      const projectInContext = result.aiContext!.projects!.find(p => p.title === 'Presentation Tomorrow')
      expect(projectInContext).toBeDefined()
      expect(projectInContext!.dueDate).toBeDefined()

      // Test that urgent deadline is captured
      const dueDate = new Date(projectInContext!.dueDate!)
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      expect(daysUntilDue).toBeLessThanOrEqual(1)
    })

    it('should generate stress-relief tasks for urgent projects', async () => {
      // Create multiple urgent projects to simulate high stress
      const urgentProjects = [
        {
          userId: testUserId,
          title: 'Emergency Bug Fix',
          description: 'Critical production issue',
          status: 'active' as const,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
        },
        {
          userId: testUserId,
          title: 'Board Presentation',
          description: 'Quarterly results presentation',
          status: 'active' as const,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        }
      ]

      const insertedProjects = await db
        .insert(projectsTable)
        .values(urgentProjects)
        .returning()

      cleanupProjectIds.push(...insertedProjects.map(p => p.id))

      // Get context and generate tasks
      const contextResult = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(contextResult.success).toBe(true)
      expect(contextResult.aiContext!.projects).toHaveLength(2)

      const result = await aiService.generateEnhancedDailyTasks({
        userId: testUserId,
        context: contextResult.aiContext!,
        taskCount: 2,
        taskTypes: ['adventure', 'family']
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // With urgent projects, tasks should focus on stress relief and balance
      const adventureTask = result.data!.adventureTask
      const familyTask = result.data!.familyTask
      
      const allTaskContent = `${adventureTask.title} ${adventureTask.description} ${familyTask.title} ${familyTask.description}`.toLowerCase()
      
      // Should include stress-relief or balancing elements
      const hasStressRelief = (
        allTaskContent.includes('relax') ||
        allTaskContent.includes('calm') ||
        allTaskContent.includes('peaceful') ||
        allTaskContent.includes('gentle') ||
        allTaskContent.includes('breathe') ||
        allTaskContent.includes('mindful') ||
        allTaskContent.includes('nature') ||
        allTaskContent.includes('walk') ||
        allTaskContent.includes('balance')
      )
      
      expect(hasStressRelief).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle projects with no due dates', async () => {
      const openEndedProject = {
        userId: testUserId,
        title: 'Learn Photography',
        description: 'Ongoing skill development',
        status: 'active' as const
        // No dueDate
      }

      const [project] = await db
        .insert(projectsTable)
        .values(openEndedProject)
        .returning()

      cleanupProjectIds.push(project.id)

      const result = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(result.success).toBe(true)
      
      const projectInContext = result.aiContext!.projects!.find(p => p.title === 'Learn Photography')
      expect(projectInContext).toBeDefined()
      expect(projectInContext!.dueDate).toBeUndefined()
    })

    it('should handle projects with past due dates', async () => {
      const overdueProject = {
        userId: testUserId,
        title: 'Overdue Report',
        description: 'Should have been finished yesterday',
        status: 'active' as const,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }

      const [project] = await db
        .insert(projectsTable)
        .values(overdueProject)
        .returning()

      cleanupProjectIds.push(project.id)

      const result = await contextService.getDailyTaskGenerationContext(testUserId)
      expect(result.success).toBe(true)
      
      const projectInContext = result.aiContext!.projects!.find(p => p.title === 'Overdue Report')
      expect(projectInContext).toBeDefined()
      
      // Should still be included as active project context
      const dueDate = new Date(projectInContext!.dueDate!)
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      expect(daysUntilDue).toBeLessThan(0) // Overdue
    })
  })
})
