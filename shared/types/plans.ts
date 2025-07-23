// Plan types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface Plan {
  id: string;
  userId: string;
  title: string;
  type: string;
  description: string | null;
  focusId: string | null;
  isOrdered: boolean;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPlan {
  id?: string;
  userId: string;
  title: string;
  type: string;
  description?: string | null;
  focusId?: string | null;
  isOrdered?: boolean;
  lastActivityAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdatePlan = Partial<Omit<NewPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface PlanSubtask {
  id: string;
  planId: string;
  userId: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  orderIndex: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPlanSubtask {
  id?: string;
  planId: string;
  userId: string;
  title: string;
  description?: string | null;
  isCompleted?: boolean;
  completedAt?: Date | null;
  orderIndex?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

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
