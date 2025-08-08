import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import appExport from '../index';
import { getTestDb, getUniqueEmail } from './setup';
import { eq, desc } from 'drizzle-orm';
import { users, journals, measurements, photos } from '../db/schema';
import type { 
  PhotoResponse, 
  ListPhotosResponse, 
  PhotoUploadResponse, 
  BulkPhotoUploadResponse 
} from '../../../shared/types/photos';
import type { User } from '../../../shared/types/users';
import type { JournalResponse } from '../../../shared/types/journals';
import type { MeasurementResponse } from '../../../shared/types/measurements';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

const testDb = getTestDb();

// Helper function to create a test image buffer (1x1 PNG)
async function createTestImageBuffer(): Promise<Buffer> {
  // Create a valid 10x10 red PNG using Sharp
  return sharp({
    create: {
      width: 10,
      height: 10,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  })
  .png()
  .toBuffer();
}

// Helper function to create a test JPEG buffer (1x1 JPEG)
async function createTestJpegBuffer(): Promise<Buffer> {
  // Create a valid 10x10 blue JPEG using Sharp
  return sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 0, g: 0, b: 255 }
    }
  })
  .jpeg()
  .toBuffer();
}

// Helper function to create FormData for file upload
function createFormDataWithFile(
  filename: string,
  buffer: Buffer,
  mimeType: string,
  linkedType: 'journal' | 'measurement',
  linkedId: string,
  caption?: string
): FormData {
  const formData = new FormData();
  const uint8Array = new Uint8Array(buffer);
  const file = new File([uint8Array], filename, { type: mimeType });
  
  formData.append('file', file);
  formData.append('linkedType', linkedType);
  formData.append('linkedId', linkedId);
  
  if (caption) {
    formData.append('caption', caption);
  }
  
  return formData;
}

// Helper function to create FormData for bulk upload
function createBulkFormData(
  files: Array<{ filename: string; buffer: Buffer; mimeType: string }>,
  linkedType: 'journal' | 'measurement',
  linkedId: string,
  captions?: (string | undefined)[]
): FormData {
  const formData = new FormData();
  
  files.forEach(({ filename, buffer, mimeType }) => {
    const uint8Array = new Uint8Array(buffer);
    const file = new File([uint8Array], filename, { type: mimeType });
    formData.append('files', file);
  });
  
  formData.append('linkedType', linkedType);
  formData.append('linkedId', linkedId);
  
  if (captions) {
    formData.append('captions', JSON.stringify(captions));
  }
  
  return formData;
}

describe('Photos API Integration Tests', () => {
  let testUser: User;
  let authToken: string;
  let testJournal: JournalResponse;
  let testMeasurement: MeasurementResponse;

  beforeEach(async () => {
    // Create a test user for each test
    const userData = {
      name: 'Test User',
      email: getUniqueEmail('test'),
      password: 'password123',
      heightCm: 175.0,
      sex: 'male' as const,
    };

    const res = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { user, token } = await res.json();
    testUser = user;
    authToken = token;

    // Create a test journal
    const journalRes = await app.request('/api/journals', {
      method: 'POST',
      body: JSON.stringify({
        date: '2024-01-01',
        initialMessage: 'Test journal entry',
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
    const journalData = await journalRes.json();
    testJournal = journalData.data;

    // Create a test measurement
    const measurementRes = await app.request('/api/measurements', {
      method: 'POST',
      body: JSON.stringify({
        weightLbs: 180,
        notes: 'Test measurement',
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
    const measurementData = await measurementRes.json();
    testMeasurement = measurementData.data;
  });

  describe('POST /api/photos', () => {
    it('should upload a photo for a journal entry', async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'test-image.png',
        imageBuffer,
        'image/png',
        'journal',
        testJournal.id,
        'Test journal photo'
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData: PhotoUploadResponse = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.photo).toBeDefined();

      const photo = responseData.photo!;
      expect(photo.id).toBeDefined();
      expect(photo.userId).toBe(testUser.id);
      expect(photo.linkedType).toBe('journal');
      expect(photo.journalId).toBe(testJournal.id);
      expect(photo.measurementId).toBeNull();
      expect(photo.originalFilename).toBe('test-image.png');
      expect(photo.mimeType).toBe('image/png');
      expect(photo.caption).toBe('Test journal photo');
      expect(photo.filePath).toBeDefined();
      expect(photo.thumbnailPath).toBeDefined();
      expect(photo.fileSize).toBeDefined();
    });

    it('should upload a photo for a measurement', async () => {
      const imageBuffer = await createTestJpegBuffer();
      const formData = createFormDataWithFile(
        'measurement.jpg',
        imageBuffer,
        'image/jpeg',
        'measurement',
        testMeasurement.id,
        'Body progress photo'
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData: PhotoUploadResponse = await res.json();

      expect(responseData.success).toBe(true);
      const photo = responseData.photo!;
      expect(photo.linkedType).toBe('measurement');
      expect(photo.measurementId).toBe(testMeasurement.id);
      expect(photo.journalId).toBeNull();
      expect(photo.originalFilename).toBe('measurement.jpg');
      expect(photo.mimeType).toBe('image/jpeg');
      expect(photo.caption).toBe('Body progress photo');
    });

    it('should upload a photo without caption', async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'no-caption.png',
        imageBuffer,
        'image/png',
        'journal',
        testJournal.id
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData: PhotoUploadResponse = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.photo!.caption).toBeNull();
    });

    it('should reject upload without file', async () => {
      const formData = new FormData();
      formData.append('linkedType', 'journal');
      formData.append('linkedId', testJournal.id);

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('No file provided');
    });

    it('should reject upload with invalid linkedType', async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'test.png',
        imageBuffer,
        'image/png',
        'invalid' as any,
        testJournal.id
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
    });

    it('should reject upload for non-existent journal', async () => {
      const imageBuffer = await createTestImageBuffer();
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const formData = createFormDataWithFile(
        'test.png',
        imageBuffer,
        'image/png',
        'journal',
        fakeId
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Journal not found');
    });

    it('should reject upload for non-existent measurement', async () => {
      const imageBuffer = await createTestImageBuffer();
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const formData = createFormDataWithFile(
        'test.png',
        imageBuffer,
        'image/png',
        'measurement',
        fakeId
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Measurement not found');
    });

    it('should require authentication', async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'test.png',
        imageBuffer,
        'image/png',
        'journal',
        testJournal.id
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/photos/bulk', () => {
    it('should upload multiple photos successfully', async () => {
      const files = [
        {
          filename: 'photo1.png',
          buffer: await createTestImageBuffer(),
          mimeType: 'image/png',
        },
        {
          filename: 'photo2.jpg',
          buffer: await createTestJpegBuffer(),
          mimeType: 'image/jpeg',
        },
      ];

      const captions = ['First photo', 'Second photo'];
      const formData = createBulkFormData(files, 'journal', testJournal.id, captions);

      const res = await app.request('/api/photos/bulk', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData: BulkPhotoUploadResponse = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.photos).toHaveLength(2);
      expect(responseData.successCount).toBe(2);
      expect(responseData.totalCount).toBe(2);
      expect(responseData.errors).toBeUndefined();

      const photos = responseData.photos!;
      expect(photos[0].originalFilename).toBe('photo1.png');
      expect(photos[0].caption).toBe('First photo');
      expect(photos[1].originalFilename).toBe('photo2.jpg');
      expect(photos[1].caption).toBe('Second photo');
    });

    it('should upload photos without captions', async () => {
      const files = [
        {
          filename: 'photo1.png',
          buffer: await createTestImageBuffer(),
          mimeType: 'image/png',
        },
      ];

      const formData = createBulkFormData(files, 'measurement', testMeasurement.id);

      const res = await app.request('/api/photos/bulk', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(201);
      const responseData: BulkPhotoUploadResponse = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.photos).toHaveLength(1);
      expect(responseData.photos![0].caption).toBeNull();
    });

    it('should reject bulk upload without files', async () => {
      const formData = new FormData();
      formData.append('linkedType', 'journal');
      formData.append('linkedId', testJournal.id);

      const res = await app.request('/api/photos/bulk', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.errors).toContain('No files provided');
    });

    it('should require authentication', async () => {
      const files = [
        {
          filename: 'photo1.png',
          buffer: await createTestImageBuffer(),
          mimeType: 'image/png',
        },
      ];

      const formData = createBulkFormData(files, 'journal', testJournal.id);

      const res = await app.request('/api/photos/bulk', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/photos', () => {
    let journalPhoto: PhotoResponse;
    let measurementPhoto: PhotoResponse;

    beforeEach(async () => {
      // Create test photos
      const journalImageBuffer = await createTestImageBuffer();
      const journalFormData = createFormDataWithFile(
        'journal-photo.png',
        journalImageBuffer,
        'image/png',
        'journal',
        testJournal.id,
        'Journal photo'
      );

      const journalRes = await app.request('/api/photos', {
        method: 'POST',
        body: journalFormData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const journalResponseData = await journalRes.json();
      journalPhoto = journalResponseData.photo;

      const measurementImageBuffer = await createTestJpegBuffer();
      const measurementFormData = createFormDataWithFile(
        'measurement-photo.jpg',
        measurementImageBuffer,
        'image/jpeg',
        'measurement',
        testMeasurement.id,
        'Measurement photo'
      );

      const measurementRes = await app.request('/api/photos', {
        method: 'POST',
        body: measurementFormData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const measurementResponseData = await measurementRes.json();
      measurementPhoto = measurementResponseData.photo;
    });

    it('should fetch all photos for the user', async () => {
      const res = await app.request('/api/photos', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      const data: ListPhotosResponse = responseData.data;
      expect(data.photos).toHaveLength(2);
      expect(data.total).toBe(2);

      // Should be ordered by created date desc (most recent first)
      const photoIds = data.photos.map(p => p.id);
      expect(photoIds).toContain(journalPhoto.id);
      expect(photoIds).toContain(measurementPhoto.id);
    });

    it('should filter photos by linkedType', async () => {
      const res = await app.request('/api/photos?linkedType=journal', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      const data: ListPhotosResponse = responseData.data;
      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].linkedType).toBe('journal');
      expect(data.photos[0].id).toBe(journalPhoto.id);
    });

    it('should filter photos by journalId', async () => {
      const res = await app.request(`/api/photos?journalId=${testJournal.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      const data: ListPhotosResponse = responseData.data;
      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].journalId).toBe(testJournal.id);
    });

    it('should filter photos by measurementId', async () => {
      const res = await app.request(`/api/photos?measurementId=${testMeasurement.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      const data: ListPhotosResponse = responseData.data;
      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].measurementId).toBe(testMeasurement.id);
    });

    it('should support pagination', async () => {
      const res = await app.request('/api/photos?limit=1&offset=0', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      const data: ListPhotosResponse = responseData.data;
      expect(data.photos).toHaveLength(1);
      expect(data.total).toBe(2);
    });

    it('should require authentication', async () => {
      const res = await app.request('/api/photos');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/photos/:id', () => {
    let photo: PhotoResponse;

    beforeEach(async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'test-photo.png',
        imageBuffer,
        'image/png',
        'journal',
        testJournal.id,
        'Test photo'
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const responseData = await res.json();
      photo = responseData.photo;
    });

    it('should fetch a specific photo', async () => {
      const res = await app.request(`/api/photos/${photo.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      const fetchedPhoto: PhotoResponse = responseData.data;
      expect(fetchedPhoto.id).toBe(photo.id);
      expect(fetchedPhoto.originalFilename).toBe('test-photo.png');
      expect(fetchedPhoto.caption).toBe('Test photo');
    });

    it('should return 404 for non-existent photo', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await app.request(`/api/photos/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await app.request(`/api/photos/${photo.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/photos/:id', () => {
    let photo: PhotoResponse;

    beforeEach(async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'test-photo.png',
        imageBuffer,
        'image/png',
        'journal',
        testJournal.id,
        'Original caption'
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const responseData = await res.json();
      photo = responseData.photo;
    });

    it('should update photo caption', async () => {
      const updateData = {
        caption: 'Updated caption',
      };

      const res = await app.request(`/api/photos/${photo.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      const updatedPhoto: PhotoResponse = responseData.data;
      expect(updatedPhoto.id).toBe(photo.id);
      expect(updatedPhoto.caption).toBe('Updated caption');
    });

    it('should clear photo caption', async () => {
      const updateData = {
        caption: null,
      };

      const res = await app.request(`/api/photos/${photo.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      const updatedPhoto: PhotoResponse = responseData.data;
      expect(updatedPhoto.caption).toBeNull();
    });

    it('should return 404 for non-existent photo', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        caption: 'Updated caption',
      };

      const res = await app.request(`/api/photos/${fakeId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const updateData = {
        caption: 'Updated caption',
      };

      const res = await app.request(`/api/photos/${photo.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/photos/:id', () => {
    let photo: PhotoResponse;

    beforeEach(async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'to-delete.png',
        imageBuffer,
        'image/png',
        'journal',
        testJournal.id,
        'To be deleted'
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const responseData = await res.json();
      photo = responseData.photo;
    });

    it('should delete a photo', async () => {
      const res = await app.request(`/api/photos/${photo.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(photo.id);

      // Verify photo is actually deleted
      const getRes = await app.request(`/api/photos/${photo.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent photo', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await app.request(`/api/photos/${fakeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should require authentication', async () => {
      const res = await app.request(`/api/photos/${photo.id}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('File validation', () => {
    it('should reject files that are too large', async () => {
      // Create a buffer that's larger than the max size (simulating a 15MB file)
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024, 'a');
      const formData = createFormDataWithFile(
        'large-file.png',
        largeBuffer,
        'image/png',
        'journal',
        testJournal.id
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('File too large');
    });

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is not an image', 'utf-8');
      const formData = createFormDataWithFile(
        'document.txt',
        textBuffer,
        'text/plain',
        'journal',
        testJournal.id
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      // Should reject non-image files with appropriate error message
      expect(responseData.error).toMatch(/File must be an image|Unsupported file format/);
    });

    it('should reject unsupported image formats', async () => {
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'unsupported.xyz',
        imageBuffer,
        'image/xyz',
        'journal',
        testJournal.id
      );

      const res = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(400);
      const responseData = await res.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Unsupported file format');
    });
  });

  describe('User isolation', () => {
    let otherUser: User;
    let otherAuthToken: string;
    let otherUserPhoto: PhotoResponse;

    beforeEach(async () => {
      // Create another test user
      const otherUserData = {
        name: 'Other User',
        email: getUniqueEmail('other'),
        password: 'password123',
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(otherUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { user, token } = await res.json();
      otherUser = user;
      otherAuthToken = token;

      // Create a journal for the other user
      const journalRes = await app.request('/api/journals', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-02',
          initialMessage: 'Other user journal',
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherAuthToken}`,
        },
      });
      const journalData = await journalRes.json();
      const otherJournal = journalData.data;

      // Create a photo for the other user
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'other-user-photo.png',
        imageBuffer,
        'image/png',
        'journal',
        otherJournal.id,
        'Other user photo'
      );

      const photoRes = await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${otherAuthToken}`,
        },
      });
      const photoData = await photoRes.json();
      otherUserPhoto = photoData.photo;
    });

    it('should not allow access to other users photos', async () => {
      // Try to get other user's photo
      const res = await app.request(`/api/photos/${otherUserPhoto.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should not allow updating other users photos', async () => {
      const updateData = {
        caption: 'Trying to update other user photo',
      };

      const res = await app.request(`/api/photos/${otherUserPhoto.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should not allow deleting other users photos', async () => {
      const res = await app.request(`/api/photos/${otherUserPhoto.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('should only return photos belonging to the authenticated user', async () => {
      // Create a photo for the current user
      const imageBuffer = await createTestImageBuffer();
      const formData = createFormDataWithFile(
        'my-photo.png',
        imageBuffer,
        'image/png',
        'journal',
        testJournal.id,
        'My photo'
      );

      await app.request('/api/photos', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Get all photos for current user
      const res = await app.request('/api/photos', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      const data: ListPhotosResponse = responseData.data;
      // Should only see our own photo, not the other user's photo
      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].caption).toBe('My photo');
    });
  });
});
