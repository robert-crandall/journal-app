import type { focuses } from '../db/schema/focus';

export type Focus = typeof focuses.$inferSelect;
export type NewFocus = typeof focuses.$inferInsert;
export type FocusUpdate = Partial<Omit<NewFocus, 'id' | 'userId' | 'createdAt'>>;

// Request types
export interface CreateFocusRequest {
  dayOfWeek: number;
  title: string;
  description: string;
}

export interface UpdateFocusRequest {
  dayOfWeek?: number;
  title?: string;
  description?: string;
}

export interface BatchUpdateFocusesRequest {
  focuses: {
    dayOfWeek: number;
    title: string;
    description: string;
  }[];
}
