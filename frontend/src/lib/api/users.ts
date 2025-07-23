import { createAuthenticatedClient } from '../api';
import type { UpdateUserRequest, UpdateUserAvatarRequest } from '$lib/types/users';

// API response user type (dates are serialized as strings in JSON)
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Type-safe user API using Hono client
export const usersApi = {
  // Get current user profile
  async getProfile(): Promise<ApiUser> {
    const client = createAuthenticatedClient();
    const response = await client.api.users.profile.$get();

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error((errorData as { error: string }).error || 'Failed to fetch profile');
    }

    const result = (await response.json()) as ApiResponse<ApiUser>;

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch profile');
    }

    return result.data;
  },

  // Update user profile
  async updateProfile(data: UpdateUserRequest): Promise<ApiUser> {
    const client = createAuthenticatedClient();
    const response = await client.api.users.profile.$put({
      json: data,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error((errorData as { error: string }).error || 'Failed to update profile');
    }

    const result = (await response.json()) as ApiResponse<ApiUser>;

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update profile');
    }

    return result.data;
  },

  // Update/remove user avatar
  async updateAvatar(avatar: string | null): Promise<ApiUser> {
    const client = createAuthenticatedClient();
    const response = await client.api.users.avatar.$patch({
      json: { avatar: avatar || '' } as UpdateUserAvatarRequest,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error((errorData as { error: string }).error || 'Failed to update avatar');
    }

    const result = (await response.json()) as ApiResponse<ApiUser>;

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update avatar');
    }

    return result.data;
  },
};
