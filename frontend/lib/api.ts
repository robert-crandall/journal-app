/**
 * API client for journal app
 * Handles communication with Hono backend
 */

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin.replace('3000', '3001')
  : 'http://localhost:3001'

// Authentication interfaces
export interface AuthUser {
  id: string
  email: string
  createdAt: string
}

export interface LoginResponse {
  message: string
  user: AuthUser
  token: string
}

export interface RegisterResponse {
  message: string
  user: AuthUser
  token: string
}

export interface MeResponse {
  user: AuthUser
}

// Journal interfaces
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
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('journal_auth_token')
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('journal_auth_token', token)
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('journal_auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = this.getAuthToken()
    
    // Create a new headers object
    const headers = new Headers(options.headers);
    
    // Set content type if not already set
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Add auth token if available
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Authentication methods
  
  // Login with email and password
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    // Store the auth token
    if (response?.token) {
      this.setAuthToken(response.token)
    }
    
    return response
  }
  
  // Register a new user
  async register(email: string, password: string): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    // Store the auth token
    if (response?.token) {
      this.setAuthToken(response.token)
    }
    
    return response
  }
  
  // Get the current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await this.request<MeResponse>('/api/auth/me')
      return response.user
    } catch (error) {
      // Token might be invalid or expired
      this.clearAuthToken()
      return null
    }
  }
  
  // Logout the current user
  logout(): void {
    this.clearAuthToken()
  }
  
  // Check if a user is logged in
  isLoggedIn(): boolean {
    return !!this.getAuthToken()
  }

  // Journal methods

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
