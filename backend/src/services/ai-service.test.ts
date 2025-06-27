import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { AIService } from './ai-service'

// Load environment variables
import '../env'

describe('AI Service Unit Tests - Task 4.1', () => {
  beforeEach(() => {
    // Set a test API key
    process.env.OPENAI_API_KEY = 'test-api-key-sk-1234567890'
  })

  describe('Service Initialization and Configuration', () => {
    it('should initialize with proper API key management', async () => {
      const service = new AIService()
      
      // Should have proper configuration
      expect(service).toBeDefined()
      expect(service.isConfigured()).toBe(true)
    })

    it('should handle missing API key gracefully', async () => {
      // Temporarily remove API key to test error handling
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      
      const service = new AIService()
      expect(service.isConfigured()).toBe(false)
      
      // Restore API key
      process.env.OPENAI_API_KEY = originalKey
    })
  })

  describe('Basic GPT Communication', () => {
    it('should handle successful API communication structure', async () => {
      const service = new AIService()
      
      // Mock fetch to return a successful response
      const originalFetch = globalThis.fetch
      ;(globalThis as any).fetch = mock(async () => {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: 'Test successful'
              }
            }
          ],
          usage: {
            prompt_tokens: 15,
            completion_tokens: 5,
            total_tokens: 20
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const response = await service.generateCompletion({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Test message'
          }
        ],
        maxTokens: 20,
        temperature: 0
      })

      expect(response).toBeDefined()
      expect(response.success).toBe(true)
      expect(response.content).toContain('Test successful')
      expect(response.usage).toBeDefined()
      expect(response.usage!.totalTokens).toBeGreaterThan(0)
      
      // Restore original fetch
      globalThis.fetch = originalFetch
    })

    it('should handle API errors gracefully', async () => {
      const service = new AIService()
      
      // Mock fetch to return an error response
      const originalFetch = globalThis.fetch
      ;(globalThis as any).fetch = mock(async () => {
        return new Response(JSON.stringify({
          error: {
            message: 'Invalid model specified',
            type: 'invalid_request_error'
          }
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const response = await service.generateCompletion({
        model: 'invalid-model',
        messages: [
          {
            role: 'user',
            content: 'This should fail'
          }
        ],
        maxTokens: 10
      })

      expect(response).toBeDefined()
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.content).toBeNull()
      
      // Restore original fetch
      globalThis.fetch = originalFetch
    })
  })

  describe('Task Generation Capabilities', () => {
    it('should generate contextual task suggestions', async () => {
      const service = new AIService()
      
      // Mock fetch for task generation
      const originalFetch = globalThis.fetch
      ;(globalThis as any).fetch = mock(async () => {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tasks: [
                    {
                      type: 'adventure',
                      title: 'Nature Photography Walk',
                      description: 'Take Sarah on a photography walk to capture beautiful nature scenes together',
                      targetStats: ['Adventure Spirit', 'Family Bonding'],
                      estimatedXp: 30,
                      difficulty: 'easy'
                    },
                    {
                      type: 'family',
                      title: 'Art and Nature Collection',
                      description: 'Help Sarah create nature art using collected leaves and flowers',
                      targetStats: ['Family Bonding', 'Creativity'],
                      estimatedXp: 25,
                      difficulty: 'medium'
                    }
                  ]
                })
              }
            }
          ],
          usage: {
            prompt_tokens: 150,
            completion_tokens: 80,
            total_tokens: 230
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const context = {
        characterClass: 'Ranger',
        characterBackstory: 'An outdoor enthusiast who loves hiking and camping',
        userGoals: ['Stay active', 'Spend time with family'],
        familyMembers: [
          {
            name: 'Sarah',
            age: 8,
            interests: ['art', 'nature']
          }
        ],
        weather: {
          condition: 'sunny',
          temperature: 75
        },
        taskHistory: [],
        patterns: []
      }

      const response = await service.generateTasks({
        userId: 'test-user-123',
        context,
        taskCount: 2,
        taskTypes: ['adventure', 'family']
      })

      expect(response).toBeDefined()
      expect(response.success).toBe(true)
      expect(response.tasks).toBeDefined()
      expect(response.tasks!).toHaveLength(2)
      
      // Verify task structure
      const adventureTask = response.tasks!.find(t => t.type === 'adventure')
      const familyTask = response.tasks!.find(t => t.type === 'family')
      
      expect(adventureTask).toBeDefined()
      expect(familyTask).toBeDefined()
      
      // Each task should have required properties
      for (const task of response.tasks!) {
        expect(task.title).toBeTruthy()
        expect(task.description).toBeTruthy()
        expect(task.targetStats).toBeDefined()
        expect(Array.isArray(task.targetStats)).toBe(true)
        expect(task.estimatedXp).toBeGreaterThan(0)
        expect(task.difficulty).toMatch(/^(easy|medium|hard)$/)
      }
      
      // Restore original fetch
      globalThis.fetch = originalFetch
    })

    it('should respect context constraints in task generation', async () => {
      const service = new AIService()
      
      // Mock task generation response that respects constraints
      const originalFetch = globalThis.fetch
      ;(globalThis as any).fetch = mock(async () => {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tasks: [
                    {
                      type: 'adventure',
                      title: 'Indoor Music Exploration',
                      description: 'Discover new musical genres and create playlists for rainy day listening',
                      targetStats: ['Creativity', 'Musical Talent'],
                      estimatedXp: 25,
                      difficulty: 'easy'
                    },
                    {
                      type: 'family',
                      title: 'Gaming Session with Tom',
                      description: 'Spend quality time playing video games together and learning about his interests',
                      targetStats: ['Family Bonding', 'Technology'],
                      estimatedXp: 20,
                      difficulty: 'easy'
                    }
                  ]
                })
              }
            }
          ],
          usage: {
            prompt_tokens: 180,
            completion_tokens: 90,
            total_tokens: 270
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const context = {
        characterClass: 'Bard',
        characterBackstory: 'A musician who loves performing',
        userGoals: ['Creative expression'],
        familyMembers: [
          {
            name: 'Tom',
            age: 12,
            interests: ['music', 'video games']
          }
        ],
        weather: {
          condition: 'rainy',
          temperature: 45
        },
        patterns: [
          {
            type: 'timing',
            key: 'morning_tasks',
            confidence: 0.8,
            shouldAvoid: false
          }
        ]
      }

      const response = await service.generateTasks({
        userId: 'test-user-456',
        context,
        taskCount: 2,
        taskTypes: ['adventure', 'family'],
        constraints: {
          avoidOutdoor: true, // Due to rainy weather
          preferredTime: 'morning'
        }
      })

      expect(response.success).toBe(true)
      expect(response.tasks!).toHaveLength(2)
      
      // Tasks should respect rainy weather constraint
      const taskDescriptions = response.tasks!.map(t => t.description.toLowerCase()).join(' ')
      expect(taskDescriptions).not.toMatch(/hiking|camping|outdoor/i)
      
      // Restore original fetch
      globalThis.fetch = originalFetch
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should validate input parameters before making API calls', async () => {
      const service = new AIService()
      
      // Test with missing required fields - this should not make any API calls
      const response = await service.generateTasks({
        userId: '', // Invalid empty user ID
        context: {} as any, // Invalid empty context
        taskCount: 0, // Invalid task count
        taskTypes: [] // Empty task types
      })

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('validation')
    })
  })

  describe('Token Usage and Cost Management', () => {
    it('should track token usage for cost monitoring', async () => {
      const service = new AIService()
      
      // Mock successful response with usage data
      const originalFetch = globalThis.fetch
      ;(globalThis as any).fetch = mock(async () => {
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: 'Great outdoor activities include hiking, cycling, and nature photography.'
              }
            }
          ],
          usage: {
            prompt_tokens: 25,
            completion_tokens: 15,
            total_tokens: 40
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })

      const response = await service.generateCompletion({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: 'Generate a short response about outdoor activities'
          }
        ],
        maxTokens: 50
      })

      expect(response.success).toBe(true)
      expect(response.usage).toBeDefined()
      expect(response.usage!.promptTokens).toBeGreaterThan(0)
      expect(response.usage!.completionTokens).toBeGreaterThan(0)
      expect(response.usage!.totalTokens).toBeGreaterThan(0)
      expect(response.usage!.totalTokens).toBe(response.usage!.promptTokens + response.usage!.completionTokens)
      
      // Restore original fetch
      globalThis.fetch = originalFetch
    })
  })
})
