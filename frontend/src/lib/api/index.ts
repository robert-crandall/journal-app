// Export all API clients here
export { goalsApi } from './goals';
export { usersApi } from './users';
export { default as tagsApi } from './tags';

// Re-export types from API clients
export type { GoalWithParsedTags, CreateGoalWithTags, UpdateGoalWithTags } from './goals';
export type { ApiUser } from './users';
export type { Tag, TagWithCount } from './tags';
