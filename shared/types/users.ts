// User types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

// Allowed GPT tones for personalized interactions
export const GPT_TONES = ['friendly', 'motivational', 'funny', 'serious', 'minimal', 'wholesome'] as const;
export type GptTone = (typeof GPT_TONES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  avatar: string | null;
  gptTone: GptTone;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  id?: string;
  email: string;
  name: string;
  password: string;
  avatar?: string | null;
  gptTone?: GptTone;
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
  gptTone?: GptTone;
}

export interface UpdateUserAvatarRequest {
  avatar?: string; // Base64 encoded image (empty string to remove)
}
