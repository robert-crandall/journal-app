import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { userAttributes } from '../db/schema/user-attributes';

// Base types from database schema
export type UserAttribute = InferSelectModel<typeof userAttributes>;
export type CreateUserAttribute = InferInsertModel<typeof userAttributes>;
export type UpdateUserAttribute = Partial<Omit<CreateUserAttribute, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>>;

// Valid attribute sources
export type AttributeSource = 'user_set' | 'gpt_summary' | 'journal_analysis';

// Valid attribute categories (common ones, but not restrictive)
export type AttributeCategory = 'priorities' | 'values' | 'motivators' | 'challenges' | 'strengths' | 'interests' | string;

// API request/response types
export type CreateUserAttributeRequest = {
  category: string;
  value: string;
  source?: AttributeSource;
};

export type UpdateUserAttributeRequest = {
  category?: string;
  value?: string;
  source?: AttributeSource;
};

export type UserAttributeResponse = UserAttribute;

// Grouped attributes for UI display
export type GroupedUserAttributes = {
  [category: string]: UserAttribute[];
};

// For GPT inference during summary generation
export type InferredAttribute = {
  category: string;
  value: string;
  importance?: number; // Optional importance score from GPT
};

export type AttributeInferenceResult = {
  attributes: InferredAttribute[];
  reasoning?: string; // Optional explanation from GPT
};
