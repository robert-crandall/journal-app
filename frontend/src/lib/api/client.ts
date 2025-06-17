// Frontend API client using backend types directly for end-to-end type safety
import type { 
  ApiResponse,
  AuthResponse,
  User,
  Task,
  JournalEntry,
  DashboardData,
  LoginRequest,
  RegisterRequest,
  CreateTask,
  UpdateTask,
  CreateJournalEntry,
  UpdateJournalEntry
} from '../../../../backend/src/types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Task endpoints
  async getTasks(): Promise<ApiResponse<Task[]>> {
    return this.request('/api/tasks');
  }

  async createTask(data: CreateTask): Promise<ApiResponse<Task>> {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: UpdateTask): Promise<ApiResponse<Task>> {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Journal endpoints
  async getJournalEntries(): Promise<ApiResponse<JournalEntry[]>> {
    return this.request('/api/journal');
  }

  async createJournalEntry(data: CreateJournalEntry): Promise<ApiResponse<JournalEntry>> {
    return this.request('/api/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJournalEntry(id: string, data: UpdateJournalEntry): Promise<ApiResponse<JournalEntry>> {
    return this.request(`/api/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard endpoint
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.request('/api/dashboard');
  }
}

// Export singleton instance
export const api = new ApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
);
