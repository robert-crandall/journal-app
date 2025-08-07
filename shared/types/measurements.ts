// Measurement types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface Measurement {
  id: string;
  userId: string;
  recordedDate: string; // ISO date string (YYYY-MM-DD)
  
  // Core measurements
  weightLbs: number | null; // stored in pounds
  neckCm: number | null;
  waistCm: number | null; // averaged from other waist fields
  hipCm: number | null; // optional, needed for female formulas
  
  bodyFatPercentage: number | null; // calculated at time of entry
  notes: string | null;
  
  // Extra measurements (optional and flexible)
  extra: Record<string, number> | null; // e.g. { "waist_at_navel_cm": 93, "waist_above_navel_cm": 91, ... }
  
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface NewMeasurement {
  id?: string;
  userId: string;
  recordedDate: string; // ISO date string (YYYY-MM-DD)
  weightLbs?: number | null;
  neckCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  bodyFatPercentage?: number | null;
  notes?: string | null;
  extra?: Record<string, number> | null;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

export type MeasurementUpdate = Partial<Omit<NewMeasurement, 'id' | 'userId' | 'createdAt'>>;

// API request types
export interface CreateMeasurementRequest {
  recordedDate?: string; // ISO date string (YYYY-MM-DD), defaults to today if not provided
  weightLbs?: number;
  neckCm?: number;
  // Raw waist inputs - will be averaged to calculate waistCm
  waistAtNavelCm?: number;
  waistAboveNavelCm?: number;
  waistBelowNavelCm?: number;
  hipCm?: number;
  notes?: string;
  extra?: Record<string, number>;
}

export interface UpdateMeasurementRequest {
  recordedDate?: string; // ISO date string (YYYY-MM-DD)
  weightLbs?: number;
  neckCm?: number;
  waistAtNavelCm?: number;
  waistAboveNavelCm?: number;
  waistBelowNavelCm?: number;
  hipCm?: number;
  notes?: string;
  extra?: Record<string, number>;
}

// API response types
export interface MeasurementResponse extends Measurement {
  // Include raw waist measurements for display
  waistAtNavelCm?: number;
  waistAboveNavelCm?: number;
  waistBelowNavelCm?: number;
}

export interface ListMeasurementsRequest {
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD)
  limit?: number;
  offset?: number;
}

export interface ListMeasurementsResponse {
  measurements: MeasurementResponse[];
  total: number;
}
