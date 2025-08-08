// Photo types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface Photo {
  id: string;
  userId: string;
  linkedType: 'journal' | 'measurement';
  journalId: string | null;
  measurementId: string | null;
  filePath: string;
  thumbnailPath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: string;
  caption: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface NewPhoto {
  id?: string;
  userId: string;
  linkedType: 'journal' | 'measurement';
  journalId?: string | null;
  measurementId?: string | null;
  filePath: string;
  thumbnailPath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: string;
  caption?: string | null;
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
}

export type PhotoUpdate = Partial<Omit<NewPhoto, 'id' | 'userId' | 'linkedType' | 'journalId' | 'measurementId' | 'createdAt'>>;

// API request types
export interface CreatePhotoRequest {
  linkedType: 'journal' | 'measurement';
  journalId?: string;
  measurementId?: string;
  caption?: string;
  // Note: file will be sent as multipart/form-data
}

export interface UpdatePhotoRequest {
  caption?: string | null;
}

export interface BulkPhotoUploadRequest {
  linkedType: 'journal' | 'measurement';
  linkedId: string; // Either journalId or measurementId
  captions?: (string | undefined)[];
  // Note: files will be sent as multipart/form-data
}

// API response types
export interface PhotoResponse extends Photo {
  // May include computed fields in the future
}

export interface ListPhotosRequest {
  linkedType?: 'journal' | 'measurement';
  journalId?: string;
  measurementId?: string;
  limit?: number;
  offset?: number;
}

export interface ListPhotosResponse {
  photos: PhotoResponse[];
  total: number;
}

export interface PhotoUploadResponse {
  success: boolean;
  photo?: PhotoResponse;
  error?: string;
}

export interface BulkPhotoUploadResponse {
  success: boolean;
  photos?: PhotoResponse[];
  errors?: string[];
  successCount?: number;
  totalCount?: number;
}
