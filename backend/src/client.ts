// This file can be imported by the frontend for type-safe API calls
// Copy this to your frontend project's types folder

export * from './types/index'

// Additional client-specific types for API responses
export interface ApiClient {
  // Auth endpoints
  auth: {
    register: (data: CreateUserInput) => Promise<AuthResponse>
    login: (data: LoginInput) => Promise<AuthResponse>
    getMe: () => Promise<ApiResponse<User>>
    updateMe: (data: UpdateUserInput) => Promise<ApiResponse<User>>
    deleteMe: () => Promise<ApiResponse>
  }
  
  // Character stats endpoints
  characterStats: {
    create: (data: CreateCharacterStatInput) => Promise<ApiResponse<CharacterStat>>
    getAll: () => Promise<ApiResponse<CharacterStat[]>>
    getById: (id: string) => Promise<ApiResponse<CharacterStat>>
    update: (id: string, data: UpdateCharacterStatInput) => Promise<ApiResponse<CharacterStat>>
    delete: (id: string) => Promise<ApiResponse>
  }
  
  // Experiments endpoints
  experiments: {
    create: (data: CreateExperimentInput) => Promise<ApiResponse<Experiment>>
    getAll: () => Promise<ApiResponse<Experiment[]>>
    getById: (id: string) => Promise<ApiResponse<Experiment>>
    update: (id: string, data: UpdateExperimentInput) => Promise<ApiResponse<Experiment>>
    delete: (id: string) => Promise<ApiResponse>
    getTasks: (id: string) => Promise<ApiResponse<DailyTask[]>>
    completeTask: (id: string, data: CompleteDailyTaskInput) => Promise<ApiResponse<DailyTask>>
    getTasksInRange: (id: string, startDate: string, endDate: string) => Promise<ApiResponse<DailyTask[]>>
  }
  
  // Journal endpoints
  journal: {
    create: (data: CreateJournalEntryInput) => Promise<ApiResponse<JournalEntry>>
    getAll: () => Promise<ApiResponse<JournalEntry[]>>
    getById: (id: string) => Promise<ApiResponse<JournalEntryWithTags>>
    continue: (id: string, data: ContinueConversationInput) => Promise<ApiResponse<{ entry: JournalEntry; followUpQuestion: string | null }>>
    update: (id: string, data: UpdateJournalEntryInput) => Promise<ApiResponse<JournalEntry>>
    delete: (id: string) => Promise<ApiResponse>
  }
  
  // Tags endpoints
  tags: {
    createContent: (data: CreateContentTagInput) => Promise<ApiResponse<ContentTag>>
    getContent: () => Promise<ApiResponse<ContentTag[]>>
    deleteContent: (id: string) => Promise<ApiResponse>
    getTone: () => Promise<ApiResponse<ToneTag[]>>
  }
}

// HTTP client configuration
export interface ApiConfig {
  baseUrl: string
  timeout?: number
  headers?: Record<string, string>
}
