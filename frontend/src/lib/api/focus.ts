import { apiFetch, authenticatedClient } from '$lib/api';

// Local type definitions (should match backend types)
export interface Focus {
  id: string;
  userId: string;
  dayOfWeek: number;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFocusRequest {
  dayOfWeek: number;
  title: string;
  description: string;
}

// API response types
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Get all focuses for the current user
 */
export async function getAllFocuses(): Promise<Focus[]> {
  const response = await authenticatedClient.api.focus.$get();
  const data = (await response.json()) as ApiResponse<any[]>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : 'Failed to fetch focuses');
  }

  // Convert date strings to Date objects
  return data.data.map((focus) => ({
    ...focus,
    createdAt: new Date(focus.createdAt),
    updatedAt: new Date(focus.updatedAt),
  }));
}

/**
 * Get a specific focus by day of week
 */
export async function getFocusByDayOfWeek(dayOfWeek: number): Promise<Focus | null> {
  try {
    const response = await authenticatedClient.api.focus[':dayOfWeek'].$get({
      param: { dayOfWeek: dayOfWeek.toString() },
    });
    const data = (await response.json()) as ApiResponse<any>;

    if (!data.success) {
      return null;
    }

    // Convert date strings to Date objects
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  } catch (error) {
    // Return null for 404 (no focus for this day)
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update a focus for a specific day
 */
export async function createOrUpdateFocus(focus: CreateFocusRequest): Promise<Focus> {
  const response = await authenticatedClient.api.focus[':dayOfWeek'].$put({
    param: { dayOfWeek: focus.dayOfWeek.toString() },
    json: focus,
  });
  const data = (await response.json()) as ApiResponse<any>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : 'Failed to create/update focus');
  }

  // Convert date strings to Date objects
  return {
    ...data.data,
    createdAt: new Date(data.data.createdAt),
    updatedAt: new Date(data.data.updatedAt),
  };
}

/**
 * Update multiple focuses at once
 */
export async function batchUpdateFocuses(focuses: CreateFocusRequest[]): Promise<Focus[]> {
  const response = await authenticatedClient.api.focus.batch.$post({
    json: focuses,
  });
  const data = (await response.json()) as ApiResponse<any[]>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : 'Failed to batch update focuses');
  }

  // Convert date strings to Date objects for each focus
  return data.data.map((focus) => ({
    ...focus,
    createdAt: new Date(focus.createdAt),
    updatedAt: new Date(focus.updatedAt),
  }));
}

/**
 * Delete a focus for a specific day
 */
export async function deleteFocus(dayOfWeek: number): Promise<void> {
  const response = await authenticatedClient.api.focus[':dayOfWeek'].$delete({
    param: { dayOfWeek: dayOfWeek.toString() },
  });
  const data = (await response.json()) as ApiResponse<void>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : 'Failed to delete focus');
  }
}

/**
 * Get the current day's focus (based on current date)
 */
export async function getCurrentDayFocus(): Promise<Focus | null> {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return getFocusByDayOfWeek(dayOfWeek);
}

// Helper to get a day name from day of week index
export function getDayName(dayOfWeek: number, format: 'short' | 'long' = 'long'): string {
  const days = {
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  };
  return days[format][dayOfWeek];
}
