import { apiFetch } from '../api';
import type { Tag as BackendTag, TagWithCount } from '../../../../backend/src/types/tags';

// Re-export tag types for frontend use
export type Tag = BackendTag;
export type { TagWithCount };

export type CreateTagRequest = {
  name: string;
};

export type BatchCreateTagsRequest = {
  tags: string[];
};

export type UpdateTagRequest = {
  name?: string;
};

const tagsApi = {
  // Get all user tags with usage counts
  getUserTags: async (): Promise<TagWithCount[]> => {
    const response = await apiFetch('/api/tags');
    return response.data;
  },

  // Get a specific tag by ID
  getTag: async (id: string): Promise<Tag> => {
    const response = await apiFetch(`/api/tags/${id}`);
    return response.data;
  },

  // Create a single tag
  createTag: async (data: CreateTagRequest): Promise<Tag> => {
    const response = await apiFetch('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Batch create multiple tags at once
  batchCreateTags: async (data: BatchCreateTagsRequest): Promise<Tag[]> => {
    const response = await apiFetch('/api/tags/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update an existing tag
  updateTag: async (id: string, data: UpdateTagRequest): Promise<Tag> => {
    const response = await apiFetch(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete a tag
  deleteTag: async (id: string): Promise<Tag> => {
    const response = await apiFetch(`/api/tags/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  // Clean up unused tags
  cleanupTags: async (): Promise<{ deletedCount: number; message: string }> => {
    const response = await apiFetch('/api/tags/cleanup', {
      method: 'DELETE',
    });
    return response.data;
  },
};

export default tagsApi;
