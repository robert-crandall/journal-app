import type { projects, projectSubtasks } from '../db/schema/projects';

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectUpdate = Partial<Omit<NewProject, 'id' | 'userId' | 'createdAt'>>;

export type ProjectSubtask = typeof projectSubtasks.$inferSelect;
export type NewProjectSubtask = typeof projectSubtasks.$inferInsert;
export type ProjectSubtaskUpdate = Partial<Omit<NewProjectSubtask, 'id' | 'userId' | 'projectId' | 'createdAt'>>;

// Request/Response types for API
export interface CreateProjectRequest {
  title: string;
  description?: string;
  type: 'project' | 'adventure';
  startDate?: string; // ISO date string
  targetDate?: string; // ISO date string
  goalId?: string;
  includeInAiGeneration?: boolean;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  goalId?: string;
  includeInAiGeneration?: boolean;
  isActive?: boolean;
  completionNotes?: string;
}

export interface CreateProjectSubtaskRequest {
  title: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateProjectSubtaskRequest {
  title?: string;
  description?: string;
  sortOrder?: number;
  isCompleted?: boolean;
}

// Enhanced types with related data
export interface ProjectWithRelations extends Project {
  goal?: {
    id: string;
    title: string;
  };
  subtasks?: ProjectSubtask[];
  completedSubtaskCount?: number;
  totalSubtaskCount?: number;
}

export interface ProjectDashboard extends ProjectWithRelations {
  recentActivity?: Array<{
    id: string;
    type: 'subtask_completed' | 'subtask_added' | 'project_updated';
    description: string;
    createdAt: Date;
  }>;
  completionPercentage?: number;
}
