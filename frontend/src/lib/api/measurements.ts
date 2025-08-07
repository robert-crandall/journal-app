import { createAuthenticatedFetch } from '../api';
import type {
  MeasurementResponse,
  CreateMeasurementRequest,
  UpdateMeasurementRequest,
  ListMeasurementsRequest,
  ListMeasurementsResponse,
} from '$lib/types/measurements';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

class MeasurementsApi {
  // Create a new measurement
  async createMeasurement(data: CreateMeasurementRequest): Promise<MeasurementResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch('/api/measurements', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Create measurement API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<MeasurementResponse>;
      return result.data;
    } catch (error) {
      console.error('Create measurement API request failed:', error);
      throw error;
    }
  }

  // Get all measurements for the authenticated user
  async getMeasurements(params?: ListMeasurementsRequest): Promise<ListMeasurementsResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();

      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.set('startDate', params.startDate);
      if (params?.endDate) queryParams.set('endDate', params.endDate);
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());

      const queryString = queryParams.toString();
      const url = `/api/measurements${queryString ? `?${queryString}` : ''}`;

      const response = await authenticatedFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Get measurements API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<ListMeasurementsResponse>;
      return result.data;
    } catch (error) {
      console.error('Get measurements API request failed:', error);
      throw error;
    }
  }

  // Get a specific measurement by ID
  async getMeasurement(id: string): Promise<MeasurementResponse | null> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/measurements/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        console.error('Get measurement API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<MeasurementResponse>;
      return result.data;
    } catch (error) {
      console.error('Get measurement API request failed:', error);
      throw error;
    }
  }

  // Update a measurement
  async updateMeasurement(id: string, data: UpdateMeasurementRequest): Promise<MeasurementResponse> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/measurements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Update measurement API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<MeasurementResponse>;
      return result.data;
    } catch (error) {
      console.error('Update measurement API request failed:', error);
      throw error;
    }
  }

  // Delete a measurement
  async deleteMeasurement(id: string): Promise<void> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/measurements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Delete measurement API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Delete measurement API request failed:', error);
      throw error;
    }
  }
}

export const measurementsApi = new MeasurementsApi();
