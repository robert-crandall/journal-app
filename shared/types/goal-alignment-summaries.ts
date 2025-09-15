// Goal Alignment Summary types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface AlignedGoal {
  goalId: string;
  goalTitle: string;
  evidence: string[]; // Evidence/excerpts from journals, tasks, etc.
  points: number; // Points earned (1-2) for this goal
}

export interface NeglectedGoal {
  goalId: string;
  goalTitle: string;
  reason?: string; // Optional reason for neglect
  points: number; // Points earned (always 0 for neglected goals)
}

export interface GoalAlignmentSummary {
  id: string;
  userId: string;
  periodStartDate: Date;
  periodEndDate: Date;
  alignmentScore: number | null;
  alignedGoals: AlignedGoal[];
  neglectedGoals: NeglectedGoal[];
  suggestedNextSteps: string[];
  summary: string;
  totalPointsEarned: number; // Total points earned across all goals
  totalPossiblePoints: number; // Total possible points (goals * 2)
  createdAt: Date;
  updatedAt: Date;
}

export interface NewGoalAlignmentSummary {
  id?: string;
  userId: string;
  periodStartDate: Date;
  periodEndDate: Date;
  alignmentScore?: number | null;
  alignedGoals?: AlignedGoal[];
  neglectedGoals?: NeglectedGoal[];
  suggestedNextSteps?: string[];
  summary: string;
  totalPointsEarned?: number;
  totalPossiblePoints?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Request/Response types for API
export interface CreateGoalAlignmentSummaryRequest {
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  alignmentScore?: number;
  alignedGoals?: AlignedGoal[];
  neglectedGoals?: NeglectedGoal[];
  suggestedNextSteps?: string[];
  summary: string;
  totalPointsEarned?: number;
  totalPossiblePoints?: number;
}

export interface UpdateGoalAlignmentSummaryRequest {
  alignmentScore?: number | null;
  alignedGoals?: AlignedGoal[];
  neglectedGoals?: NeglectedGoal[];
  suggestedNextSteps?: string[];
  summary?: string;
  totalPointsEarned?: number;
  totalPossiblePoints?: number;
}

export interface ListGoalAlignmentSummariesRequest {
  limit?: number;
  offset?: number;
  year?: number;
}

// Alias for compatibility
export type GetGoalAlignmentSummariesQuery = ListGoalAlignmentSummariesRequest;

export interface GenerateGoalAlignmentSummaryRequest {
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
}

export interface GoalAlignmentSummaryResponse {
  id: string;
  userId: string;
  periodStartDate: string;
  periodEndDate: string;
  alignmentScore: number | null;
  alignedGoals: AlignedGoal[];
  neglectedGoals: NeglectedGoal[];
  suggestedNextSteps: string[];
  summary: string;
  totalPointsEarned: number; // Total points earned across all goals
  totalPossiblePoints: number; // Total possible points (goals * 2)
  createdAt: string;
  updatedAt: string;
}

export interface ListGoalAlignmentSummariesResponse {
  summaries: GoalAlignmentSummaryResponse[];
  total: number;
  hasMore: boolean;
}
