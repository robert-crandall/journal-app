// Re-export all schemas for backward compatibility
export * from './schema/index';

// Re-export validation schemas for backward compatibility
export { userValidationSchema, registerSchema, loginSchema } from '../validation/users';
export { createGoalSchema, updateGoalSchema } from '../validation/goals';
export { createFamilyMemberSchema, updateFamilyMemberSchema, createFamilyTaskFeedbackSchema } from '../validation/family';

// Re-export types for backward compatibility
export type { User, NewUser, PublicUser } from '../types/users';
export type { Goal, CreateGoal, UpdateGoal, GoalWithParsedTags, GoalWithTags, CreateGoalWithTags, UpdateGoalWithTags } from '../types/goals';
export type { Tag, CreateTag, UpdateTag, GoalTag, CreateGoalTag, TagWithCount, CreateTagWithName } from '../types/tags';
export type {
  FamilyMember,
  NewFamilyMember,
  UpdateFamilyMember,
  FamilyTaskFeedback,
  NewFamilyTaskFeedback,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  CreateFamilyTaskFeedbackRequest,
} from '../types/family';
export type {
  Task,
  NewTask,
  TaskUpdate,
  TaskCompletion,
  NewTaskCompletion,
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  TaskWithRelations,
  DailyTaskView,
} from '../types/tasks';
export type {
  Quest,
  NewQuest,
  QuestUpdate,
  CreateQuestRequest,
  UpdateQuestRequest,
  CompleteQuestRequest,
  QuestWithRelations,
  QuestDashboard,
} from '../types/quests';
export type {
  Project,
  NewProject,
  ProjectUpdate,
  ProjectSubtask,
  NewProjectSubtask,
  ProjectSubtaskUpdate,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateProjectSubtaskRequest,
  UpdateProjectSubtaskRequest,
  ProjectWithRelations,
  ProjectDashboard,
} from '../types/projects';
export type {
  JournalEntry,
  NewJournalEntry,
  JournalEntryUpdate,
  JournalEntryXpGrant,
  NewJournalEntryXpGrant,
  ConversationMessage,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  ProcessJournalEntryRequest,
  JournalAnalysisResult,
  JournalEntryWithRelations,
  JournalEntryListItem,
  QuickJournalRequest,
  JournalStats,
} from '../types/journal';
