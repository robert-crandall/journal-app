// Import shared authentication utilities
import { createAuthenticatedFetch } from '../api';

// Import types from backend
// TODO: Once module resolution is fixed, import directly from backend
export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthday?: string | null;
  likes?: string | null;
  dislikes?: string | null;
  energyLevel: number;
  notes?: string | null;
  lastInteractionDate?: string | null;
  connectionXp: number;
  connectionLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyTaskFeedback {
  id: string;
  familyMemberId: string;
  taskDescription: string;
  feedback?: string | null;
  enjoyedIt?: boolean | null;
  notes?: string | null;
  xpGranted?: number | null;
  createdAt: string;
}

export interface CreateFamilyMemberRequest {
  name: string;
  relationship: string;
  birthday?: string;
  likes?: string;
  dislikes?: string;
  energyLevel: number;
  notes?: string;
}

export interface UpdateFamilyMemberRequest {
  name?: string;
  relationship?: string;
  birthday?: string;
  likes?: string;
  dislikes?: string;
  energyLevel?: number;
  notes?: string;
}

export interface CreateFamilyTaskFeedbackRequest {
  taskDescription: string;
  feedback?: string;
  enjoyedIt?: boolean;
  notes?: string;
  xpGranted?: number;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

// Type-safe family API using shared authentication pattern
export const familyApi = {
  // Get user's family members
  async getFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch('/api/family');

      if (!response.ok) {
        console.error('Get family members API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<FamilyMember[]>;
      return result.data;
    } catch (error) {
      console.error('Get family members API request failed:', error);
      throw error;
    }
  },

  // Get specific family member by ID
  async getFamilyMember(memberId: string): Promise<FamilyMember> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/family/${memberId}`);

      if (!response.ok) {
        console.error('Get family member API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<FamilyMember>;
      return result.data;
    } catch (error) {
      console.error('Get family member API request failed:', error);
      throw error;
    }
  },

  // Create a new family member
  async createFamilyMember(data: CreateFamilyMemberRequest): Promise<FamilyMember> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch('/api/family', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Create family member API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<FamilyMember>;
      return result.data;
    } catch (error) {
      console.error('Create family member API request failed:', error);
      throw error;
    }
  },

  // Update an existing family member
  async updateFamilyMember(memberId: string, data: UpdateFamilyMemberRequest): Promise<FamilyMember> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/family/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Update family member API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<FamilyMember>;
      return result.data;
    } catch (error) {
      console.error('Update family member API request failed:', error);
      throw error;
    }
  },

  // Delete a family member
  async deleteFamilyMember(memberId: string): Promise<void> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/family/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Delete family member API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      // Delete returns success message, no data needed
    } catch (error) {
      console.error('Delete family member API request failed:', error);
      throw error;
    }
  },

  // Add task feedback for a family member
  async addTaskFeedback(memberId: string, data: CreateFamilyTaskFeedbackRequest): Promise<FamilyTaskFeedback> {
    try {
      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(`/api/family/${memberId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Add task feedback API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        // Handle validation errors specifically
        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<FamilyTaskFeedback>;
      return result.data;
    } catch (error) {
      console.error('Add task feedback API request failed:', error);
      throw error;
    }
  },

  // Get task feedback history for a family member
  async getTaskFeedback(memberId: string, limit?: number): Promise<FamilyTaskFeedback[]> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) {
        queryParams.set('limit', limit.toString());
      }

      const query = queryParams.toString();
      const endpoint = `/api/family/${memberId}/feedback${query ? `?${query}` : ''}`;

      const authenticatedFetch = createAuthenticatedFetch();
      const response = await authenticatedFetch(endpoint);

      if (!response.ok) {
        console.error('Get task feedback API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((result as any).error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<FamilyTaskFeedback[]>;
      return result.data;
    } catch (error) {
      console.error('Get task feedback API request failed:', error);
      throw error;
    }
  },
};

// Export simple functions for component compatibility
export const getFamilyMembers = familyApi.getFamilyMembers;
export const getFamilyMember = familyApi.getFamilyMember;
export const createFamilyMember = familyApi.createFamilyMember;
export const updateFamilyMember = familyApi.updateFamilyMember;
export const deleteFamilyMember = familyApi.deleteFamilyMember;
export const addTaskFeedback = familyApi.addTaskFeedback;
export const getTaskFeedback = familyApi.getTaskFeedback;
