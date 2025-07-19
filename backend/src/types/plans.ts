import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { plans, planSubtasks } from '../db/schema/plans';

export type Plan = InferSelectModel<typeof plans>;
export type NewPlan = InferInsertModel<typeof plans>;
export type UpdatePlan = Partial<Omit<NewPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export type PlanSubtask = InferSelectModel<typeof planSubtasks>;
export type NewPlanSubtask = InferInsertModel<typeof planSubtasks>;
export type UpdatePlanSubtask = Partial<Omit<NewPlanSubtask, 'id' | 'planId' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Valid plan types
export type PlanType = 'project' | 'adventure' | 'theme' | 'other';

// Request/Response types for API
export type CreatePlanRequest = {
  title: string;
  type: PlanType;
  description?: string;
  focusId?: string;
  isOrdered?: boolean;
};

export type UpdatePlanRequest = {
  title?: string;
  type?: PlanType;
  description?: string;
  focusId?: string | null;
  isOrdered?: boolean;
};

export type CreatePlanSubtaskRequest = {
  title: string;
  description?: string;
  orderIndex?: number;
};

export type UpdatePlanSubtaskRequest = {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  orderIndex?: number;
};

export type PlanResponse = {
  id: string;
  title: string;
  type: PlanType;
  description: string | null;
  focusId: string | null;
  isOrdered: boolean;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanSubtaskResponse = {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  orderIndex: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanWithSubtasksResponse = PlanResponse & {
  subtasks: PlanSubtaskResponse[];
};
