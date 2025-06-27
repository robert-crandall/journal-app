import { env } from '../env'

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
  userGoals?: string[]
  familyMembers?: Array<{
    name: string
    age: number
    interests: string[]
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
}
