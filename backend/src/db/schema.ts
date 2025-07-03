// Re-export all schemas for backward compatibility
export * from './schema/index';

// Re-export validation schemas for backward compatibility
export { userValidationSchema, registerSchema, loginSchema } from '../validation/users';

// Re-export types for backward compatibility
export type { User, NewUser, PublicUser } from '../types/users';
