import { apiFetch } from '../api';
import type { 
  Task, 
  TaskCompletion, 
  CreateTaskRequest, 
  UpdateTaskRequest,
  TaskWithRelations,
  DailyTaskView
} from '../../../../backend/src/types/tasks';

export interface TaskFilters {
  sourceType?: string;
  statId?: string;
  familyMemberId?: string;
  completed?: boolean;
}

class TasksApi {
  /**
   * Get all tasks for the authenticated user
   */
  async getUserTasks(filters?: TaskFilters): Promise<TaskWithRelations[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.sourceType) queryParams.append('sourceType', filters.sourceType);
    if (filters?.statId) queryParams.append('statId', filters.statId);
    if (filters?.familyMemberId) queryParams.append('familyMemberId', filters.familyMemberId);
    if (filters?.completed !== undefined) queryParams.append('completed', filters.completed.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/tasks${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiFetch(endpoint);
    return response.data;
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId: string): Promise<TaskWithRelations> {
    const response = await apiFetch(`/api/tasks/${taskId}`);
    return response.data;
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return response.data;
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, taskData: UpdateTaskRequest): Promise<Task> {
    const response = await apiFetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
    return response.data;
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, notes?: string): Promise<{ task: Task; completion: TaskCompletion; xpGranted?: any }> {
    const response = await apiFetch(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return response.data;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get task completions for a specific task
   */
  async getTaskCompletions(taskId: string): Promise<TaskCompletion[]> {
    const response = await apiFetch(`/api/tasks/${taskId}/completions`);
    return response.data;
  }
}

// Export a singleton instance
export const tasksApi = new TasksApi();

// Export types for components to use
export type { 
  Task, 
  TaskCompletion, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskWithRelations,
  DailyTaskView 
};
