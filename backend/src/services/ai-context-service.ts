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
  taskCompletions as taskCompletionsTable,
  familyMemberInteractions as familyMemberInteractionsTable,
  taskCompletionPatterns as taskCompletionPatternsTable,
  patternInsights
} from '../db/schema'
import { eq, and, desc, gte, sql, count } from 'drizzle-orm'
import type { TaskGenerationContext } from './ai-service'

export interface UserContextData {
  character: {
    id: string
    name: string
    class: string
    backstory?: string
  }
  characterStats: Array<{
    id: string
    category: string
    currentLevel: number
    totalXp: number
    description?: string
  }>
  familyMembers: Array<{
    id: string
    name: string
    age?: number
    interests: string[]
    interactionFrequency: string
    daysSinceLastInteraction?: number
    isOverdue: boolean
  }>
  goals: Array<{
    id: string
    title: string
    description?: string
    priority: string
    status: string
    relatedStats?: string[]
  }>
  dailyFocus?: {
    id: string
    focus: string
    description?: string
    focusDate: string
  }
  projects: Array<{
    id: string
    title: string
    description?: string
    status: string
    dueDate?: string
  }>
  recentTaskHistory: Array<{
    id: string
    title: string
    description?: string
    source: string
    feedback?: string
    completed: boolean
    completedAt?: string
    xpAwarded?: number
  }>
  userPatterns: Array<{
    patternType: string
    patternKey: string
    confidence: number
    shouldAvoid: boolean
    recommendation?: string
  }>
}

export interface AIContextGatheringRequest {
  userId: string
  includeTaskHistory?: boolean
  taskHistoryDays?: number
  includePatterns?: boolean
}

export interface AIContextGatheringResponse {
  success: boolean
  context?: UserContextData
  aiContext?: TaskGenerationContext
  error?: {
    type: 'validation' | 'not_found' | 'database'
    message: string
  }
}

/**
 * AI Context Gathering Service
 * Collects comprehensive user context for AI task generation including:
 * - Character class, backstory, and stats
 * - Family members and interaction patterns  
 * - Goals and projects
 * - Daily focus
 * - Recent task history with feedback
 * - User behavioral patterns
 */
export class AIContextService {

  /**
   * Gather comprehensive user context for AI task generation
   */
  async gatherUserContext(request: AIContextGatheringRequest): Promise<AIContextGatheringResponse> {
    try {
      const { userId, includeTaskHistory = true, taskHistoryDays = 30, includePatterns = true } = request

      // Validate user exists
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'User not found'
          }
        }
      }

      // Get active character
      const [character] = await db
        .select({
          id: characters.id,
          name: characters.name,
          class: characters.class,
          backstory: characters.backstory
        })
        .from(characters)
        .where(and(
          eq(characters.userId, userId),
          eq(characters.isActive, true)
        ))
        .limit(1)

      if (!character) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'No active character found for user'
          }
        }
      }

      // Get character stats
      const characterStats = await db
        .select({
          id: characterStatsTable.id,
          category: characterStatsTable.category,
          currentLevel: characterStatsTable.currentLevel,
          totalXp: characterStatsTable.totalXp,
          description: characterStatsTable.description
        })
        .from(characterStatsTable)
        .where(eq(characterStatsTable.characterId, character.id))
        .orderBy(characterStatsTable.category)

      // Get family members with interaction data
      const familyMembers = await this.getFamilyMembersWithInteractionData(userId)

      // Get active goals
      const goals = await db
        .select({
          id: goalsTable.id,
          title: goalsTable.title,
          description: goalsTable.description,
          priority: goalsTable.priority,
          status: goalsTable.status,
          relatedStats: goalsTable.relatedStats
        })
        .from(goalsTable)
        .where(and(
          eq(goalsTable.userId, userId),
          eq(goalsTable.status, 'active')
        ))
        .orderBy(desc(goalsTable.priority), goalsTable.createdAt)

      // Get today's daily focus
      const today = new Date().toISOString().split('T')[0]
      const [dailyFocus] = await db
        .select({
          id: dailyFocusesTable.id,
          focus: dailyFocusesTable.focus,
          description: dailyFocusesTable.description,
          focusDate: dailyFocusesTable.focusDate
        })
        .from(dailyFocusesTable)
        .where(and(
          eq(dailyFocusesTable.userId, userId),
          eq(dailyFocusesTable.focusDate, today),
          eq(dailyFocusesTable.isActive, true)
        ))
        .limit(1)

      // Get active projects
      const projects = await db
        .select({
          id: projectsTable.id,
          title: projectsTable.title,
          description: projectsTable.description,
          status: projectsTable.status,
          dueDate: projectsTable.dueDate
        })
        .from(projectsTable)
        .where(and(
          eq(projectsTable.userId, userId),
          eq(projectsTable.status, 'active')
        ))
        .orderBy(projectsTable.dueDate, projectsTable.createdAt)

      // Get recent task history (if requested)
      let recentTaskHistory: UserContextData['recentTaskHistory'] = []
      if (includeTaskHistory) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - taskHistoryDays)

        recentTaskHistory = await this.getRecentTaskHistory(userId, cutoffDate)
      }

      // Get user patterns (if requested)
      let userPatterns: UserContextData['userPatterns'] = []
      if (includePatterns) {
        userPatterns = await this.getUserPatterns(userId)
      }

      const context: UserContextData = {
        character: {
          id: character.id,
          name: character.name,
          class: character.class,
          backstory: character.backstory || undefined
        },
        characterStats: characterStats.map(stat => ({
          id: stat.id,
          category: stat.category,
          currentLevel: stat.currentLevel,
          totalXp: stat.totalXp,
          description: stat.description || undefined
        })),
        familyMembers,
        goals: goals.map(goal => ({
          id: goal.id,
          title: goal.title,
          description: goal.description || undefined,
          priority: goal.priority || 'medium',
          status: goal.status,
          relatedStats: (goal.relatedStats as string[]) || undefined
        })),
        dailyFocus: dailyFocus ? {
          id: dailyFocus.id,
          focus: dailyFocus.focus,
          description: dailyFocus.description || undefined,
          focusDate: dailyFocus.focusDate as string
        } : undefined,
        projects: projects.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description || undefined,
          status: project.status,
          dueDate: project.dueDate?.toISOString()
        })),
        recentTaskHistory,
        userPatterns
      }

      // Convert to AI service format
      const aiContext = this.convertToAIContext(context)

      return {
        success: true,
        context,
        aiContext
      }

    } catch (error) {
      console.error('Error gathering user context:', error)
      return {
        success: false,
        error: {
          type: 'database',
          message: error instanceof Error ? error.message : 'Database error while gathering context'
        }
      }
    }
  }

  /**
   * Get family members with interaction timing data
   */
  private async getFamilyMembersWithInteractionData(userId: string) {
    const familyMembers = await db
      .select({
        id: familyMembersTable.id,
        name: familyMembersTable.name,
        age: familyMembersTable.age,
        interests: familyMembersTable.interests,
        interactionFrequency: familyMembersTable.interactionFrequency,
        lastInteraction: familyMembersTable.lastInteraction
      })
      .from(familyMembersTable)
      .where(eq(familyMembersTable.userId, userId))
      .orderBy(familyMembersTable.name)

    const today = new Date()
    
    return familyMembers.map(member => {
      let daysSinceLastInteraction: number | undefined = undefined
      let isOverdue = false

      if (member.lastInteraction) {
        const lastInteractionDate = new Date(member.lastInteraction)
        daysSinceLastInteraction = Math.floor(
          (today.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Calculate if overdue based on frequency
        const frequencyDays = {
          daily: 1,
          weekly: 7,
          biweekly: 14,
          monthly: 30
        }
        const maxDays = frequencyDays[member.interactionFrequency as keyof typeof frequencyDays] || 7
        isOverdue = daysSinceLastInteraction > maxDays
      } else {
        // Never interacted - consider overdue
        isOverdue = true
      }

      return {
        id: member.id,
        name: member.name,
        age: member.age || undefined,
        interests: (member.interests as string[]) || [],
        interactionFrequency: member.interactionFrequency || 'weekly',
        daysSinceLastInteraction,
        isOverdue
      }
    })
  }

  /**
   * Get recent task history with completion details
   */
  private async getRecentTaskHistory(userId: string, cutoffDate: Date) {
    const tasksWithCompletions = await db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        description: tasksTable.description,
        source: tasksTable.source,
        status: tasksTable.status,
        completedAt: tasksTable.completedAt,
        feedback: taskCompletionsTable.feedback,
        actualXp: taskCompletionsTable.actualXp
      })
      .from(tasksTable)
      .leftJoin(taskCompletionsTable, eq(tasksTable.id, taskCompletionsTable.taskId))
      .where(and(
        eq(tasksTable.userId, userId),
        gte(tasksTable.createdAt, cutoffDate)
      ))
      .orderBy(desc(tasksTable.createdAt))
      .limit(50) // Limit to recent tasks

    return tasksWithCompletions.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      source: task.source,
      feedback: task.feedback || undefined,
      completed: task.status === 'completed',
      completedAt: task.completedAt?.toISOString(),
      xpAwarded: task.actualXp || undefined
    }))
  }

  /**
   * Get user behavioral patterns for AI learning
   */
  private async getUserPatterns(userId: string) {
    const patterns = await db
      .select({
        patternType: taskCompletionPatternsTable.patternType,
        patternKey: taskCompletionPatternsTable.patternKey,
        confidence: taskCompletionPatternsTable.confidence,
        shouldAvoid: taskCompletionPatternsTable.shouldAvoid,
        recommendation: taskCompletionPatternsTable.recommendation
      })
      .from(taskCompletionPatternsTable)
      .where(and(
        eq(taskCompletionPatternsTable.userId, userId),
        gte(taskCompletionPatternsTable.confidence, '0.6') // Only high-confidence patterns
      ))
      .orderBy(desc(taskCompletionPatternsTable.confidence))
      .limit(20)

    return patterns.map(pattern => ({
      patternType: pattern.patternType,
      patternKey: pattern.patternKey,
      confidence: parseFloat(pattern.confidence as string),
      shouldAvoid: pattern.shouldAvoid || false,
      recommendation: pattern.recommendation || undefined
    }))
  }

  /**
   * Convert gathered context to AI service format
   */
  private convertToAIContext(context: UserContextData): TaskGenerationContext {
    return {
      characterClass: context.character.class,
      characterBackstory: context.character.backstory,
      characterStats: context.characterStats.map(stat => ({
        category: stat.category,
        currentLevel: stat.currentLevel,
        totalXp: stat.totalXp,
        description: stat.description
      })),
      userGoals: context.goals.map(goal => goal.title),
      familyMembers: context.familyMembers.map(member => ({
        name: member.name,
        age: member.age || 0,
        interests: member.interests,
        interactionFrequency: member.interactionFrequency,
        isOverdue: member.isOverdue,
        daysSinceLastInteraction: member.daysSinceLastInteraction
      })),
      taskHistory: context.recentTaskHistory.map(task => ({
        id: task.id,
        title: task.title,
        feedback: task.feedback,
        completed: task.completed
      })),
      patterns: context.userPatterns.map(pattern => ({
        type: pattern.patternType,
        key: pattern.patternKey,
        confidence: pattern.confidence,
        shouldAvoid: pattern.shouldAvoid
      })),
      dailyFocus: context.dailyFocus?.focus
    }
  }

  /**
   * Get context specifically for daily task generation
   * This is optimized for the daily 2-task generation (1 adventure + 1 family)
   */
  async getDailyTaskGenerationContext(userId: string): Promise<AIContextGatheringResponse> {
    return this.gatherUserContext({
      userId,
      includeTaskHistory: true,
      taskHistoryDays: 14, // Last 2 weeks for recent context
      includePatterns: true
    })
  }

  /**
   * Get family interaction priorities for task generation
   * Returns family members prioritized by overdue interactions
   */
  async getFamilyInteractionPriorities(userId: string) {
    try {
      const familyData = await this.getFamilyMembersWithInteractionData(userId)
      
      // Sort by priority: overdue first, then by days since last interaction
      const prioritized = familyData
        .filter(member => member.isOverdue || (member.daysSinceLastInteraction !== undefined && member.daysSinceLastInteraction >= 0))
        .sort((a, b) => {
          // Overdue members first
          if (a.isOverdue && !b.isOverdue) return -1
          if (!a.isOverdue && b.isOverdue) return 1
          
          // Then by days since last interaction (higher first)
          const aDays = a.daysSinceLastInteraction || 0
          const bDays = b.daysSinceLastInteraction || 0
          return bDays - aDays
        })

      return {
        success: true,
        priorities: prioritized.slice(0, 3), // Top 3 priorities
        totalOverdue: familyData.filter(m => m.isOverdue).length
      }
    } catch (error) {
      console.error('Error getting family interaction priorities:', error)
      return {
        success: false,
        error: {
          type: 'database' as const,
          message: 'Failed to get family interaction priorities'
        }
      }
    }
  }
}
