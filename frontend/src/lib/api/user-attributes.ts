import { authenticatedClient } from '../api';
import type {
  UserAttribute,
  CreateUserAttribute,
  UpdateUserAttribute,
  BulkCreateUserAttributes,
  GetUserAttributesQuery,
  UserAttributesSummary,
} from '$lib/types/user-attributes';

export type { UserAttribute, CreateUserAttribute, UpdateUserAttribute, BulkCreateUserAttributes, GetUserAttributesQuery, UserAttributesSummary };

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

// Type-safe user attributes API using Hono client
export const userAttributesApi = {
  // Get user's attributes
  async getUserAttributes(query?: GetUserAttributesQuery): Promise<UserAttribute[]> {
    try {
      const response = await authenticatedClient.api['user-attributes'].$get({
        query: query || {},
      });

      if (!response.ok) {
        console.error('Get user attributes API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute[]>;
      return result.data;
    } catch (error) {
      console.error('Get user attributes API request failed:', error);
      throw error;
    }
  },

  // Get specific attribute by ID
  async getAttribute(attributeId: string): Promise<UserAttribute> {
    try {
      const response = await authenticatedClient.api['user-attributes'][':id'].$get({
        param: { id: attributeId },
      });

      if (!response.ok) {
        console.error('Get attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute>;
      return result.data;
    } catch (error) {
      console.error('Get attribute API request failed:', error);
      throw error;
    }
  },

  // Get user attributes summary
  async getAttributesSummary(): Promise<UserAttributesSummary> {
    try {
      const response = await authenticatedClient.api['user-attributes'].summary.$get();

      if (!response.ok) {
        console.error('Get attributes summary API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttributesSummary>;
      return result.data;
    } catch (error) {
      console.error('Get attributes summary API request failed:', error);
      throw error;
    }
  },

  // Get user attributes grouped (returns empty object if no grouping needed)
  async getAttributesGrouped(): Promise<Record<string, UserAttribute[]>> {
    try {
      const response = await authenticatedClient.api['user-attributes'].grouped.$get();

      if (!response.ok) {
        console.error('Get attributes grouped API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<Record<string, UserAttribute[]>>;
      return result.data;
    } catch (error) {
      console.error('Get attributes grouped API request failed:', error);
      throw error;
    }
  },

  // Create a new attribute
  async createAttribute(data: CreateUserAttribute): Promise<UserAttribute> {
    try {
      const response = await authenticatedClient.api['user-attributes'].$post({
        json: data,
      });

      if (!response.ok) {
        console.error('Create attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute>;
      return result.data;
    } catch (error) {
      console.error('Create attribute API request failed:', error);
      throw error;
    }
  },

  // Create multiple attributes in bulk
  async createAttributesBulk(data: BulkCreateUserAttributes): Promise<UserAttribute[]> {
    try {
      const response = await authenticatedClient.api['user-attributes'].bulk.$post({
        json: data,
      });

      if (!response.ok) {
        console.error('Create attributes bulk API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute[]>;
      return result.data;
    } catch (error) {
      console.error('Create attributes bulk API request failed:', error);
      throw error;
    }
  },

  // Update an existing attribute
  async updateAttribute(attributeId: string, data: UpdateUserAttribute): Promise<UserAttribute> {
    try {
      const response = await authenticatedClient.api['user-attributes'][':id'].$put({
        param: { id: attributeId },
        json: data,
      });

      if (!response.ok) {
        console.error('Update attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute>;
      return result.data;
    } catch (error) {
      console.error('Update attribute API request failed:', error);
      throw error;
    }
  },

  // Delete an attribute
  async deleteAttribute(attributeId: string): Promise<UserAttribute> {
    try {
      const response = await authenticatedClient.api['user-attributes'][':id'].$delete({
        param: { id: attributeId },
      });

      if (!response.ok) {
        console.error('Delete attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute>;
      return result.data;
    } catch (error) {
      console.error('Delete attribute API request failed:', error);
      throw error;
    }
  },

  // Deduplicate user attributes
  async deduplicateAttributes(): Promise<{ removedCount: number }> {
    try {
      const response = await authenticatedClient.api['user-attributes'].deduplicate.$post();

      if (!response.ok) {
        console.error('Deduplicate attributes API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<{ removedCount: number }>;
      return result.data;
    } catch (error) {
      console.error('Deduplicate attributes API request failed:', error);
      throw error;
    }
  },
};
