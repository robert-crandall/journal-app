// Type-safe client for Journal App API - Frontend Copy
// This is a copy of the backend client for frontend use

import { z } from 'zod';

// Validation schemas (copied from backend)
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional().nullable(),
  isCompleted: z.boolean().optional(),
});

export const createJournalEntrySchema = z.object({
  title: z.string().max(200, 'Title must be 200 characters or less').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be 10000 characters or less'),
});

export const updateJournalEntrySchema = z.object({
  title: z.string().max(200, 'Title must be 200 characters or less').optional().nullable(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be 10000 characters or less').optional(),
});

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

// Input types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;

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

// Client configuration
export interface ClientConfig {
  baseUrl?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
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

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // User profile methods
  async getProfile(): Promise<ApiResponse<User>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<User>('/auth/me');
  }

  // Dashboard methods
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    if (!this.token) {
      throw new ApiError('Authentication required', 401);
    }
    return this.request<DashboardData>('/api/dashboard');
  }

  // Task methods
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

  // Journal methods
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

  async healthCheck(): Promise<ApiResponse> {
    return this.request('/');
  }
}
