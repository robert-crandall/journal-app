import { describe, it, expect } from 'bun:test'
import type {
  // Re-exported types
  User,
  CharacterStat,
  Experiment,
  DailyTask,
  JournalEntry,
  JournalEntryWithTags,
  ContentTag,
  ToneTag,
  ApiResponse,
  AuthResponse,
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
  CreateCharacterStatInput,
  UpdateCharacterStatInput,
  CreateExperimentInput,
  UpdateExperimentInput,
  CompleteDailyTaskInput,
  CreateJournalEntryInput,
  ContinueConversationInput,
  UpdateJournalEntryInput,
  CreateContentTagInput,
  JwtPayload,
  // Client-specific types
  ApiClient,
  ApiConfig
} from '../src/client'

describe('Client Type Definitions', () => {
  describe('re-exported types availability', () => {
    it('should export User type', () => {
      const user: User = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(user.id).toBe('test-id')
      expect(user.email).toBe('test@example.com')
    })

    it('should export CharacterStat type', () => {
      const stat: CharacterStat = {
        id: 'stat-id',
        userId: 'user-id',
        name: 'Intelligence',
        description: 'Mental prowess',
        currentXp: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(stat.name).toBe('Intelligence')
      expect(stat.currentXp).toBe(100)
    })

    it('should export Experiment type', () => {
      const experiment: Experiment = {
        id: 'exp-id',
        userId: 'user-id',
        title: 'Test Experiment',
        description: 'A test experiment',
        startDate: new Date(),
        endDate: new Date(),
        dailyTaskDescription: 'Daily task',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(experiment.title).toBe('Test Experiment')
    })

    it('should export JournalEntry type', () => {
      const entry: JournalEntry = {
        id: 'entry-id',
        userId: 'user-id',
        title: 'Test Entry',
        summary: 'Test summary',
        synopsis: 'Test synopsis',
        conversationData: {
          messages: [
            { role: 'user', content: 'Hello', timestamp: '2023-01-01T00:00:00Z' }
          ],
          isComplete: false
        },
        entryDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(entry.title).toBe('Test Entry')
      expect(entry.conversationData.messages).toHaveLength(1)
    })

    it('should export input types', () => {
      const createUser: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
      
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'password123'
      }

      expect(createUser.email).toBe('test@example.com')
      expect(loginInput.password).toBe('password123')
    })

    it('should export API response types', () => {
      const apiResponse: ApiResponse<string> = {
        success: true,
        data: 'test data',
        message: 'Success'
      }

      const authResponse: AuthResponse = {
        success: true,
        data: {
          user: {
            id: 'user-id',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          token: 'jwt-token'
        }
      }

      expect(apiResponse.success).toBe(true)
      expect(authResponse.data?.token).toBe('jwt-token')
    })
  })

  describe('ApiClient interface structure', () => {
    it('should define auth endpoints structure', () => {
      // Type-only test - we're checking that the interface compiles
      const mockAuthEndpoints: ApiClient['auth'] = {
        register: async (data: CreateUserInput) => ({ success: true, data: { user: {} as User, token: 'token' } }),
        login: async (data: LoginInput) => ({ success: true, data: { user: {} as User, token: 'token' } }),
        getMe: async () => ({ success: true, data: {} as User }),
        updateMe: async (data: UpdateUserInput) => ({ success: true, data: {} as User }),
        deleteMe: async () => ({ success: true })
      }

      expect(typeof mockAuthEndpoints.register).toBe('function')
      expect(typeof mockAuthEndpoints.login).toBe('function')
      expect(typeof mockAuthEndpoints.getMe).toBe('function')
      expect(typeof mockAuthEndpoints.updateMe).toBe('function')
      expect(typeof mockAuthEndpoints.deleteMe).toBe('function')
    })

    it('should define characterStats endpoints structure', () => {
      const mockCharacterStatsEndpoints: ApiClient['characterStats'] = {
        create: async (data: CreateCharacterStatInput) => ({ success: true, data: {} as CharacterStat }),
        getAll: async () => ({ success: true, data: [] as CharacterStat[] }),
        getById: async (id: string) => ({ success: true, data: {} as CharacterStat }),
        update: async (id: string, data: UpdateCharacterStatInput) => ({ success: true, data: {} as CharacterStat }),
        delete: async (id: string) => ({ success: true })
      }

      expect(typeof mockCharacterStatsEndpoints.create).toBe('function')
      expect(typeof mockCharacterStatsEndpoints.getAll).toBe('function')
      expect(typeof mockCharacterStatsEndpoints.getById).toBe('function')
      expect(typeof mockCharacterStatsEndpoints.update).toBe('function')
      expect(typeof mockCharacterStatsEndpoints.delete).toBe('function')
    })

    it('should define experiments endpoints structure', () => {
      const mockExperimentsEndpoints: ApiClient['experiments'] = {
        create: async (data: CreateExperimentInput) => ({ success: true, data: {} as Experiment }),
        getAll: async () => ({ success: true, data: [] as Experiment[] }),
        getById: async (id: string) => ({ success: true, data: {} as Experiment }),
        update: async (id: string, data: UpdateExperimentInput) => ({ success: true, data: {} as Experiment }),
        delete: async (id: string) => ({ success: true }),
        getTasks: async (id: string) => ({ success: true, data: [] as DailyTask[] }),
        completeTask: async (id: string, data: CompleteDailyTaskInput) => ({ success: true, data: {} as DailyTask }),
        getTasksInRange: async (id: string, startDate: string, endDate: string) => ({ success: true, data: [] as DailyTask[] })
      }

      expect(typeof mockExperimentsEndpoints.create).toBe('function')
      expect(typeof mockExperimentsEndpoints.getTasks).toBe('function')
      expect(typeof mockExperimentsEndpoints.completeTask).toBe('function')
      expect(typeof mockExperimentsEndpoints.getTasksInRange).toBe('function')
    })

    it('should define journal endpoints structure', () => {
      const mockJournalEndpoints: ApiClient['journal'] = {
        create: async (data: CreateJournalEntryInput) => ({ success: true, data: {} as JournalEntry }),
        getAll: async () => ({ success: true, data: [] as JournalEntry[] }),
        getById: async (id: string) => ({ success: true, data: {} as JournalEntryWithTags }),
        continue: async (id: string, data: ContinueConversationInput) => ({ 
          success: true, 
          data: { entry: {} as JournalEntry, followUpQuestion: null }
        }),
        update: async (id: string, data: UpdateJournalEntryInput) => ({ success: true, data: {} as JournalEntry }),
        delete: async (id: string) => ({ success: true })
      }

      expect(typeof mockJournalEndpoints.create).toBe('function')
      expect(typeof mockJournalEndpoints.continue).toBe('function')
      expect(typeof mockJournalEndpoints.getById).toBe('function')
    })

    it('should define tags endpoints structure', () => {
      const mockTagsEndpoints: ApiClient['tags'] = {
        createContent: async (data: CreateContentTagInput) => ({ success: true, data: {} as ContentTag }),
        getContent: async () => ({ success: true, data: [] as ContentTag[] }),
        deleteContent: async (id: string) => ({ success: true }),
        getTone: async () => ({ success: true, data: [] as ToneTag[] })
      }

      expect(typeof mockTagsEndpoints.createContent).toBe('function')
      expect(typeof mockTagsEndpoints.getContent).toBe('function')
      expect(typeof mockTagsEndpoints.deleteContent).toBe('function')
      expect(typeof mockTagsEndpoints.getTone).toBe('function')
    })

    it('should allow complete ApiClient implementation', () => {
      const mockClient: ApiClient = {
        auth: {
          register: async () => ({ success: true, data: { user: {} as User, token: 'token' } }),
          login: async () => ({ success: true, data: { user: {} as User, token: 'token' } }),
          getMe: async () => ({ success: true, data: {} as User }),
          updateMe: async () => ({ success: true, data: {} as User }),
          deleteMe: async () => ({ success: true })
        },
        characterStats: {
          create: async () => ({ success: true, data: {} as CharacterStat }),
          getAll: async () => ({ success: true, data: [] as CharacterStat[] }),
          getById: async () => ({ success: true, data: {} as CharacterStat }),
          update: async () => ({ success: true, data: {} as CharacterStat }),
          delete: async () => ({ success: true })
        },
        experiments: {
          create: async () => ({ success: true, data: {} as Experiment }),
          getAll: async () => ({ success: true, data: [] as Experiment[] }),
          getById: async () => ({ success: true, data: {} as Experiment }),
          update: async () => ({ success: true, data: {} as Experiment }),
          delete: async () => ({ success: true }),
          getTasks: async () => ({ success: true, data: [] as DailyTask[] }),
          completeTask: async () => ({ success: true, data: {} as DailyTask }),
          getTasksInRange: async () => ({ success: true, data: [] as DailyTask[] })
        },
        journal: {
          create: async () => ({ success: true, data: {} as JournalEntry }),
          getAll: async () => ({ success: true, data: [] as JournalEntry[] }),
          getById: async () => ({ success: true, data: {} as JournalEntryWithTags }),
          continue: async () => ({ success: true, data: { entry: {} as JournalEntry, followUpQuestion: null } }),
          update: async () => ({ success: true, data: {} as JournalEntry }),
          delete: async () => ({ success: true })
        },
        tags: {
          createContent: async () => ({ success: true, data: {} as ContentTag }),
          getContent: async () => ({ success: true, data: [] as ContentTag[] }),
          deleteContent: async () => ({ success: true }),
          getTone: async () => ({ success: true, data: [] as ToneTag[] })
        }
      }

      expect(mockClient).toBeDefined()
      expect(mockClient.auth).toBeDefined()
      expect(mockClient.characterStats).toBeDefined()
      expect(mockClient.experiments).toBeDefined()
      expect(mockClient.journal).toBeDefined()
      expect(mockClient.tags).toBeDefined()
    })
  })

  describe('ApiConfig interface', () => {
    it('should define ApiConfig structure with required baseUrl', () => {
      const config: ApiConfig = {
        baseUrl: 'https://api.example.com'
      }

      expect(config.baseUrl).toBe('https://api.example.com')
    })

    it('should allow optional timeout and headers', () => {
      const config: ApiConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer token',
          'Content-Type': 'application/json'
        }
      }

      expect(config.timeout).toBe(5000)
      expect(config.headers?.['Authorization']).toBe('Bearer token')
    })

    it('should work with minimal configuration', () => {
      const minimalConfig: ApiConfig = {
        baseUrl: 'http://localhost:3000'
      }

      expect(minimalConfig.baseUrl).toBe('http://localhost:3000')
      expect(minimalConfig.timeout).toBeUndefined()
      expect(minimalConfig.headers).toBeUndefined()
    })
  })

  describe('type compatibility with API responses', () => {
    it('should match expected auth response structure', () => {
      const authResponse: AuthResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-02')
          },
          token: 'jwt-token-here'
        }
      }

      expect(authResponse.success).toBe(true)
      expect(authResponse.data?.user.id).toBe('user-123')
      expect(authResponse.data?.token).toBe('jwt-token-here')
    })

    it('should match expected error response structure', () => {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Something went wrong',
        message: 'Detailed error message'
      }

      expect(errorResponse.success).toBe(false)
      expect(errorResponse.error).toBe('Something went wrong')
      expect(errorResponse.data).toBeUndefined()
    })

    it('should support generic ApiResponse types', () => {
      const stringResponse: ApiResponse<string> = {
        success: true,
        data: 'Hello World'
      }

      const arrayResponse: ApiResponse<string[]> = {
        success: true,
        data: ['item1', 'item2', 'item3']
      }

      const objectResponse: ApiResponse<{ id: string; name: string }> = {
        success: true,
        data: { id: '123', name: 'Test' }
      }

      expect(stringResponse.data).toBe('Hello World')
      expect(arrayResponse.data).toHaveLength(3)
      expect(objectResponse.data?.name).toBe('Test')
    })
  })

  describe('input type validation', () => {
    it('should validate CreateUserInput structure', () => {
      const validInput: CreateUserInput = {
        email: 'test@example.com',
        password: 'securepassword123',
        name: 'Test User'
      }

      const minimalInput: CreateUserInput = {
        email: 'test@example.com',
        password: 'securepassword123'
      }

      expect(validInput.email).toBe('test@example.com')
      expect(validInput.name).toBe('Test User')
      expect(minimalInput.name).toBeUndefined()
    })

    it('should validate CreateJournalEntryInput structure', () => {
      const input: CreateJournalEntryInput = {
        entryDate: '2023-01-01T00:00:00Z',
        initialMessage: 'This is my first journal entry',
        experimentIds: ['exp-1', 'exp-2']
      }

      const minimalInput: CreateJournalEntryInput = {
        entryDate: '2023-01-01T00:00:00Z',
        initialMessage: 'This is my first journal entry',
        experimentIds: []
      }

      expect(input.initialMessage).toBe('This is my first journal entry')
      expect(input.experimentIds).toHaveLength(2)
      expect(minimalInput.experimentIds).toHaveLength(0)
    })

    it('should validate CreateExperimentInput structure', () => {
      const input: CreateExperimentInput = {
        title: 'Daily Reading',
        description: 'Read for 30 minutes daily',
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-01-31T23:59:59Z',
        dailyTaskDescription: 'Read for 30 minutes',
        xpRewards: [
          { statId: 'stat-1', xp: 10 },
          { statId: 'stat-2', xp: 5 }
        ]
      }

      expect(input.title).toBe('Daily Reading')
      expect(input.xpRewards).toHaveLength(2)
      expect(input.xpRewards?.[0].xp).toBe(10)
    })
  })
})
