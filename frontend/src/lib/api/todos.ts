import { createAuthenticatedFetch } from '../api';
import type { SimpleTodoResponse, CreateSimpleTodoRequest, UpdateSimpleTodoRequest } from '$lib/types/todos';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

class SimpleTodosApi {
  // Get all incomplete simple todos for the user
  async getTodos(): Promise<SimpleTodoResponse[]> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch('/api/todos', {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Get todos API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<SimpleTodoResponse[]>;
      return result.data;
    } catch (error) {
      console.error('Get todos API request failed:', error);
      throw error;
    }
  }

  // Create a new simple todo
  async createTodo(data: CreateSimpleTodoRequest): Promise<SimpleTodoResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Create todo API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<SimpleTodoResponse>;
      return result.data;
    } catch (error) {
      console.error('Create todo API request failed:', error);
      throw error;
    }
  }

  // Update a simple todo
  async updateTodo(id: string, data: UpdateSimpleTodoRequest): Promise<SimpleTodoResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Update todo API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<SimpleTodoResponse>;
      return result.data;
    } catch (error) {
      console.error('Update todo API request failed:', error);
      throw error;
    }
  }

  // Mark a todo as complete/incomplete
  async completeTodo(id: string, isCompleted: boolean): Promise<SimpleTodoResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/todos/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted }),
      });

      if (!response.ok) {
        console.error('Complete todo API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<SimpleTodoResponse>;
      return result.data;
    } catch (error) {
      console.error('Complete todo API request failed:', error);
      throw error;
    }
  }

  // Delete a simple todo
  async deleteTodo(id: string): Promise<{ id: string }> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Delete todo API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<{ id: string }>;
      return result.data;
    } catch (error) {
      console.error('Delete todo API request failed:', error);
      throw error;
    }
  }
}

export const simpleTodosApi = new SimpleTodosApi();
