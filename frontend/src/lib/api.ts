import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// Types for API responses
export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  created_at: string;
}

export interface JournalSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface JournalMessage {
  id: string;
  session_id: string;
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  session_id: string;
  title: string;
  content: string;
  mood_score: number | null;
  mood?: string; // For UI display
  is_private: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Aliases for compatibility
  createdAt: string;
  updatedAt: string;
  sessionId: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Configuration
const API_BASE_URL = browser ? 'http://localhost:3000' : 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    
    // Load token from localStorage if in browser
    if (browser) {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth header if token exists
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle different response types
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'An error occurred';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        // Handle authentication errors
        if (response.status === 401) {
          this.clearAuth();
          if (browser) {
            goto('/auth/login');
          }
        }

        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) return {} as T;
      
      return JSON.parse(text);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication methods
  setToken(token: string) {
    this.token = token;
    if (browser) {
      localStorage.setItem('auth_token', token);
    }
  }

  clearAuth() {
    this.token = null;
    if (browser) {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    name: string;
    timezone?: string;
  }): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.token);
    return response;
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    this.clearAuth();
    if (browser) {
      goto('/auth/login');
    }
  }

  async me(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  // Journal endpoints
  async startJournalSession(): Promise<JournalSession> {
    return this.request<JournalSession>('/api/journal/start', {
      method: 'POST',
    });
  }

  async replyToJournal(data: {
    session_id: string;
    message: string;
  }): Promise<JournalMessage> {
    return this.request<JournalMessage>('/api/journal/reply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitJournalEntry(data: {
    session_id: string;
    title: string;
    content: string;
    mood_score?: number;
    is_private?: boolean;
    tags?: string[];
  }): Promise<JournalEntry> {
    return this.request<JournalEntry>('/api/journal/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getJournalEntries(params: {
    limit?: number;
    offset?: number;
    tag?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<JournalEntry[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const query = searchParams.toString();
    const endpoint = query ? `/api/journal/list?${query}` : '/api/journal/list';
    
    return this.request<JournalEntry[]>(endpoint);
  }

  async getJournalEntry(id: string): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/api/journal/entry/${id}`);
  }

  async updateJournalEntry(
    id: string,
    data: Partial<Pick<JournalEntry, 'title' | 'content' | 'mood_score' | 'is_private' | 'tags'>>
  ): Promise<JournalEntry> {
    return this.request<JournalEntry>(`/api/journal/entry/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Alias methods for consistency
  async getEntry(id: string): Promise<JournalEntry> {
    return this.getJournalEntry(id);
  }

  async deleteEntry(id: string): Promise<void> {
    return this.request<void>(`/api/journal/entry/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/');
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
