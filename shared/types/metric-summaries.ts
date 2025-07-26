// Shared types for metric summaries
export interface MetricSummary {
  id: string;
  userId: string;
  type: 'journal' | 'experiment';
  sourceId: string;
  startDate: Date;
  endDate: Date;
  totalXp: number;
  avgDayRating: number | null;
  daysLogged: number;
  tasksCompleted: number;
  averageTasksPerDay: number;
  toneTagCounts: Record<string, number>;
  mostCommonTone: string | null;
  xpByStat: Record<string, number>;
  logStreak: { longest: number; current: number } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewMetricSummary {
  id?: string;
  userId: string;
  type: 'journal' | 'experiment';
  sourceId: string;
  startDate: Date;
  endDate: Date;
  totalXp?: number;
  avgDayRating?: number | null;
  daysLogged?: number;
  tasksCompleted?: number;
  averageTasksPerDay?: number;
  toneTagCounts?: Record<string, number>;
  mostCommonTone?: string | null;
  xpByStat?: Record<string, number>;
  logStreak?: { longest: number; current: number } | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// API request/response types
export interface PeriodMetrics {
  startDate: string;
  endDate: string;
  totalXp: number;
  avgDayRating: number | null;
  toneTagCounts: Record<string, number>;
  mostCommonTone?: string;
  daysLogged: number;
  tasksCompleted: number;
  averageTasksPerDay: number;
  xpByStat: Record<string, number>;
  logStreak?: { longest: number; current: number };
}

export interface MetricSummaryResponse {
  id: string;
  userId: string;
  type: 'journal' | 'experiment';
  sourceId: string;
  startDate: string;
  endDate: string;
  totalXp: number;
  avgDayRating: number | null;
  daysLogged: number;
  tasksCompleted: number;
  averageTasksPerDay: number;
  toneTagCounts: Record<string, number>;
  mostCommonTone: string | null;
  xpByStat: Record<string, number>;
  logStreak: { longest: number; current: number } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListMetricSummariesRequest {
  type?: 'journal' | 'experiment';
  limit?: number;
  offset?: number;
  sortBy?: 'totalXp' | 'avgDayRating' | 'daysLogged' | 'tasksCompleted' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  minAvgDayRating?: number;
  mostCommonTone?: string;
  minTotalXp?: number;
}

export interface ListMetricSummariesResponse {
  summaries: MetricSummaryResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface GenerateMetricsRequest {
  startDate: string;
  endDate: string;
}
