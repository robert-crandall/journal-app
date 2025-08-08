import { createAuthenticatedFetch } from '../api';

// Import types directly from backend (following development principles)
import type {
  PhotoResponse,
  ListPhotosResponse,
  PhotoUploadResponse,
  BulkPhotoUploadResponse,
  ListPhotosRequest,
  UpdatePhotoRequest,
} from '../../../../shared/types/photos';

/**
 * Service class for photo API operations
 */
export class PhotoService {
  /**
   * Upload a single photo
   */
  static async uploadPhoto(linkedType: 'journal' | 'measurement', linkedId: string, file: File, caption?: string): Promise<PhotoResponse> {
    const authFetch = createAuthenticatedFetch();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('linkedType', linkedType);
    formData.append('linkedId', linkedId);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await authFetch('/api/photos', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - let browser set multipart/form-data boundary automatically
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result: PhotoUploadResponse = await response.json();

    if (!result.success || !result.photo) {
      throw new Error(result.error || 'Upload failed - no photo returned');
    }

    return result.photo;
  }

  /**
   * Upload multiple photos
   */
  static async uploadPhotos(
    linkedType: 'journal' | 'measurement',
    linkedId: string,
    files: File[],
    captions?: (string | undefined)[],
  ): Promise<PhotoResponse[]> {
    const authFetch = createAuthenticatedFetch();

    const formData = new FormData();

    // Add files
    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('linkedType', linkedType);
    formData.append('linkedId', linkedId);

    if (captions && captions.length > 0) {
      formData.append('captions', JSON.stringify(captions));
    }

    const response = await authFetch('/api/photos/bulk', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - let browser set multipart/form-data boundary automatically
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Bulk upload failed with status ${response.status}`);
    }

    const result: BulkPhotoUploadResponse = await response.json();

    if (!result.success || !result.photos) {
      const errors = result.errors?.join(', ') || 'Bulk upload failed';
      throw new Error(errors);
    }

    return result.photos;
  }

  /**
   * List photos with optional filtering
   */
  static async listPhotos(params?: ListPhotosRequest): Promise<ListPhotosResponse> {
    const authFetch = createAuthenticatedFetch();

    const searchParams = new URLSearchParams();
    if (params?.linkedType) searchParams.append('linkedType', params.linkedType);
    if (params?.journalId) searchParams.append('journalId', params.journalId);
    if (params?.measurementId) searchParams.append('measurementId', params.measurementId);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const url = searchParams.toString() ? `/api/photos?${searchParams.toString()}` : '/api/photos';

    const response = await authFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch photos: ${response.status}`);
    }

    const parsedResponse = await response.json();
    return parsedResponse.data;
  }

  /**
   * Get a specific photo by ID
   */
  static async getPhoto(id: string): Promise<PhotoResponse> {
    const authFetch = createAuthenticatedFetch();

    const response = await authFetch(`/api/photos/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Photo not found');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch photo: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update photo caption
   */
  static async updatePhoto(id: string, data: UpdatePhotoRequest): Promise<PhotoResponse> {
    const authFetch = createAuthenticatedFetch();

    const response = await authFetch(`/api/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Photo not found');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update photo: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete a photo
   */
  static async deletePhoto(id: string): Promise<void> {
    const authFetch = createAuthenticatedFetch();

    const response = await authFetch(`/api/photos/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Photo not found');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete photo: ${response.status}`);
    }
  }

  /**
   * Get photo URL for display
   * Combines base URL with the file path from photo data
   */
  static getPhotoUrl(filePath: string): string {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';
    return `${baseUrl}/uploads/${filePath}`;
  }

  /**
   * Get thumbnail URL for display
   */
  static getThumbnailUrl(thumbnailPath: string): string {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';
    return `${baseUrl}/uploads/${thumbnailPath}`;
  }
}
