// Type-safe client for Journal App API
// This client provides full TypeScript support and can be used by any frontend framework

import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  userContextSchema,
  updateUserContextSchema,
  userPreferencesSchema,
  updateProfileSchema,
  createTaskSchema,
  updateTaskSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
} from '../lib/validation';

// Re-export validation schemas for client use
export {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  userContextSchema,
  updateUserContextSchema,
  userPreferencesSchema,
  updateProfileSchema,
  createTaskSchema,
  updateTaskSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
};

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserContext {
  id: string;
  key: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: string;
  accentColor: string;
  timezone: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD format
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export interface JournalStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
}

export interface DashboardData {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  welcome: {
    message: string;
    date: {
      date: string;
      formatted: string;
      iso: string;
    };
  };
  tasks: {
    stats: TaskStats;
    upcoming: Task[];
  };
  journal: {
    stats: JournalStats;
    recent: JournalEntry[];
  };
}

// Input types (inferred from schemas)
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type UserContextInput = z.infer<typeof userContextSchema>;
export type UpdateUserContextInput = z.infer<typeof updateUserContextSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;

// Client configuration
export interface ClientConfig {
  baseUrl?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class JournalApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private token: string | null = null;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001';
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  // Token management
  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
  }

  // Private method for making requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }

      throw new ApiError('Unknown error occurred', 500);
    }
  }

  // Authentication methods
  async register(data: RegisterInput): Promise<ApiResponse<AuthResponse>> {
    const result = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Automatically set token if registration is successful
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async login(data: LoginInput): Promise<ApiResponse<AuthResponse>> {
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Automatically set token if login is successful
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    return this.request('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async logout(): Promise<void> {
    this.clearToken();
    // In a real app, you might want to call a logout endpoint to invalidate the token server-side
  }

  // User profile methods (require authentication)
  async getProfile(): Promise<ApiResponse<User>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: UpdateProfileInput): Promise<ApiResponse<User>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // User context methods (require authentication)
  async getContext(): Promise<ApiResponse<UserContext[]>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<UserContext[]>('/auth/me/context');
  }

  async updateContext(contexts: UserContextInput[]): Promise<ApiResponse<UserContext[]>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<UserContext[]>('/auth/me/context', {
      method: 'PUT',
      body: JSON.stringify({ contexts }),
    });
  }

  // User preferences methods (require authentication)
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<UserPreferences>('/auth/me/preferences');
  }

  async updatePreferences(preferences: UserPreferencesInput): Promise<ApiResponse<UserPreferences>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<UserPreferences>('/auth/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Dashboard methods (require authentication)
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<DashboardData>('/api/dashboard');
  }

  // Task methods (require authentication)
  async createTask(data: CreateTaskInput): Promise<ApiResponse<Task>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTasks(options?: {
    includeCompleted?: boolean;
    sortBy?: 'dueDate' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Task[]>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }

    const params = new URLSearchParams();
    if (options?.includeCompleted !== undefined) {
      params.append('includeCompleted', options.includeCompleted.toString());
    }
    if (options?.sortBy) {
      params.append('sortBy', options.sortBy);
    }
    if (options?.sortOrder) {
      params.append('sortOrder', options.sortOrder);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/tasks?${queryString}` : '/api/tasks';

    return this.request<Task[]>(endpoint);
  }

  async getTask(taskId: string): Promise<ApiResponse<Task>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<Task>(`/api/tasks/${taskId}`);
  }

  async updateTask(taskId: string, data: UpdateTaskInput): Promise<ApiResponse<Task>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<Task>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleTask(taskId: string): Promise<ApiResponse<Task>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<Task>(`/api/tasks/${taskId}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteTask(taskId: string): Promise<ApiResponse<Task>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<Task>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async getTaskStats(): Promise<ApiResponse<TaskStats>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<TaskStats>('/api/tasks/stats');
  }

  // Journal methods (require authentication)
  async createJournalEntry(data: CreateJournalEntryInput): Promise<ApiResponse<JournalEntry>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<JournalEntry>('/api/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getJournalEntries(options?: {
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<JournalEntry[]>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }

    const params = new URLSearchParams();
    if (options?.sortOrder) {
      params.append('sortOrder', options.sortOrder);
    }
    if (options?.limit !== undefined) {
      params.append('limit', options.limit.toString());
    }
    if (options?.offset !== undefined) {
      params.append('offset', options.offset.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/journal?${queryString}` : '/api/journal';

    return this.request<JournalEntry[]>(endpoint);
  }

  async getRecentJournalEntries(limit?: number): Promise<ApiResponse<JournalEntry[]>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    
    const params = new URLSearchParams();
    if (limit !== undefined) {
      params.append('limit', limit.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/journal/recent?${queryString}` : '/api/journal/recent';

    return this.request<JournalEntry[]>(endpoint);
  }

  async getJournalEntry(entryId: string): Promise<ApiResponse<JournalEntry>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<JournalEntry>(`/api/journal/${entryId}`);
  }

  async updateJournalEntry(entryId: string, data: UpdateJournalEntryInput): Promise<ApiResponse<JournalEntry>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<JournalEntry>(`/api/journal/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJournalEntry(entryId: string): Promise<ApiResponse<JournalEntry>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<JournalEntry>(`/api/journal/${entryId}`, {
      method: 'DELETE',
    });
  }

  async getJournalStats(): Promise<ApiResponse<JournalStats>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<JournalStats>('/api/journal/stats');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/');
  }
}

// Factory function for creating a client instance
export function createJournalApiClient(config?: ClientConfig): JournalApiClient {
  return new JournalApiClient(config);
}

// Default client instance
export const journalApi = createJournalApiClient();
