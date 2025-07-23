// User types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  id?: string;
  email: string;
  name: string;
  password: string;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserUpdate = Partial<Omit<NewUser, 'id' | 'createdAt'>>;

// Exclude sensitive fields for API responses
export type PublicUser = Omit<User, 'password'>;

// API request types
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string; // Base64 encoded image
}

export interface UpdateUserAvatarRequest {
  avatar?: string; // Base64 encoded image (empty string to remove)
}
