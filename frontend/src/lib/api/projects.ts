import { apiFetch } from '../api';
import type { 
  Project, 
  ProjectSubtask,
  CreateProjectRequest, 
  UpdateProjectRequest,
  CreateProjectSubtaskRequest,
  UpdateProjectSubtaskRequest,
  ProjectWithRelations
} from '../../../../backend/src/types/projects';

export interface ProjectFilters {
  type?: 'project' | 'adventure';
  status?: 'active' | 'completed' | 'cancelled';
}

class ProjectsApi {
  /**
   * Get all projects for the authenticated user
   */
  async getUserProjects(filters?: ProjectFilters): Promise<ProjectWithRelations[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.status) queryParams.append('status', filters.status);

    const queryString = queryParams.toString();
    const endpoint = `/api/projects${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiFetch(endpoint);
    return response.data;
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string): Promise<ProjectWithRelations> {
    const response = await apiFetch(`/api/projects/${projectId}`);
    return response.data;
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const response = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return response.data;
  }

  /**
   * Update an existing project
   */
  async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<Project> {
    const response = await apiFetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    return response.data;
  }

  /**
   * Complete a project
   */
  async completeProject(projectId: string, completionNotes?: string): Promise<Project> {
    const response = await apiFetch(`/api/projects/${projectId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completionNotes }),
    });
    return response.data;
  }

  /**
   * Cancel a project
   */
  async cancelProject(projectId: string, completionNotes?: string): Promise<Project> {
    const response = await apiFetch(`/api/projects/${projectId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ completionNotes }),
    });
    return response.data;
  }

  // Subtask management methods

  /**
   * Get subtasks for a project
   */
  async getProjectSubtasks(projectId: string): Promise<ProjectSubtask[]> {
    const response = await apiFetch(`/api/projects/${projectId}/subtasks`);
    return response.data;
  }

  /**
   * Create a new subtask for a project
   */
  async createSubtask(projectId: string, subtaskData: CreateProjectSubtaskRequest): Promise<ProjectSubtask> {
    const response = await apiFetch(`/api/projects/${projectId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify(subtaskData),
    });
    return response.data;
  }

  /**
   * Update a subtask
   */
  async updateSubtask(projectId: string, subtaskId: string, subtaskData: UpdateProjectSubtaskRequest): Promise<ProjectSubtask> {
    const response = await apiFetch(`/api/projects/${projectId}/subtasks/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify(subtaskData),
    });
    return response.data;
  }

  /**
   * Delete a subtask
   */
  async deleteSubtask(projectId: string, subtaskId: string): Promise<void> {
    await apiFetch(`/api/projects/${projectId}/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Toggle subtask completion
   */
  async toggleSubtaskCompletion(projectId: string, subtaskId: string): Promise<ProjectSubtask> {
    const response = await apiFetch(`/api/projects/${projectId}/subtasks/${subtaskId}/toggle`, {
      method: 'POST',
    });
    return response.data;
  }
}

// Export a singleton instance
export const projectsApi = new ProjectsApi();

// Export types for components to use
export type { 
  Project, 
  ProjectSubtask,
  ProjectWithRelations,
  CreateProjectRequest, 
  UpdateProjectRequest,
  CreateProjectSubtaskRequest,
  UpdateProjectSubtaskRequest
};
