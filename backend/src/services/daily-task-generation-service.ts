import { db } from '../db/connection'
import { 
  tasks as tasksTable,
  users as usersTable
} from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { AIService, type TaskGenerationContext, type EnhancedTaskGenerationResponse } from './ai-service'
import { AIContextService } from './ai-context-service'
import { WeatherService } from './weather-service'

export interface DailyTaskRequest {
  userId: string
  forceRegenerate?: boolean
  zipCode?: string
  dailyFocus?: string // Task 4.9: Daily focus influence
  focusWeight?: number // How much to weight the daily focus (0.1-1.0)
}

export interface EnhancedDailyTaskResponse {
  success: boolean
  data?: {
    adventureTask: {
      id: string
      title: string
      description: string
      targetStats: Array<{
        category: string
        xpWeight: number
        reasoning: string
      }>
      estimatedXp: number
      difficulty: 'easy' | 'medium' | 'hard' | 'epic'
      timeEstimate: string
      prerequisites?: string[]
      reasoning: string
      weatherInfluence?: string
      goalAlignment?: string
    }
    familyTask: {
      id: string
      title: string
      description: string
      targetStats: Array<{
        category: string
        xpWeight: number
        reasoning: string
      }>
      estimatedXp: number
      difficulty: 'easy' | 'medium' | 'hard' | 'epic'
      timeEstimate: string
      prerequisites?: string[]
      reasoning: string
      targetFamilyMember?: string
      interactionType: 'quality_time' | 'activity' | 'conversation' | 'support' | 'shared_interest'
      overdueNotes?: string
    }
    generatedAt: string
    weather?: {
      condition: string
      temperature: number
      description: string
    }
    generationMetadata: {
      contextFactorsConsidered: string[]
      alternativesConsidered?: string[]
      adaptationsFromHistory?: string[]
      dailyFocusInfluence?: string
    }
  }
  error?: {
    type: 'not_found' | 'already_generated' | 'generation_failed' | 'validation_error'
    message: string
  }
}

// Keep backward compatibility
export interface DailyTaskResponse {
  success: boolean
  data?: {
    adventureTask: {
      id: string
      title: string
      description: string
      targetStats: string[]
      estimatedXp: number
    }
    familyTask: {
      id: string
      title: string
      description: string
      targetStats: string[]
      estimatedXp: number
    }
    generatedAt: string
    weather?: {
      condition: string
      temperature: number
      description: string
    }
  }
  error?: {
    type: 'not_found' | 'already_generated' | 'generation_failed' | 'validation_error'
    message: string
  }
}

export interface AITaskGenerationResponse {
  adventureTask: {
    title: string
    description: string
    targetStats: string[]
    estimatedXp: number
    reasoning: string
  }
  familyTask: {
    title: string
    description: string
    targetStats: string[]
    estimatedXp: number
    reasoning: string
    targetFamilyMember?: string
  }
}

export class DailyTaskGenerationService {
  private aiService: AIService
  private contextService: AIContextService
  private weatherService: WeatherService

  constructor() {
    this.aiService = new AIService()
    this.contextService = new AIContextService()
    this.weatherService = new WeatherService()
  }

  async generateDailyTasks(request: DailyTaskRequest): Promise<DailyTaskResponse> {
    try {
      // Validate user exists
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, request.userId))
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

      // Check if tasks already generated for today (unless forcing regeneration)
      if (!request.forceRegenerate) {
        const existingTasks = await this.checkExistingTodayTasks(request.userId)
        if (existingTasks.length > 0) {
          return {
            success: false,
            error: {
              type: 'already_generated',
              message: 'Daily tasks have already been generated for today. Use forceRegenerate=true to override.'
            }
          }
        }
      }

      // Gather user context for AI
      const contextResult = await this.contextService.getDailyTaskGenerationContext(request.userId)
      if (!contextResult.success || !contextResult.aiContext) {
        return {
          success: false,
          error: {
            type: 'generation_failed',
            message: 'Failed to gather user context for task generation'
          }
        }
      }

      let aiRequest = contextResult.aiContext

      // Get weather context if zip code provided
      if (request.zipCode) {
        try {
          const weatherResult = await this.weatherService.getCurrentWeather(request.zipCode)
          if (weatherResult.success && weatherResult.data) {
            aiRequest.weather = {
              condition: weatherResult.data.condition,
              temperature: weatherResult.data.temperature
            }
          }
        } catch (error) {
          // Weather is optional, continue without it
          console.warn('Weather fetch failed for daily task generation:', error)
        }
      }

      // Generate tasks using AI
      const aiResponse = await this.generateAITasks(aiRequest)
      if (!aiResponse) {
        return {
          success: false,
          error: {
            type: 'generation_failed',
            message: 'AI task generation failed'
          }
        }
      }

      // Create adventure task
      const adventureTask = await this.createTask({
        userId: request.userId,
        title: aiResponse.adventureTask.title,
        description: aiResponse.adventureTask.description,
        source: 'ai',
        targetStats: aiResponse.adventureTask.targetStats,
        estimatedXp: aiResponse.adventureTask.estimatedXp
      })

      // Create family task
      const familyTask = await this.createTask({
        userId: request.userId,
        title: aiResponse.familyTask.title,
        description: aiResponse.familyTask.description,
        source: 'ai',
        targetStats: aiResponse.familyTask.targetStats,
        estimatedXp: aiResponse.familyTask.estimatedXp
      })

      const response: DailyTaskResponse = {
        success: true,
        data: {
          adventureTask: {
            id: adventureTask.id,
            title: adventureTask.title,
            description: adventureTask.description || '',
            targetStats: adventureTask.targetStats as string[],
            estimatedXp: adventureTask.estimatedXp || 0
          },
          familyTask: {
            id: familyTask.id,
            title: familyTask.title,
            description: familyTask.description || '',
            targetStats: familyTask.targetStats as string[],
            estimatedXp: familyTask.estimatedXp || 0
          },
          generatedAt: new Date().toISOString()
        }
      }

      // Include weather data if available
      if (aiRequest.weather) {
        response.data!.weather = {
          condition: aiRequest.weather.condition,
          temperature: aiRequest.weather.temperature,
          description: `Current weather: ${aiRequest.weather.condition}`
        }
      }

      return response

    } catch (error) {
      console.error('Daily task generation error:', error)
      return {
        success: false,
        error: {
          type: 'generation_failed',
          message: 'Unexpected error during task generation'
        }
      }
    }
  }

  private async checkExistingTodayTasks(userId: string): Promise<any[]> {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    return await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.userId, userId),
          eq(tasksTable.source, 'ai'),
          gte(tasksTable.createdAt, startOfDay),
          lte(tasksTable.createdAt, endOfDay)
        )
      )
  }

  private async generateAITasks(context: TaskGenerationContext): Promise<AITaskGenerationResponse | null> {
    try {
      const prompt = this.buildTaskGenerationPrompt(context)
      
      const result = await this.aiService.generateCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a D&D Life Gamification assistant that generates exactly 2 daily tasks for users:
1. Adventure Task: Focuses on personal growth, outdoor activities, learning, or adventure
2. Family Task: Focuses on connecting with family members, especially those overdue for interaction

Rules:
- Generate exactly 2 tasks, no more, no less
- Adventure task should align with character class and goals
- Family task should prioritize overdue family interactions
- Consider weather conditions for outdoor activities
- XP should be 15-35 points per task
- Target appropriate character stats
- Be specific and actionable
- Return valid JSON format only

Response format:
{
  "adventureTask": {
    "title": "string",
    "description": "string", 
    "targetStats": ["stat1", "stat2"],
    "estimatedXp": number,
    "reasoning": "string"
  },
  "familyTask": {
    "title": "string",
    "description": "string",
    "targetStats": ["Family Bonding"],
    "estimatedXp": number,
    "reasoning": "string",
    "targetFamilyMember": "name (if specific)"
  }
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        maxTokens: 800
      })

      if (!result.success || !result.content) {
        console.error('AI completion failed:', result.error)
        return null
      }

      // Parse AI response
      try {
        const aiResponse = JSON.parse(result.content) as AITaskGenerationResponse
        
        // Validate response structure
        if (!aiResponse.adventureTask || !aiResponse.familyTask) {
          console.error('Invalid AI response structure:', aiResponse)
          return null
        }

        // Validate required fields
        const requiredFields = ['title', 'description', 'targetStats', 'estimatedXp'] as const
        for (const field of requiredFields) {
          if (!aiResponse.adventureTask[field] || !aiResponse.familyTask[field]) {
            console.error(`Missing required field: ${field}`)
            return null
          }
        }

        // Ensure family task targets Family Bonding
        if (!aiResponse.familyTask.targetStats.includes('Family Bonding')) {
          aiResponse.familyTask.targetStats = ['Family Bonding']
        }

        // Validate XP ranges
        aiResponse.adventureTask.estimatedXp = Math.max(15, Math.min(35, aiResponse.adventureTask.estimatedXp))
        aiResponse.familyTask.estimatedXp = Math.max(15, Math.min(35, aiResponse.familyTask.estimatedXp))

        return aiResponse

      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        console.error('Raw AI response:', result.content)
        return null
      }

    } catch (error) {
      console.error('AI task generation error:', error)
      return null
    }
  }

  private buildTaskGenerationPrompt(context: TaskGenerationContext): string {
    let prompt = `Generate daily tasks for a ${context.characterClass} character.\n\n`
    
    prompt += `Character Background:\n${context.characterBackstory}\n\n`
    
    prompt += `Character Stats:\n`
    if (context.characterStats && context.characterStats.length > 0) {
      context.characterStats.forEach((stat: any) => {
        prompt += `- ${stat.category}: Level ${stat.currentLevel} (${stat.totalXp} XP total)\n`
      })
    }
    
    if (context.userGoals && context.userGoals.length > 0) {
      prompt += `\nUser Goals:\n`
      context.userGoals.forEach((goal: string) => {
        prompt += `- ${goal}\n`
      })
    }

    if (context.dailyFocus) {
      prompt += `\nToday's Focus: ${context.dailyFocus}\n`
    }

    if (context.familyMembers && context.familyMembers.length > 0) {
      prompt += `\nFamily Members:\n`
      context.familyMembers.forEach((member: any) => {
        const overdueText = member.isOverdue 
          ? ` (OVERDUE - last interaction ${member.daysSinceLastInteraction || 'never'} days ago)`
          : ''
        prompt += `- ${member.name}, age ${member.age}, interests: ${member.interests.join(', ')}${overdueText}\n`
      })
      
      // Highlight priority family interactions
      const overdueMmbers = context.familyMembers.filter((m: any) => m.isOverdue)
      if (overdueMmbers.length > 0) {
        prompt += `\nPRIORITY: Focus family task on overdue interactions, especially: ${overdueMmbers.map((m: any) => m.name).join(', ')}\n`
      }
    }

    if (context.weather) {
      prompt += `\nWeather Context:\n`
      prompt += `Current: ${context.weather.condition}, ${context.weather.temperature}°F\n`
    }

    if (context.taskHistory && context.taskHistory.length > 0) {
      prompt += `\nRecent Task History (for variety):\n`
      context.taskHistory.slice(0, 5).forEach((task: any) => {
        const status = task.completed ? '✓' : '○'
        prompt += `${status} ${task.title}\n`
        if (task.feedback) {
          prompt += `   Feedback: ${task.feedback}\n`
        }
      })
    }

    if (context.patterns && context.patterns.length > 0) {
      prompt += `\nUser Patterns:\n`
      context.patterns.forEach((pattern: any) => {
        prompt += `- ${pattern.type}: ${pattern.key} (confidence: ${pattern.confidence})\n`
      })
    }

    prompt += `\nGenerate exactly 2 tasks that will help this character grow while maintaining family connections.`

    return prompt
  }

  private async createTask(taskData: {
    userId: string
    title: string
    description: string
    source: string
    targetStats: string[]
    estimatedXp: number
  }) {
    const [task] = await db
      .insert(tasksTable)
      .values({
        userId: taskData.userId,
        title: taskData.title,
        description: taskData.description,
        source: taskData.source,
        targetStats: taskData.targetStats,
        estimatedXp: taskData.estimatedXp,
        status: 'pending'
      })
      .returning()

    return task
  }

  /**
   * Task 4.7, 4.8, 4.9: Enhanced daily task generation with intelligent XP, feedback learning, and focus influence
   */
  async generateEnhancedDailyTasks(request: DailyTaskRequest): Promise<EnhancedDailyTaskResponse> {
    try {
      // Validate user exists
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, request.userId))
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

      // Check if tasks already generated for today (unless forcing regeneration)
      if (!request.forceRegenerate) {
        const existingTasks = await this.checkExistingTodayTasks(request.userId)
        if (existingTasks.length > 0) {
          return {
            success: false,
            error: {
              type: 'already_generated',
              message: 'Daily tasks have already been generated for today. Use forceRegenerate=true to create new tasks.'
            }
          }
        }
      }

      // Gather AI context with enhanced data
      const contextResult = await this.contextService.getDailyTaskGenerationContext(request.userId)

      if (!contextResult.success || !contextResult.aiContext) {
        return {
          success: false,
          error: {
            type: 'generation_failed',
            message: contextResult.error?.message || 'Failed to gather user context'
          }
        }
      }

      // Task 4.9: Apply daily focus influence if provided
      let enhancedContext = contextResult.aiContext
      if (request.dailyFocus) {
        enhancedContext = {
          ...enhancedContext,
          dailyFocus: request.dailyFocus
        }
      }

      // Add weather context if zip code provided
      if (request.zipCode) {
        try {
          const weatherResult = await this.weatherService.getCurrentWeather(request.zipCode)
          if (weatherResult.success && weatherResult.data) {
            enhancedContext = {
              ...enhancedContext,
              weather: {
                condition: weatherResult.data.condition,
                temperature: weatherResult.data.temperature
              }
            }
          }
        } catch (error) {
          // Weather failure shouldn't block task generation
          console.warn('Weather fetch failed, continuing without weather context:', error)
        }
      }

      // Generate enhanced tasks using new AI capabilities
      const aiRequest = {
        userId: request.userId,
        context: enhancedContext,
        taskCount: 2,
        taskTypes: ['adventure', 'family'],
        dailyFocus: request.dailyFocus,
        focusWeight: request.focusWeight || 0.7
      }

      const enhancedResponse = await this.aiService.generateFocusInfluencedTasks(aiRequest)
      if (!enhancedResponse.success || !enhancedResponse.data) {
        return {
          success: false,
          error: {
            type: 'generation_failed',
            message: enhancedResponse.error?.message || 'Enhanced AI task generation failed'
          }
        }
      }

      // Create adventure task with enhanced data
      const adventureTask = await this.createEnhancedTask({
        userId: request.userId,
        title: enhancedResponse.data.adventureTask.title,
        description: enhancedResponse.data.adventureTask.description,
        source: 'ai',
        targetStats: enhancedResponse.data.adventureTask.targetStats.map(ts => ts.category),
        estimatedXp: enhancedResponse.data.adventureTask.estimatedXp,
        enhancedData: enhancedResponse.data.adventureTask
      })

      // Create family task with enhanced data
      const familyTask = await this.createEnhancedTask({
        userId: request.userId,
        title: enhancedResponse.data.familyTask.title,
        description: enhancedResponse.data.familyTask.description,
        source: 'ai',
        targetStats: enhancedResponse.data.familyTask.targetStats.map(ts => ts.category),
        estimatedXp: enhancedResponse.data.familyTask.estimatedXp,
        enhancedData: enhancedResponse.data.familyTask
      })

      // Prepare enhanced response
      const response: EnhancedDailyTaskResponse = {
        success: true,
        data: {
          adventureTask: {
            id: adventureTask.id,
            title: adventureTask.title,
            description: adventureTask.description || '',
            targetStats: enhancedResponse.data.adventureTask.targetStats,
            estimatedXp: adventureTask.estimatedXp || 0,
            difficulty: enhancedResponse.data.adventureTask.difficulty,
            timeEstimate: enhancedResponse.data.adventureTask.timeEstimate,
            prerequisites: enhancedResponse.data.adventureTask.prerequisites,
            reasoning: enhancedResponse.data.adventureTask.reasoning,
            weatherInfluence: enhancedResponse.data.adventureTask.weatherInfluence,
            goalAlignment: enhancedResponse.data.adventureTask.goalAlignment
          },
          familyTask: {
            id: familyTask.id,
            title: familyTask.title,
            description: familyTask.description || '',
            targetStats: enhancedResponse.data.familyTask.targetStats,
            estimatedXp: familyTask.estimatedXp || 0,
            difficulty: enhancedResponse.data.familyTask.difficulty,
            timeEstimate: enhancedResponse.data.familyTask.timeEstimate,
            prerequisites: enhancedResponse.data.familyTask.prerequisites,
            reasoning: enhancedResponse.data.familyTask.reasoning,
            targetFamilyMember: enhancedResponse.data.familyTask.targetFamilyMember,
            interactionType: enhancedResponse.data.familyTask.interactionType,
            overdueNotes: enhancedResponse.data.familyTask.overdueNotes
          },
          generatedAt: new Date().toISOString(),
          generationMetadata: {
            ...enhancedResponse.data.generationMetadata,
            dailyFocusInfluence: request.dailyFocus ? `Daily focus "${request.dailyFocus}" influenced task generation with weight ${request.focusWeight || 0.7}` : undefined
          }
        }
      }

      // Include weather data if available
      if (enhancedContext.weather) {
        response.data!.weather = {
          condition: enhancedContext.weather.condition,
          temperature: enhancedContext.weather.temperature,
          description: `Current weather: ${enhancedContext.weather.condition}`
        }
      }

      return response

    } catch (error) {
      console.error('Enhanced daily task generation error:', error)
      return {
        success: false,
        error: {
          type: 'generation_failed',
          message: 'Unexpected error during enhanced task generation'
        }
      }
    }
  }

  /**
   * Task 4.8: Process feedback from completed tasks for learning
   */
  async processFeedbackForLearning(request: {
    userId: string
    taskId: string
    feedback: string
    actualXp?: number
    wasCompleted: boolean
    completionNotes?: string
  }): Promise<{
    success: boolean
    learningInsights?: any
    error?: { type: string; message: string }
  }> {
    try {
      // Get user context for feedback analysis
      const contextResult = await this.contextService.getDailyTaskGenerationContext(request.userId)

      if (!contextResult.success || !contextResult.aiContext) {
        return {
          success: false,
          error: {
            type: 'context_failed',
            message: 'Failed to gather context for feedback analysis'
          }
        }
      }

      // Process feedback using AI service
      const feedbackResult = await this.aiService.processFeedbackForLearning({
        ...request,
        context: contextResult.aiContext
      })

      return feedbackResult

    } catch (error) {
      console.error('Feedback processing error:', error)
      return {
        success: false,
        error: {
          type: 'processing_failed',
          message: 'Unexpected error processing feedback'
        }
      }
    }
  }

  /**
   * Create enhanced task with additional metadata for Tasks 4.7+
   */
  private async createEnhancedTask(taskData: {
    userId: string
    title: string
    description: string
    source: 'ai' | 'quest' | 'experiment' | 'todo' | 'ad-hoc'
    targetStats: string[]
    estimatedXp: number
    enhancedData?: any // Additional metadata for enhanced tasks
  }) {
    const [task] = await db
      .insert(tasksTable)
      .values({
        userId: taskData.userId,
        title: taskData.title,
        description: taskData.description,
        source: taskData.source,
        targetStats: taskData.targetStats,
        estimatedXp: taskData.estimatedXp,
        status: 'pending'
        // Note: enhancedData can be stored in a separate table or as metadata if needed
      })
      .returning()

    return task
  }
}
