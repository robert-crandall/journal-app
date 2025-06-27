import { env } from '../env'
import { calculateTotalXpForLevel } from '../utils/xp-calculator'

// Types for AI Service API
export interface AICompletionRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  maxTokens: number
  temperature?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
}

export interface AICompletionResponse {
  success: boolean
  content: string | null
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: {
    type: 'api' | 'network' | 'timeout' | 'validation' | 'rate_limit'
    message: string
    details?: any
  }
}

export interface TaskGenerationContext {
  characterClass: string
  characterBackstory?: string
  characterStats?: Array<{
    category: string
    currentLevel: number
    totalXp: number
    description?: string
  }>
  userGoals?: string[]
  familyMembers?: Array<{
    name: string
    age: number
    interests: string[]
    interactionFrequency?: string
    isOverdue?: boolean
    daysSinceLastInteraction?: number
  }>
  // Task 4.10: Projects context for AI influence (not dashboard display)
  projects?: Array<{
    id: string
    title: string
    description?: string
    status: string
    dueDate?: string
  }>
  weather?: {
    condition: string
    temperature: number
  }
  taskHistory?: Array<{
    id: string
    title: string
    feedback?: string
    completed: boolean
  }>
  patterns?: Array<{
    type: string
    key: string
    confidence: number
    shouldAvoid: boolean
  }>
  dailyFocus?: string
}

export interface TaskGenerationRequest {
  userId: string
  context: TaskGenerationContext
  taskCount: number
  taskTypes: string[]
  constraints?: {
    avoidOutdoor?: boolean
    preferredTime?: string
    maxDifficulty?: string
  }
}

export interface GeneratedTask {
  type: 'adventure' | 'family'
  title: string
  description: string
  targetStats: string[]
  estimatedXp: number
  difficulty: 'easy' | 'medium' | 'hard'
  reasoning?: string
}

export interface TaskGenerationResponse {
  success: boolean
  tasks: GeneratedTask[]
  error?: {
    type: 'validation' | 'api' | 'processing'
    message: string
  }
}

export interface JournalProcessingRequest {
  userId: string
  conversation: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  characterStats: string[]
}

export interface JournalMetadata {
  summary: string
  synopsis: string
  title: string
  contentTags: string[]
  characterStatTags: string[]
}

export interface XPAward {
  statCategory: string
  xpChange: number
  reasoning: string
}

export interface JournalProcessingResponse {
  success: boolean
  metadata?: JournalMetadata
  xpAwards?: XPAward[]
  error?: {
    type: 'validation' | 'api' | 'processing'
    message: string
  }
}

export interface AIServiceOptions {
  timeout?: number
  retryAttempts?: number
  baseUrl?: string
}

/**
 * OpenAI GPT Integration Service for D&D Life Gamification App
 * Handles task generation, journal processing, and other AI-powered features
 */
export class AIService {
  private readonly apiKey: string | null
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly retryAttempts: number
  private readonly defaultModel: string

  constructor(options: AIServiceOptions = {}) {
    // Re-read environment variables to handle dynamic changes
    this.apiKey = process.env.OPENAI_API_KEY || null
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1'
    this.timeout = options.timeout || 30000 // 30 seconds
    this.retryAttempts = options.retryAttempts || 2
    this.defaultModel = process.env.OPENAI_GPT_MODEL || 'gpt-4.1-mini'
  }

  /**
   * Check if the AI service is properly configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0
  }

  /**
   * Generate a completion using OpenAI GPT
   */
  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Validate input
    const validation = this.validateCompletionRequest(request)
    if (!validation.valid) {
      return {
        success: false,
        content: null,
        error: {
          type: 'validation',
          message: validation.error || 'Invalid request parameters'
        }
      }
    }

    // Check if service is configured
    if (!this.isConfigured()) {
      return {
        success: false,
        content: null,
        error: {
          type: 'api',
          message: 'OpenAI API key not configured'
        }
      }
    }

    // Prepare request
    const payload = {
      model: request.model || this.defaultModel,
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature ?? 0.7,
      top_p: request.topP ?? 1,
      presence_penalty: request.presencePenalty ?? 0,
      frequency_penalty: request.frequencyPenalty ?? 0,
    }

    // Make API call with retry logic
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          
          // Handle rate limiting with exponential backoff
          if (response.status === 429 && attempt < this.retryAttempts) {
            const retryAfter = parseInt(response.headers.get('retry-after') || '1')
            await this.delay(Math.min(retryAfter * 1000, 2 ** attempt * 1000))
            continue
          }

          return {
            success: false,
            content: null,
            error: {
              type: response.status === 429 ? 'rate_limit' : 'api',
              message: errorData.error?.message || `API Error: ${response.status}`,
              details: errorData
            }
          }
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content?.trim() || null

        return {
          success: true,
          content,
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
          }
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            content: null,
            error: {
              type: 'timeout',
              message: `Request timed out after ${this.timeout}ms`
            }
          }
        }

        // If this is the last attempt, return the error
        if (attempt === this.retryAttempts) {
          return {
            success: false,
            content: null,
            error: {
              type: 'network',
              message: error instanceof Error ? error.message : 'Network error'
            }
          }
        }

        // Wait before retrying
        await this.delay(2 ** attempt * 1000)
      }
    }

    // Should not reach here, but just in case
    return {
      success: false,
      content: null,
      error: {
        type: 'api',
        message: 'Unexpected error in API call'
      }
    }
  }

  /**
   * Generate personalized tasks based on user context
   */
  async generateTasks(request: TaskGenerationRequest): Promise<TaskGenerationResponse> {
    // Validate input
    const validation = this.validateTaskGenerationRequest(request)
    if (!validation.valid) {
      return {
        success: false,
        tasks: [],
        error: {
          type: 'validation',
          message: validation.error || 'Invalid task generation request'
        }
      }
    }

    try {
      // Build context-aware prompt
      const prompt = this.buildTaskGenerationPrompt(request)

      // Generate completion
      const completion = await this.generateCompletion({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: this.getTaskGenerationSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        maxTokens: 1000,
        temperature: 0.8 // Higher creativity for task generation
      })

      if (!completion.success || !completion.content) {
        return {
          success: false,
          tasks: [],
          error: {
            type: 'api',
            message: completion.error?.message || 'Failed to generate tasks'
          }
        }
      }

      // Parse and validate the generated tasks
      const tasks = this.parseGeneratedTasks(completion.content)
      
      return {
        success: true,
        tasks
      }

    } catch (error) {
      return {
        success: false,
        tasks: [],
        error: {
          type: 'processing',
          message: error instanceof Error ? error.message : 'Error processing task generation'
        }
      }
    }
  }

  /**
   * Process journal conversation for metadata extraction and XP awards
   */
  async processJournal(request: JournalProcessingRequest): Promise<JournalProcessingResponse> {
    // Validate input
    const validation = this.validateJournalProcessingRequest(request)
    if (!validation.valid) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: validation.error || 'Invalid journal processing request'
        }
      }
    }

    try {
      // Process metadata extraction
      const metadataPrompt = this.buildJournalMetadataPrompt(request)
      const metadataCompletion = await this.generateCompletion({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: this.getJournalMetadataSystemPrompt()
          },
          {
            role: 'user',
            content: metadataPrompt
          }
        ],
        maxTokens: 800,
        temperature: 0.3 // Lower temperature for more consistent metadata
      })

      // Process XP awards
      const xpPrompt = this.buildJournalXPPrompt(request)
      const xpCompletion = await this.generateCompletion({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: this.getJournalXPSystemPrompt()
          },
          {
            role: 'user',
            content: xpPrompt
          }
        ],
        maxTokens: 600,
        temperature: 0.2 // Very low temperature for consistent XP evaluation
      })

      if (!metadataCompletion.success || !xpCompletion.success) {
        return {
          success: false,
          error: {
            type: 'api',
            message: 'Failed to process journal entries'
          }
        }
      }

      // Parse responses
      const metadata = this.parseJournalMetadata(metadataCompletion.content!)
      const xpAwards = this.parseJournalXP(xpCompletion.content!)

      return {
        success: true,
        metadata,
        xpAwards
      }

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'processing',
          message: error instanceof Error ? error.message : 'Error processing journal'
        }
      }
    }
  }

  // Private helper methods

  private validateCompletionRequest(request: AICompletionRequest): { valid: boolean; error?: string } {
    if (!request.messages || request.messages.length === 0) {
      return { valid: false, error: 'Messages array is required and cannot be empty' }
    }

    if (!request.maxTokens || request.maxTokens <= 0) {
      return { valid: false, error: 'maxTokens must be a positive number' }
    }

    if (request.maxTokens > 4096) {
      return { valid: false, error: 'maxTokens cannot exceed 4096' }
    }

    return { valid: true }
  }

  private validateTaskGenerationRequest(request: TaskGenerationRequest): { valid: boolean; error?: string } {
    if (!request.userId || request.userId.trim().length === 0) {
      return { valid: false, error: 'userId is required' }
    }

    if (!request.context) {
      return { valid: false, error: 'context is required' }
    }

    if (!request.taskCount || request.taskCount <= 0) {
      return { valid: false, error: 'taskCount must be a positive number' }
    }

    if (!request.taskTypes || request.taskTypes.length === 0) {
      return { valid: false, error: 'taskTypes array cannot be empty' }
    }

    return { valid: true }
  }

  private validateJournalProcessingRequest(request: JournalProcessingRequest): { valid: boolean; error?: string } {
    if (!request.userId || request.userId.trim().length === 0) {
      return { valid: false, error: 'userId is required' }
    }

    if (!request.conversation || request.conversation.length === 0) {
      return { valid: false, error: 'conversation array is required and cannot be empty' }
    }

    if (!request.characterStats || request.characterStats.length === 0) {
      return { valid: false, error: 'characterStats array is required and cannot be empty' }
    }

    return { valid: true }
  }

  private buildTaskGenerationPrompt(request: TaskGenerationRequest): string {
    const { context, taskCount, taskTypes, constraints } = request

    let prompt = `Generate ${taskCount} personalized tasks for a D&D life gamification app user.

Character: ${context.characterClass}${context.characterBackstory ? ` - ${context.characterBackstory}` : ''}

Task Types Needed: ${taskTypes.join(', ')}

`

    if (context.userGoals && context.userGoals.length > 0) {
      prompt += `User Goals: ${context.userGoals.join(', ')}\n\n`
    }

    if (context.weather) {
      prompt += `Current Weather: ${context.weather.condition}, ${context.weather.temperature}°F\n\n`
    }

    if (context.familyMembers && context.familyMembers.length > 0) {
      prompt += `Family Members:\n`
      context.familyMembers.forEach(member => {
        prompt += `- ${member.name} (age ${member.age}): interests in ${member.interests.join(', ')}\n`
      })
      prompt += '\n'
    }

    if (context.projects && context.projects.length > 0) {
      prompt += `Projects:\n`
      context.projects.forEach(project => {
        prompt += `- ${project.title} (Status: ${project.status}${project.dueDate ? `, Due: ${project.dueDate}` : ''}): ${project.description || 'No description'}\n`
      })
      prompt += '\n'
    }

    if (constraints) {
      prompt += `Constraints:\n`
      if (constraints.avoidOutdoor) prompt += `- Avoid outdoor activities\n`
      if (constraints.preferredTime) prompt += `- Preferred time: ${constraints.preferredTime}\n`
      if (constraints.maxDifficulty) prompt += `- Maximum difficulty: ${constraints.maxDifficulty}\n`
      prompt += '\n'
    }

    if (context.patterns && context.patterns.length > 0) {
      const goodPatterns = context.patterns.filter(p => !p.shouldAvoid && p.confidence > 0.6)
      if (goodPatterns.length > 0) {
        prompt += `User Preferences (based on history):\n`
        goodPatterns.forEach(pattern => {
          prompt += `- ${pattern.key} (confidence: ${Math.round(pattern.confidence * 100)}%)\n`
        })
        prompt += '\n'
      }
    }

    prompt += `Please generate exactly ${taskCount} tasks that fit the character and context.`

    return prompt
  }

  private buildJournalMetadataPrompt(request: JournalProcessingRequest): string {
    const conversationText = request.conversation
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    return `Extract metadata from this journal conversation:

${conversationText}

Available character stats: ${request.characterStats.join(', ')}

Please extract: summary, synopsis, title, content tags, and relevant character stat tags.`
  }

  private buildJournalXPPrompt(request: JournalProcessingRequest): string {
    const conversationText = request.conversation
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    return `Analyze this journal conversation for XP awards:

${conversationText}

Available character stats: ${request.characterStats.join(', ')}

Award positive or negative XP (5-50 points) based on actions, growth, and reflection shown.`
  }

  private getTaskGenerationSystemPrompt(): string {
    return `You are a D&D Dungeon Master creating personalized daily tasks for a life gamification app. 

Create tasks that:
- Match the user's character class and backstory
- Consider their goals, family, and preferences
- Account for weather and constraints
- Are achievable in 30-120 minutes
- Award 15-50 XP based on difficulty
- Target specific character stats

Respond with valid JSON in this exact format:
{
  "tasks": [
    {
      "type": "adventure|family",
      "title": "Short, engaging title",
      "description": "Clear, actionable description",
      "targetStats": ["Stat Name 1", "Stat Name 2"],
      "estimatedXp": 25,
      "difficulty": "easy|medium|hard",
      "reasoning": "Why this task fits the user"
    }
  ]
}

Common character stats: Adventure Spirit, Family Bonding, Physical Fitness, Creative Expression, Social Connection, Professional Growth, Mental Health, Emotional Intelligence`
  }

  private getJournalMetadataSystemPrompt(): string {
    return `You are processing journal entries for a D&D life gamification app. Extract metadata to help users track their journey.

Guidelines:
- Summary: Rewrite the conversation as a cohesive first-person narrative
- Synopsis: 1-2 sentences capturing the essence
- Title: 4-8 words describing the day/event
- Content tags: 3-6 mood/activity/theme tags (prefer existing: happy, adventure, family, work, health, creative, social, challenge, growth, reflection)
- Character stat tags: Only use stats that are clearly relevant from the provided list

Respond with valid JSON:
{
  "summary": "First-person narrative of the conversation",
  "synopsis": "Brief 1-2 sentence summary",
  "title": "Short descriptive title",
  "contentTags": ["tag1", "tag2", "tag3"],
  "characterStatTags": ["Stat Name 1", "Stat Name 2"]
}`
  }

  private getJournalXPSystemPrompt(): string {
    return `You are awarding XP based on journal entries in a D&D life gamification app.

Guidelines:
- Award positive XP (5-50) for: growth, effort, positive actions, learning, helping others
- Award negative XP (-5 to -25) for: regressive behavior, harm to relationships, avoiding responsibility
- Be generous with small positive XP for reflection and honesty
- Consider context - negative events can still earn positive XP if handled well

Respond with valid JSON:
{
  "xpAwards": [
    {
      "statCategory": "Character Stat Name",
      "xpChange": 15,
      "reasoning": "Brief explanation for the award"
    }
  ]
}`
  }

  private parseGeneratedTasks(content: string): GeneratedTask[] {
    try {
      // Clean up the content - remove any markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      
      const parsed = JSON.parse(cleanContent)
      
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid task format: tasks array not found')
      }

      return parsed.tasks.map((task: any) => ({
        type: task.type || 'adventure',
        title: task.title || 'Generated Task',
        description: task.description || 'Complete this task',
        targetStats: Array.isArray(task.targetStats) ? task.targetStats : ['Adventure Spirit'],
        estimatedXp: typeof task.estimatedXp === 'number' ? task.estimatedXp : 20,
        difficulty: ['easy', 'medium', 'hard'].includes(task.difficulty) ? task.difficulty : 'medium',
        reasoning: task.reasoning || 'AI-generated task'
      }))

    } catch (error) {
      console.error('Error parsing generated tasks:', error)
      // Return fallback tasks if parsing fails
      return [
        {
          type: 'adventure',
          title: 'Daily Adventure',
          description: 'Explore something new today',
          targetStats: ['Adventure Spirit'],
          estimatedXp: 20,
          difficulty: 'medium',
          reasoning: 'Fallback task due to parsing error'
        }
      ]
    }
  }

  private parseJournalMetadata(content: string): JournalMetadata {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)

      return {
        summary: parsed.summary || 'Journal entry processed',
        synopsis: parsed.synopsis || 'Daily reflection',
        title: parsed.title || 'Journal Entry',
        contentTags: Array.isArray(parsed.contentTags) ? parsed.contentTags : ['reflection'],
        characterStatTags: Array.isArray(parsed.characterStatTags) ? parsed.characterStatTags : []
      }

    } catch (error) {
      console.error('Error parsing journal metadata:', error)
      return {
        summary: 'Journal entry was processed but metadata extraction failed',
        synopsis: 'Unable to generate synopsis',
        title: 'Journal Entry',
        contentTags: ['reflection'],
        characterStatTags: []
      }
    }
  }

  private parseJournalXP(content: string): XPAward[] {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)

      if (!parsed.xpAwards || !Array.isArray(parsed.xpAwards)) {
        return []
      }

      return parsed.xpAwards.map((award: any) => ({
        statCategory: award.statCategory || 'Emotional Intelligence',
        xpChange: typeof award.xpChange === 'number' ? award.xpChange : 5,
        reasoning: award.reasoning || 'Journal reflection'
      }))

    } catch (error) {
      console.error('Error parsing journal XP awards:', error)
      return [
        {
          statCategory: 'Emotional Intelligence',
          xpChange: 5,
          reasoning: 'Reflection and self-awareness shown in journal'
        }
      ]
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Task 4.7: Generate enhanced tasks with intelligent XP estimation and target stat specification
   */
  async generateEnhancedDailyTasks(request: TaskGenerationRequest): Promise<{
    success: boolean
    data?: EnhancedTaskGenerationResponse
    error?: { type: string; message: string }
  }> {
    try {
      // Build enhanced prompt for more intelligent task generation
      const enhancedPrompt = this.buildEnhancedTaskGenerationPrompt(request.context)
      
      const completion = await this.generateCompletion({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: this.getEnhancedTaskGenerationSystemPrompt()
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        maxTokens: 1200,
        temperature: 0.7
      })

      if (!completion.success || !completion.content) {
        return {
          success: false,
          error: {
            type: 'generation_failed',
            message: completion.error?.message || 'Failed to generate enhanced tasks'
          }
        }
      }

      // Parse the enhanced response
      const enhancedTasks = this.parseEnhancedTaskGeneration(completion.content)
      
      // Apply intelligent XP estimation
      const adventureTask = {
        ...this.enhanceTaskWithXPCalculation(enhancedTasks.adventureTask, request.context),
        weatherInfluence: enhancedTasks.adventureTask.weatherInfluence,
        goalAlignment: enhancedTasks.adventureTask.goalAlignment
      }
      
      const familyTask = {
        ...this.enhanceTaskWithXPCalculation(enhancedTasks.familyTask, request.context),
        targetFamilyMember: enhancedTasks.familyTask.targetFamilyMember,
        interactionType: enhancedTasks.familyTask.interactionType,
        overdueNotes: enhancedTasks.familyTask.overdueNotes
      }

      return {
        success: true,
        data: {
          adventureTask,
          familyTask,
          generationMetadata: enhancedTasks.generationMetadata
        }
      }

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'processing',
          message: error instanceof Error ? error.message : 'Error generating enhanced tasks'
        }
      }
    }
  }

  /**
   * Calculate intelligent XP estimation based on task difficulty, stat levels, and complexity
   */
  private enhanceTaskWithXPCalculation(
    task: EnhancedTaskSpecification, 
    context: TaskGenerationContext
  ): EnhancedTaskSpecification {
    // Base XP values by difficulty
    const baseXpByDifficulty = {
      easy: 15,
      medium: 25,
      hard: 40,
      epic: 60
    }

    let estimatedXp = baseXpByDifficulty[task.difficulty]

    // Adjust based on target stat levels (higher level stats get more XP)
    const statLevelMultiplier = task.targetStats.reduce((multiplier, targetStat) => {
      const contextStat = context.characterStats?.find(s => s.category === targetStat.category)
      if (contextStat) {
        // Higher level stats require more XP (1.0x at level 1, 1.5x at level 10)
        const levelMultiplier = 1 + (contextStat.currentLevel - 1) * 0.05
        return multiplier + (levelMultiplier * targetStat.xpWeight)
      }
      return multiplier + targetStat.xpWeight
    }, 0) / task.targetStats.length

    estimatedXp = Math.round(estimatedXp * statLevelMultiplier)

    // Time-based adjustment
    if (task.timeEstimate.includes('hour')) {
      estimatedXp = Math.round(estimatedXp * 1.5) // Longer tasks get bonus XP
    }

    // Prerequisites bonus
    if (task.prerequisites && task.prerequisites.length > 0) {
      estimatedXp = Math.round(estimatedXp * 1.2) // Complex tasks with prep get bonus
    }

    return {
      ...task,
      estimatedXp: Math.max(5, Math.min(100, estimatedXp)) // Cap between 5-100 XP
    }
  }

  /**
   * Build enhanced prompt for more intelligent task generation
   */
  private buildEnhancedTaskGenerationPrompt(context: TaskGenerationContext): string {
    let prompt = `Generate exactly 2 personalized daily tasks for a ${context.characterClass} character.

CHARACTER CONTEXT:
- Class: ${context.characterClass}
- Backstory: ${context.characterBackstory || 'Not specified'}
- Daily Focus: ${context.dailyFocus || 'General improvement'}`

    // Character stats with levels for XP targeting
    if (context.characterStats && context.characterStats.length > 0) {
      prompt += '\n\nCURRENT STATS & LEVELS:'
      context.characterStats.forEach(stat => {
        prompt += `\n- ${stat.category}: Level ${stat.currentLevel} (${stat.totalXp} total XP)`
      })
    }

    // User goals for alignment
    if (context.userGoals && context.userGoals.length > 0) {
      prompt += '\n\nCURRENT GOALS:\n' + context.userGoals.map(goal => `- ${goal}`).join('\n')
    }

    // Family context with overdue prioritization
    if (context.familyMembers && context.familyMembers.length > 0) {
      prompt += '\n\nFAMILY MEMBERS:'
      context.familyMembers.forEach(member => {
        prompt += `\n- ${member.name} (${member.age} years old, interests: ${member.interests?.join(', ') || 'unspecified'})`
        if (member.isOverdue) {
          prompt += ` [OVERDUE: ${member.daysSinceLastInteraction} days since last interaction - HIGH PRIORITY]`
        }
      })
    }

    // Task 4.10: Project context for AI influence (but not dashboard display)
    if (context.projects && context.projects.length > 0) {
      prompt += '\n\nACTIVE PROJECTS (for context, not direct task creation):'
      context.projects.forEach(project => {
        prompt += `\n- "${project.title}"`
        if (project.description) {
          prompt += ` - ${project.description}`
        }
        if (project.dueDate) {
          const dueDate = new Date(project.dueDate)
          const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (daysUntilDue <= 7) {
            prompt += ` [DUE SOON: ${daysUntilDue} days]`
          }
        }
      })
      prompt += '\nNOTE: Generate tasks that complement project work or provide balance, NOT direct project tasks.'
    }

    // Weather influence
    if (context.weather) {
      prompt += `\n\nCURRENT WEATHER: ${context.weather.condition}, ${context.weather.temperature}°F`
    }

    // Task history for learning
    if (context.taskHistory && context.taskHistory.length > 0) {
      prompt += '\n\nRECENT TASK HISTORY (for learning preferences):'
      context.taskHistory.slice(0, 3).forEach(task => {
        prompt += `\n- "${task.title}" (${task.completed ? 'Completed' : 'Skipped'})`
        if (task.feedback) {
          prompt += ` - Feedback: ${task.feedback}`
        }
      })
    }

    prompt += `

REQUIREMENTS:
1. Generate exactly 2 tasks: 1 ADVENTURE task and 1 FAMILY task
2. For each task, specify target stats with XP weights (0.1-1.0) and reasoning
3. Choose appropriate difficulty: easy (15min), medium (30-45min), hard (1+ hour), epic (2+ hours)
4. Provide time estimates and any prerequisites needed
5. Explain reasoning for task design and stat targeting
6. FAMILY TASK: If family members are overdue, prioritize them with specific interaction types

RESPONSE FORMAT (JSON):
{
  "adventureTask": {
    "title": "Engaging title",
    "description": "Detailed description with specific actions",
    "targetStats": [
      {
        "category": "Stat name",
        "xpWeight": 0.8,
        "reasoning": "Why this stat benefits"
      }
    ],
    "difficulty": "medium",
    "timeEstimate": "30-45 minutes",
    "prerequisites": ["Optional preparation needed"],
    "reasoning": "Why this task fits the character and context",
    "weatherInfluence": "How weather influenced this choice",
    "goalAlignment": "How this supports current goals"
  },
  "familyTask": {
    "title": "Family-focused title",
    "description": "Detailed family interaction description",
    "targetStats": [
      {
        "category": "Social Connection",
        "xpWeight": 1.0,
        "reasoning": "Family bonding primary benefit"
      }
    ],
    "difficulty": "easy",
    "timeEstimate": "15-30 minutes",
    "targetFamilyMember": "Specific family member name",
    "interactionType": "quality_time",
    "overdueNotes": "Notes if addressing overdue interaction",
    "reasoning": "Why this family interaction is recommended"
  },
  "generationMetadata": {
    "contextFactorsConsidered": ["List of factors that influenced generation"],
    "alternativesConsidered": ["Other task options considered"],
    "adaptationsFromHistory": ["How past feedback influenced choices"]
  }
}`

    return prompt
  }

  /**
   * System prompt for enhanced task generation
   */
  private getEnhancedTaskGenerationSystemPrompt(): string {
    return `You are an expert life coach and game designer specializing in D&D-style character development and family relationship building.

Your role is to generate personalized daily tasks that:
1. Match the character's class, backstory, and current stat progression
2. Align with their stated goals and daily focus
3. Consider current weather and family interaction needs
4. Learn from past task completion patterns and feedback
5. Provide appropriate difficulty scaling based on current levels
6. Prioritize overdue family interactions while maintaining engagement
7. Be influenced by active projects but NOT create direct project tasks

STAT TARGETING PRINCIPLES:
- Weight stats 0.1-1.0 based on how much they should benefit
- Higher-level stats need more challenging tasks for meaningful progression
- Balance familiar comfortable tasks with growth-edge challenges
- Consider stat synergies (multiple stats can benefit from one activity)

PROJECT INFLUENCE PRINCIPLES (Task 4.10):
- Use active projects as CONTEXT, not direct task sources
- Generate tasks that complement project work (e.g., creative breaks, physical balance)
- Consider project stress levels and recommend balancing activities
- If projects have tight deadlines, suggest stress-relief or energy-restoration tasks
- Create tasks that build skills indirectly useful for projects
- NEVER generate tasks that are direct project work items

FAMILY INTERACTION PRINCIPLES:
- Prioritize overdue family members (high priority if 7+ days overdue)
- Match interaction types to family member interests and age
- Create meaningful bonding opportunities, not just "check-ins"
- Consider family schedules and energy levels

XP ESTIMATION GUIDELINES:
- Easy (15min): 10-20 XP base
- Medium (30-45min): 20-35 XP base  
- Hard (1+ hour): 35-50 XP base
- Epic (2+ hours): 50-75 XP base
- Adjust based on stat levels, complexity, and prerequisites

Be creative, engaging, and consider the full context to create tasks that feel personally meaningful and achievable.`
  }

  /**
   * Parse enhanced task generation response
   */
  private parseEnhancedTaskGeneration(content: string): EnhancedTaskGenerationResponse {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)

      return {
        adventureTask: {
          title: parsed.adventureTask?.title || 'Adventure Task',
          description: parsed.adventureTask?.description || 'Complete an adventure activity',
          targetStats: parsed.adventureTask?.targetStats || [{ category: 'Adventure Spirit', xpWeight: 1.0, reasoning: 'Default adventure benefit' }],
          estimatedXp: parsed.adventureTask?.estimatedXp || 25,
          difficulty: parsed.adventureTask?.difficulty || 'medium',
          timeEstimate: parsed.adventureTask?.timeEstimate || '30-45 minutes',
          prerequisites: parsed.adventureTask?.prerequisites,
          reasoning: parsed.adventureTask?.reasoning || 'Adventure task for character development',
          contextualNotes: parsed.adventureTask?.contextualNotes,
          weatherInfluence: parsed.adventureTask?.weatherInfluence,
          goalAlignment: parsed.adventureTask?.goalAlignment
        },
        familyTask: {
          title: parsed.familyTask?.title || 'Family Time',
          description: parsed.familyTask?.description || 'Spend quality time with family',
          targetStats: parsed.familyTask?.targetStats || [{ category: 'Social Connection', xpWeight: 1.0, reasoning: 'Family bonding benefit' }],
          estimatedXp: parsed.familyTask?.estimatedXp || 20,
          difficulty: parsed.familyTask?.difficulty || 'easy',
          timeEstimate: parsed.familyTask?.timeEstimate || '15-30 minutes',
          prerequisites: parsed.familyTask?.prerequisites,
          reasoning: parsed.familyTask?.reasoning || 'Family interaction for social development',
          contextualNotes: parsed.familyTask?.contextualNotes,
          targetFamilyMember: parsed.familyTask?.targetFamilyMember,
          interactionType: parsed.familyTask?.interactionType || 'quality_time',
          overdueNotes: parsed.familyTask?.overdueNotes
        },
        generationMetadata: {
          contextFactorsConsidered: parsed.generationMetadata?.contextFactorsConsidered || ['Character class', 'Current stats'],
          alternativesConsidered: parsed.generationMetadata?.alternativesConsidered,
          adaptationsFromHistory: parsed.generationMetadata?.adaptationsFromHistory
        }
      }

    } catch (error) {
      console.error('Error parsing enhanced task generation:', error)
      // Return fallback response
      return {
        adventureTask: {
          title: 'Daily Adventure',
          description: 'Embark on a personal growth adventure today',
          targetStats: [{ category: 'Adventure Spirit', xpWeight: 1.0, reasoning: 'Adventure activities build courage and curiosity' }],
          estimatedXp: 25,
          difficulty: 'medium',
          timeEstimate: '30 minutes',
          reasoning: 'Adventure task for character development'
        },
        familyTask: {
          title: 'Family Connection',
          description: 'Connect meaningfully with a family member',
          targetStats: [{ category: 'Social Connection', xpWeight: 1.0, reasoning: 'Family interactions strengthen social bonds' }],
          estimatedXp: 20,
          difficulty: 'easy',
          timeEstimate: '20 minutes',
          interactionType: 'quality_time',
          reasoning: 'Family bonding for social development'
        },
        generationMetadata: {
          contextFactorsConsidered: ['Character development needs', 'Family relationships']
        }
      }
    }
  }

  /**
   * Task 4.8: Process feedback from completed tasks for AI learning and improvement
   */
  async processFeedbackForLearning(request: {
    userId: string
    taskId: string
    feedback: string
    actualXp?: number
    wasCompleted: boolean
    completionNotes?: string
    context: TaskGenerationContext
  }): Promise<{
    success: boolean
    learningInsights?: {
      preferencePatterns: Array<{
        type: 'likes' | 'dislikes' | 'difficulty_preference' | 'time_preference' | 'stat_focus'
        pattern: string
        confidence: number
      }>
      taskAdjustments: Array<{
        aspect: 'difficulty' | 'duration' | 'stat_targeting' | 'content_type'
        recommendation: string
        reasoning: string
      }>
      futureConsiderations: string[]
    }
    error?: { type: string; message: string }
  }> {
    try {
      // Build feedback analysis prompt
      const feedbackPrompt = this.buildFeedbackAnalysisPrompt(request)
      
      const completion = await this.generateCompletion({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: this.getFeedbackAnalysisSystemPrompt()
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        maxTokens: 800,
        temperature: 0.3 // Lower temperature for more analytical processing
      })

      if (!completion.success || !completion.content) {
        return {
          success: false,
          error: {
            type: 'analysis_failed',
            message: completion.error?.message || 'Failed to analyze feedback'
          }
        }
      }

      // Parse feedback analysis
      const learningInsights = this.parseFeedbackAnalysis(completion.content)

      return {
        success: true,
        learningInsights
      }

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'processing',
          message: error instanceof Error ? error.message : 'Error processing feedback'
        }
      }
    }
  }

  /**
   * Build feedback analysis prompt for learning patterns
   */
  private buildFeedbackAnalysisPrompt(request: {
    userId: string
    taskId: string
    feedback: string
    actualXp?: number
    wasCompleted: boolean
    completionNotes?: string
    context: TaskGenerationContext
  }): string {
    let prompt = `Analyze user feedback for learning patterns and future task generation improvements.

TASK CONTEXT:
- User Character: ${request.context.characterClass}
- Task Completion: ${request.wasCompleted ? 'COMPLETED' : 'NOT COMPLETED'}
- User Feedback: "${request.feedback}"`

    if (request.actualXp) {
      prompt += `\n- Actual XP Awarded: ${request.actualXp}`
    }

    if (request.completionNotes) {
      prompt += `\n- Completion Notes: "${request.completionNotes}"`
    }

    // Add character stats context for difficulty assessment
    if (request.context.characterStats) {
      prompt += '\n\nCURRENT STATS:'
      request.context.characterStats.forEach(stat => {
        prompt += `\n- ${stat.category}: Level ${stat.currentLevel}`
      })
    }

    // Add recent task history for pattern recognition
    if (request.context.taskHistory) {
      prompt += '\n\nRECENT TASK HISTORY:'
      request.context.taskHistory.slice(0, 3).forEach(task => {
        prompt += `\n- "${task.title}" (${task.completed ? 'Completed' : 'Skipped'})`
        if (task.feedback) {
          prompt += ` - Previous feedback: ${task.feedback}`
        }
      })
    }

    prompt += `

ANALYSIS REQUIREMENTS:
1. Identify user preference patterns (likes, dislikes, optimal difficulty/timing)
2. Suggest task generation adjustments for future improvements
3. Extract insights about user motivation and engagement
4. Consider completion patterns and feedback sentiment
5. Recommend specific changes to task difficulty, duration, content type, or stat targeting

RESPONSE FORMAT (JSON):
{
  "preferencePatterns": [
    {
      "type": "likes",
      "pattern": "Specific preference identified",
      "confidence": 0.8
    }
  ],
  "taskAdjustments": [
    {
      "aspect": "difficulty",
      "recommendation": "Specific adjustment to make",
      "reasoning": "Why this change would help"
    }
  ],
  "futureConsiderations": [
    "Key considerations for future task generation"
  ]
}`

    return prompt
  }

  /**
   * System prompt for feedback analysis
   */
  private getFeedbackAnalysisSystemPrompt(): string {
    return `You are an expert data analyst specializing in user behavior and gamification patterns.

Your role is to analyze user feedback on completed (or uncompleted) tasks to identify:
1. User preference patterns and motivational triggers
2. Optimal task difficulty and duration preferences  
3. Content types and activity styles that engage the user
4. Stat targeting preferences and character development patterns
5. Time-of-day and context preferences for different activities

ANALYSIS PRINCIPLES:
- Look for sentiment indicators in feedback (positive/negative language)
- Consider completion vs. non-completion patterns
- Identify difficulty mismatches (too easy = bored, too hard = overwhelmed)
- Recognize time constraint issues and scheduling preferences
- Detect stat targeting misalignment or preferences
- Note family interaction preferences and successful patterns

CONFIDENCE SCORING:
- 0.9-1.0: Strong pattern based on explicit feedback
- 0.7-0.8: Clear pattern based on implied preferences
- 0.5-0.6: Moderate pattern requiring more data
- 0.3-0.4: Weak pattern, tentative insight

ADJUSTMENT CATEGORIES:
- difficulty: Task complexity and challenge level
- duration: Time estimates and task length
- stat_targeting: Which stats to focus on or avoid
- content_type: Activity styles, indoor/outdoor, social/solo

Provide actionable insights that will improve future task generation quality and user engagement.`
  }

  /**
   * Parse feedback analysis response
   */
  private parseFeedbackAnalysis(content: string): {
    preferencePatterns: Array<{
      type: 'likes' | 'dislikes' | 'difficulty_preference' | 'time_preference' | 'stat_focus'
      pattern: string
      confidence: number
    }>
    taskAdjustments: Array<{
      aspect: 'difficulty' | 'duration' | 'stat_targeting' | 'content_type'
      recommendation: string
      reasoning: string
    }>
    futureConsiderations: string[]
  } {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)

      return {
        preferencePatterns: parsed.preferencePatterns || [],
        taskAdjustments: parsed.taskAdjustments || [],
        futureConsiderations: parsed.futureConsiderations || []
      }

    } catch (error) {
      console.error('Error parsing feedback analysis:', error)
      return {
        preferencePatterns: [],
        taskAdjustments: [],
        futureConsiderations: ['Unable to parse feedback analysis - manual review recommended']
      }
    }
  }

  /**
   * Task 4.9: Generate tasks with daily focus influence for priority alignment
   */
  async generateFocusInfluencedTasks(request: TaskGenerationRequest & {
    dailyFocus?: string
    focusWeight?: number // 0.1-1.0, how much to weight the daily focus
  }): Promise<{
    success: boolean
    data?: EnhancedTaskGenerationResponse
    error?: { type: string; message: string }
  }> {
    try {
      // Enhance context with daily focus prioritization
      const focusEnhancedContext = this.enhanceContextWithDailyFocus(request.context, request.dailyFocus, request.focusWeight || 0.7)
      
      // Generate tasks with focus influence
      const focusInfluencedRequest = {
        ...request,
        context: focusEnhancedContext
      }

      return await this.generateEnhancedDailyTasks(focusInfluencedRequest)

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'processing',
          message: error instanceof Error ? error.message : 'Error generating focus-influenced tasks'
        }
      }
    }
  }

  /**
   * Enhance task generation context with daily focus prioritization
   */
  private enhanceContextWithDailyFocus(
    context: TaskGenerationContext, 
    dailyFocus?: string, 
    focusWeight: number = 0.7
  ): TaskGenerationContext {
    if (!dailyFocus) {
      return context
    }

    // Create focus-enhanced context
    const enhanced: TaskGenerationContext = {
      ...context,
      dailyFocus
    }

    // Boost stats that align with daily focus
    if (enhanced.characterStats) {
      enhanced.characterStats = enhanced.characterStats.map(stat => {
        // Check if stat aligns with daily focus (simple keyword matching for now)
        const focusKeywords = dailyFocus.toLowerCase().split(' ')
        const statKeywords = stat.category.toLowerCase().split(' ')
        
        const hasAlignment = focusKeywords.some(focusWord => 
          statKeywords.some(statWord => 
            statWord.includes(focusWord) || focusWord.includes(statWord)
          )
        )

        if (hasAlignment) {
          return {
            ...stat,
            // Boost this stat's priority for focus alignment
            focusAlignment: focusWeight,
            description: stat.description ? `${stat.description} [DAILY FOCUS ALIGNED]` : `[DAILY FOCUS: ${dailyFocus}]`
          }
        }

        return stat
      })
    }

    // Add focus-related goals if not already present
    if (enhanced.userGoals) {
      const focusGoal = `Today's focus: ${dailyFocus}`
      if (!enhanced.userGoals.includes(focusGoal)) {
        enhanced.userGoals = [focusGoal, ...enhanced.userGoals]
      }
    } else {
      enhanced.userGoals = [`Today's focus: ${dailyFocus}`]
    }

    return enhanced
  }
}

/**
 * Enhanced task specification and generation for AI Service
 */

export interface EnhancedTaskSpecification {
  title: string
  description: string
  targetStats: Array<{
    category: string
    xpWeight: number // 0.1 to 1.0 representing how much this stat should benefit
    reasoning: string // Why this stat is targeted
  }>
  estimatedXp: number
  difficulty: 'easy' | 'medium' | 'hard' | 'epic'
  timeEstimate: string // e.g., "15-30 minutes", "1-2 hours"
  prerequisites?: string[] // Any requirements or preparations needed
  reasoning: string // AI's reasoning for this task design
  contextualNotes?: string // Any special considerations
}

export interface EnhancedTaskGenerationResponse {
  adventureTask: EnhancedTaskSpecification & {
    weatherInfluence?: string // How weather influenced this task
    goalAlignment?: string // How this aligns with user goals
  }
  familyTask: EnhancedTaskSpecification & {
    targetFamilyMember?: string
    interactionType: 'quality_time' | 'activity' | 'conversation' | 'support' | 'shared_interest'
    overdueNotes?: string // Notes if this family member interaction is overdue
  }
  generationMetadata: {
    contextFactorsConsidered: string[]
    alternativesConsidered?: string[]
    adaptationsFromHistory?: string[]
  }
}
