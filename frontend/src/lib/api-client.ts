// API client for connecting to the backend
// This will be updated to use tRPC once the backend client is properly integrated

import { ApiResponse, User, JournalEntry, JournalEntryWithTags, Experiment, CharacterStat, ContentTag, ToneTag } from '@/types'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Generic API client
class ApiClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    this.headers = {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Auth methods
  async register(userData: { email: string; username: string; password: string }) {
    return this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async getMe() {
    return this.request<User>('/api/auth/me')
  }

  // Journal methods
  async createJournalEntry(data: { entryDate: string; initialMessage: string; experimentIds?: string[] }) {
    return this.request<JournalEntry>('/api/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getJournalEntries() {
    return this.request<JournalEntry[]>('/api/journal')
  }

  async getJournalEntriesWithTags() {
    return this.request<JournalEntryWithTags[]>('/api/journal/with-tags')
  }

  async getJournalEntry(id: string) {
    return this.request<JournalEntryWithTags>(`/api/journal/${id}`)
  }

  async continueConversation(id: string, data: { content: string }) {
    return this.request<{ entry: JournalEntryWithTags; followUpQuestion: string | null }>(`/api/journal/${id}/continue`, {
      method: 'POST',
      body: JSON.stringify({ message: data.content }),
    })
  }

  // Experiment methods
  async createExperiment(data: { title: string; description: string; startDate: string; endDate: string; dailyTaskDescription: string }) {
    return this.request<Experiment>('/api/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getExperiments() {
    return this.request<Experiment[]>('/api/experiments')
  }

  async getExperiment(id: string) {
    return this.request<Experiment>(`/api/experiments/${id}`)
  }

  // Character stats methods
  async getCharacterStats() {
    return this.request<CharacterStat[]>('/api/character-stats')
  }

  async createCharacterStat(data: { name: string; description: string }) {
    return this.request<CharacterStat>('/api/character-stats', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Tags methods
  async getContentTags() {
    return this.request<ContentTag[]>('/api/tags/content')
  }

  async getToneTags() {
    return this.request<ToneTag[]>('/api/tags/tone')
  }

  // Set auth token for authenticated requests
  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`
  }

  // Remove auth token
  removeAuthToken() {
    delete this.headers['Authorization']
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Export the class for testing or custom instances
export default ApiClient
