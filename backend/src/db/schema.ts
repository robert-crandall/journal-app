// Re-export all schemas for backward compatibility
export * from './schema/index';

// Re-export validation schemas for backward compatibility
export { userValidationSchema, registerSchema, loginSchema } from '../validation/users';
export { createGoalSchema, updateGoalSchema } from '../validation/goals';

// Re-export types for backward compatibility
export type { User, NewUser, PublicUser } from '../types/users';
export type { Goal, CreateGoal, UpdateGoal, GoalWithParsedTags, CreateGoalWithTags } from '../types/goals';
