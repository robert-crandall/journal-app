import type { users } from '../db/schema/users';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserUpdate = Partial<Omit<NewUser, 'id' | 'createdAt'>>;

// Exclude sensitive fields for API responses
export type PublicUser = Omit<User, 'password'>;
