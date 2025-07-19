// Export all API clients here
export { goalsApi } from './goals';
export { usersApi } from './users';
export { default as tagsApi } from './tags';
export { experimentsApi } from './experiments';
export { plansApi } from './plans';

// Re-export types from API clients
export type { GoalWithParsedTags, CreateGoalWithTags, UpdateGoalWithTags } from './goals';
export type { ApiUser } from './users';
export type { Tag, TagWithCount } from './tags';
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
} from './experiments';
export type {
  PlanResponse,
  PlanSubtaskResponse,
  PlanWithSubtasksResponse,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreatePlanSubtaskRequest,
  UpdatePlanSubtaskRequest,
  PlanType,
} from './plans';
