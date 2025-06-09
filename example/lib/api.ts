/**
 * API client for journal app
 * Handles communication with Hono backend
 */

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin.replace('3000', '3001')
  : 'http://localhost:3001'

export interface JournalEntry {
  id: string
  title: string
  content: string
  condensedSummary: string
  fullSummary: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: string
}

export interface StartJournalResponse {
  conversationId: string
  initialMessage: string
}

export interface ChatResponse {
  message: string
  isComplete: boolean
}

export interface CompileJournalResponse {
  entry: JournalEntry
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Start a new journal conversation
  async startJournal(): Promise<StartJournalResponse> {
    return this.request<StartJournalResponse>('/api/journal/start', {
      method: 'POST',
    })
  }

  // Send a message in the journal conversation
  async sendMessage(
    conversationId: string,
    message: string
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/journal/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        message,
      }),
    })
  }

  // Compile the journal entry from conversation
  async compileJournal(conversationId: string): Promise<CompileJournalResponse> {
    return this.request<CompileJournalResponse>('/api/journal/compile', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
      }),
    })
  }

  // Get all journal entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    return this.request<JournalEntry[]>('/api/journal/entries')
  }

  // Get a specific journal entry
  async getJournalEntry(id: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/api/journal/entries/${id}`)
  }

  // Update a journal entry
  async updateJournalEntry(
    id: string,
    updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/api/journal/entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  // Delete a journal entry
  async deleteJournalEntry(id: string): Promise<void> {
    await this.request(`/api/journal/entries/${id}`, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiClient()
