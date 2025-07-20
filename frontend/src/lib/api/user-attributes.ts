import { authenticatedClient } from '../api';

// Import types directly from backend (following the development principles)
import type {
  UserAttribute,
  CreateUserAttributeRequest,
  UpdateUserAttributeRequest,
  GroupedUserAttributes,
  AttributeSource,
  AttributeCategory,
} from '../../../../backend/src/types/user-attributes';

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
  // Get user's attributes (optionally filtered)
  async getUserAttributes(filters?: { category?: string; source?: AttributeSource }): Promise<UserAttribute[]> {
    try {
      const query: Record<string, string> = {};
      
      if (filters?.category) {
        query.category = filters.category;
      }
      if (filters?.source) {
        query.source = filters.source;
      }

      const response = await authenticatedClient.api['user-attributes'].$get({
        query,
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

  // Get user's attributes grouped by category
  async getGroupedUserAttributes(): Promise<GroupedUserAttributes> {
    try {
      const response = await authenticatedClient.api['user-attributes'].grouped.$get();

      if (!response.ok) {
        console.error('Get grouped user attributes API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<GroupedUserAttributes>;
      return result.data;
    } catch (error) {
      console.error('Get grouped user attributes API request failed:', error);
      throw error;
    }
  },

  // Get specific attribute by ID
  async getUserAttribute(attributeId: string): Promise<UserAttribute> {
    try {
      const response = await authenticatedClient.api['user-attributes'][':id'].$get({
        param: { id: attributeId },
      });

      if (!response.ok) {
        console.error('Get user attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute>;
      return result.data;
    } catch (error) {
      console.error('Get user attribute API request failed:', error);
      throw error;
    }
  },

  // Create a new user attribute
  async createUserAttribute(data: CreateUserAttributeRequest): Promise<UserAttribute> {
    try {
      const response = await authenticatedClient.api['user-attributes'].$post({
        json: data,
      });

      if (!response.ok) {
        console.error('Create user attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute>;
      return result.data;
    } catch (error) {
      console.error('Create user attribute API request failed:', error);
      throw error;
    }
  },

  // Update an existing user attribute
  async updateUserAttribute(attributeId: string, data: UpdateUserAttributeRequest): Promise<UserAttribute> {
    try {
      const response = await authenticatedClient.api['user-attributes'][':id'].$put({
        param: { id: attributeId },
        json: data,
      });

      if (!response.ok) {
        console.error('Update user attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<UserAttribute>;
      return result.data;
    } catch (error) {
      console.error('Update user attribute API request failed:', error);
      throw error;
    }
  },

  // Delete a user attribute
  async deleteUserAttribute(attributeId: string): Promise<void> {
    try {
      const response = await authenticatedClient.api['user-attributes'][':id'].$delete({
        param: { id: attributeId },
      });

      if (!response.ok) {
        console.error('Delete user attribute API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Delete user attribute API request failed:', error);
      throw error;
    }
  },
};
