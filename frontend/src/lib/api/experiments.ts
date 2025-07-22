import { authenticatedClient } from '../api';

// Import experiment types from frontend barrel file (which re-exports from backend)
import type {
  ExperimentResponse,
  ExperimentWithTasksResponse,
  ExperimentTaskResponse,
  ExperimentTaskCompletionResponse,
  ExperimentTaskWithCompletionsResponse,
  ExperimentDashboardResponse,
  CreateExperimentRequest,
  UpdateExperimentRequest,
  CreateExperimentTaskRequest,
  UpdateExperimentTaskRequest,
  CompleteExperimentTaskRequest,
} from '../types/experiments';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// API error response
interface ApiErrorResponse {
  success: false;
  error: string;
}

export class ExperimentsApi {
  // Get user's experiments
  async getUserExperiments(): Promise<ExperimentResponse[]> {
    const response = await authenticatedClient.api.experiments.$get();

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to fetch experiments');
    }

    const data = (await response.json()) as ApiResponse<ExperimentResponse[]>;
    return data.data;
  }

  // Get experiment by ID with tasks
  async getExperiment(id: string): Promise<ExperimentWithTasksResponse> {
    const response = await authenticatedClient.api.experiments[':id'].$get({
      param: { id },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to fetch experiment');
    }

    const data = (await response.json()) as ApiResponse<ExperimentWithTasksResponse>;
    return data.data;
  }

  // Create new experiment
  async createExperiment(experimentData: CreateExperimentRequest): Promise<ExperimentWithTasksResponse> {
    const response = await authenticatedClient.api.experiments.$post({
      json: experimentData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to create experiment');
    }

    const data = (await response.json()) as ApiResponse<ExperimentWithTasksResponse>;
    return data.data;
  }

  // Update experiment
  async updateExperiment(id: string, updateData: UpdateExperimentRequest): Promise<ExperimentResponse> {
    const response = await authenticatedClient.api.experiments[':id'].$put({
      param: { id },
      json: updateData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to update experiment');
    }

    const data = (await response.json()) as ApiResponse<ExperimentResponse>;
    return data.data;
  }

  // Delete experiment
  async deleteExperiment(id: string): Promise<{ id: string }> {
    const response = await authenticatedClient.api.experiments[':id'].$delete({
      param: { id },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to delete experiment');
    }

    const data = (await response.json()) as ApiResponse<{ id: string }>;
    return data.data;
  }

  // Get experiment tasks with completion status
  async getExperimentTasks(experimentId: string): Promise<ExperimentTaskWithCompletionsResponse[]> {
    const response = await authenticatedClient.api.experiments[':id'].tasks.$get({
      param: { id: experimentId },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to fetch experiment tasks');
    }

    const data = (await response.json()) as ApiResponse<ExperimentTaskWithCompletionsResponse[]>;
    return data.data;
  }

  // Create new task for experiment
  async createExperimentTask(experimentId: string, taskData: CreateExperimentTaskRequest): Promise<ExperimentTaskResponse> {
    const response = await authenticatedClient.api.experiments[':id'].tasks.$post({
      param: { id: experimentId },
      json: taskData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to create experiment task');
    }

    const data = (await response.json()) as ApiResponse<ExperimentTaskResponse>;
    return data.data;
  }

  // Update experiment task
  async updateExperimentTask(experimentId: string, taskId: string, updateData: UpdateExperimentTaskRequest): Promise<ExperimentTaskResponse> {
    const response = await authenticatedClient.api.experiments[':id'].tasks[':taskId'].$put({
      param: { id: experimentId, taskId },
      json: updateData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to update experiment task');
    }

    const data = (await response.json()) as ApiResponse<ExperimentTaskResponse>;
    return data.data;
  }

  // Delete experiment task
  async deleteExperimentTask(experimentId: string, taskId: string): Promise<{ id: string }> {
    const response = await authenticatedClient.api.experiments[':id'].tasks[':taskId'].$delete({
      param: { id: experimentId, taskId },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to delete experiment task');
    }

    const data = (await response.json()) as ApiResponse<{ id: string }>;
    return data.data;
  }

  // Complete experiment task
  async completeExperimentTask(experimentId: string, taskId: string, completionData: CompleteExperimentTaskRequest): Promise<ExperimentTaskCompletionResponse> {
    const response = await authenticatedClient.api.experiments[':id'].tasks[':taskId'].complete.$post({
      param: { id: experimentId, taskId },
      json: completionData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to complete experiment task');
    }

    const data = (await response.json()) as ApiResponse<ExperimentTaskCompletionResponse>;
    return data.data;
  }

  // Get experiment dashboard data
  async getExperimentDashboard(experimentId: string): Promise<ExperimentDashboardResponse> {
    const response = await authenticatedClient.api.experiments[':id'].dashboard.$get({
      param: { id: experimentId },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.error || 'Failed to fetch experiment dashboard');
    }

    const data = (await response.json()) as ApiResponse<ExperimentDashboardResponse>;
    return data.data;
  }
}

// Export a singleton instance
export const experimentsApi = new ExperimentsApi();
