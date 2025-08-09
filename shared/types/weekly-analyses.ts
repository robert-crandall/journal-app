// Analysis types - shared between backend and frontend

export type AnalysisType = 'weekly' | 'monthly' | 'quarterly';

export interface WeeklyAnalysisMetrics {
  totalXpGained: number;
  tasksCompleted: number;
  avgDayRating: number | null; // Average daily rating for the period (1-5 scale, nullable if no ratings)
  xpByStats: Array<{
    statId: string;
    statName: string;
    xpGained: number;
  }>;
  toneFrequency: Array<{
    tone: string;
    count: number;
  }>;
  contentTagFrequency: Array<{
    tag: string;
    count: number;
  }>;
}

export interface WeeklyAnalysisAlignedGoal {
  goalId: string;
  goalTitle: string;
  evidence: string[];
}

export interface WeeklyAnalysisNeglectedGoal {
  goalId: string;
  goalTitle: string;
  reason?: string;
}

export interface WeeklyAnalysisExperiment {
  id: string;
  title: string;
  description: string | null;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  reflection: string | null; // "How'd it go" section
}

export interface WeeklyAnalysis {
  id: string;
  userId: string;
  analysisType: AnalysisType;
  periodStartDate: Date;
  periodEndDate: Date;

  // Journal Summary Section
  journalSummary: string;
  journalTags: string[];

  // Metrics Summary Section
  totalXpGained: number;
  tasksCompleted: number;
  avgDayRating: number | null; // Average daily rating for the period (1-5 scale, nullable if no ratings)
  xpByStats: Array<{
    statId: string;
    statName: string;
    xpGained: number;
  }>;
  toneFrequency: Array<{
    tone: string;
    count: number;
  }>;
  contentTagFrequency: Array<{
    tag: string;
    count: number;
  }>;

  // Goal Alignment Section
  alignmentScore: number | null;
  alignedGoals: WeeklyAnalysisAlignedGoal[];
  neglectedGoals: WeeklyAnalysisNeglectedGoal[];
  suggestedNextSteps: string[];
  goalAlignmentSummary: string;

  // Optional combined reflection
  combinedReflection?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface NewWeeklyAnalysis {
  id?: string;
  userId: string;
  analysisType?: AnalysisType;
  periodStartDate: Date;
  periodEndDate: Date;
  journalSummary: string;
  journalTags?: string[];
  experimentsSummary?: WeeklyAnalysisExperiment[];
  totalXpGained?: number;
  tasksCompleted?: number;
  avgDayRating?: number | null; // Average daily rating for the period (1-5 scale, nullable if no ratings)
  xpByStats?: Array<{
    statId: string;
    statName: string;
    xpGained: number;
  }>;
  toneFrequency?: Array<{
    tone: string;
    count: number;
  }>;
  contentTagFrequency?: Array<{
    tag: string;
    count: number;
  }>;
  alignmentScore?: number | null;
  alignedGoals?: WeeklyAnalysisAlignedGoal[];
  neglectedGoals?: WeeklyAnalysisNeglectedGoal[];
  suggestedNextSteps?: string[];
  goalAlignmentSummary: string;
  combinedReflection?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Request/Response Types
export interface CreateWeeklyAnalysisRequest {
  analysisType?: AnalysisType;
  periodStartDate: string; // ISO date string
  periodEndDate: string; // ISO date string
  journalSummary: string;
  journalTags?: string[];
  experimentsSummary?: WeeklyAnalysisExperiment[];
  totalXpGained?: number;
  tasksCompleted?: number;
  avgDayRating?: number | null; // Average daily rating for the period (1-5 scale, nullable if no ratings)
  xpByStats?: Array<{
    statId: string;
    statName: string;
    xpGained: number;
  }>;
  toneFrequency?: Array<{
    tone: string;
    count: number;
  }>;
  contentTagFrequency?: Array<{
    tag: string;
    count: number;
  }>;
  alignmentScore?: number | null;
  alignedGoals?: WeeklyAnalysisAlignedGoal[];
  neglectedGoals?: WeeklyAnalysisNeglectedGoal[];
  suggestedNextSteps?: string[];
  goalAlignmentSummary: string;
  combinedReflection?: string;
}

export interface UpdateWeeklyAnalysisRequest {
  journalSummary?: string;
  journalTags?: string[];
  experimentsSummary?: WeeklyAnalysisExperiment[];
  totalXpGained?: number;
  tasksCompleted?: number;
  avgDayRating?: number | null; // Average daily rating for the period (1-5 scale, nullable if no ratings)
  xpByStats?: Array<{
    statId: string;
    statName: string;
    xpGained: number;
  }>;
  toneFrequency?: Array<{
    tone: string;
    count: number;
  }>;
  contentTagFrequency?: Array<{
    tag: string;
    count: number;
  }>;
  alignmentScore?: number | null;
  alignedGoals?: WeeklyAnalysisAlignedGoal[];
  neglectedGoals?: WeeklyAnalysisNeglectedGoal[];
  suggestedNextSteps?: string[];
  goalAlignmentSummary?: string;
  combinedReflection?: string;
}

export interface GenerateWeeklyAnalysisRequest {
  analysisType?: AnalysisType;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface WeeklyAnalysisResponse {
  id: string;
  userId: string;
  analysisType: AnalysisType;
  periodStartDate: string; // ISO date string
  periodEndDate: string; // ISO date string
  journalSummary: string;
  journalTags: string[];
  totalXpGained: number;
  tasksCompleted: number;
  avgDayRating: number | null; // Average daily rating for the period (1-5 scale, nullable if no ratings)
  xpByStats: Array<{
    statId: string;
    statName: string;
    xpGained: number;
  }>;
  toneFrequency: Array<{
    tone: string;
    count: number;
  }>;
  contentTagFrequency: Array<{
    tag: string;
    count: number;
  }>;
  alignmentScore: number | null;
  alignedGoals: WeeklyAnalysisAlignedGoal[];
  neglectedGoals: WeeklyAnalysisNeglectedGoal[];
  suggestedNextSteps: string[];
  goalAlignmentSummary: string;
  combinedReflection?: string;
  photos: Array<{
    id: string;
    journalId: string;
    journalDate: string; // ISO date string of the journal entry
    filePath: string;
    thumbnailPath: string;
    originalFilename: string;
    caption: string | null;
    createdAt: string; // ISO date string
  }>;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ListWeeklyAnalysesRequest {
  limit?: number;
  offset?: number;
  year?: number;
  analysisType?: AnalysisType;
}

export interface ListWeeklyAnalysesResponse {
  analyses: WeeklyAnalysisResponse[];
  total: number;
  hasMore: boolean;
}
