// Import plan types from backend (single source of truth)
export type {
  Plan,
  NewPlan,
  UpdatePlan,
  PlanSubtask,
  NewPlanSubtask,
  UpdatePlanSubtask,
  PlanType,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreatePlanSubtaskRequest,
  UpdatePlanSubtaskRequest,
  PlanResponse,
  PlanSubtaskResponse,
  PlanWithSubtasksResponse,
} from '../../../../backend/src/types/plans';
