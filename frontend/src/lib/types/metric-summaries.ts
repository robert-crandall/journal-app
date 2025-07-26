// Import types from shared folder (single source of truth)
import type {
  MetricSummary,
  NewMetricSummary,
  PeriodMetrics,
  MetricSummaryResponse,
  ListMetricSummariesResponse,
  GenerateMetricsRequest,
  ListMetricSummariesRequest,
} from '../../../../shared/types/metric-summaries';

export type {
  MetricSummary,
  NewMetricSummary,
  PeriodMetrics,
  MetricSummaryResponse,
  ListMetricSummariesResponse,
  GenerateMetricsRequest,
  ListMetricSummariesRequest,
};

// Additional frontend-specific types for UI state
export interface MetricSummaryFormData {
  startDate: string;
  endDate: string;
}

// UI filter types extended from backend
export interface MetricSummaryUIFilters extends ListMetricSummariesRequest {
  // Additional frontend-only filters
  sourceType?: 'journal-summary' | 'experiment';
}

// Helper types for chart data visualization
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface XpByStatChart {
  statName: string;
  xp: number;
  color: string;
}

export interface ToneTagChart {
  tag: string;
  count: number;
  percentage: number;
}

// Display configuration for metrics
export interface MetricDisplayConfig {
  showCompactView: boolean;
  showCharts: boolean;
  selectedMetricTypes: ('xp' | 'ratings' | 'streaks' | 'tone' | 'tasks')[];
}
