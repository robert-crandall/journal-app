import { TokenManager, createAuthHeader } from '$lib/utils/auth';
import { browser } from '$app/environment';
import type { users } from '../../../../backend/src/db/schema';

// Type definitions for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: typeof users.$inferSelect;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// API client configuration
const API_BASE_URL = browser ? 
  (import.meta.env['VITE_API_URL'] || 'http://localhost:3000') : 
  'http://localhost:3000';

// Enhanced API client with authentication
export class ApiClient {
  private baseUrl = API_BASE_URL;

  // Helper method for making requests
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = TokenManager.getValidToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        } as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<T>;
    }
  }

  // Authentication endpoints
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<typeof users.$inferSelect>> {
    return this.request<typeof users.$inferSelect>('/api/auth/me');
  }

  // Dashboard endpoints
  async getDashboard(): Promise<ApiResponse<any>> {
    return this.request('/api/dashboard');
  }

  // Character endpoints
  async getCharacters(): Promise<ApiResponse<any[]>> {
    return this.request('/api/characters');
  }

  async createCharacter(data: { name: string; class: string; backstory?: string }): Promise<ApiResponse<any>> {
    return this.request('/api/characters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tasks endpoints
  async getTasks(): Promise<ApiResponse<any[]>> {
    return this.request('/api/tasks');
  }

  async completeTask(taskId: string, feedback?: string): Promise<ApiResponse<any>> {
    return this.request(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  // Journal endpoints
  async getJournalConversations(): Promise<ApiResponse<any[]>> {
    return this.request('/api/journal/conversations');
  }

  async startJournalConversation(): Promise<ApiResponse<any>> {
    return this.request('/api/journal/quick-start', {
      method: 'POST',
    });
  }

  // Quests endpoints
  async getQuests(): Promise<ApiResponse<any[]>> {
    return this.request('/api/quests');
  }

  // Family members endpoints
  async getFamilyMembers(): Promise<ApiResponse<any[]>> {
    return this.request('/api/family-members');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
