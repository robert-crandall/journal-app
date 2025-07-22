// Import experiment types from backend (single source of truth)
export type {
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
} from '../../../../backend/src/types/experiments';
