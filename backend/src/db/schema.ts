// Re-export all schemas for backward compatibility
export * from './schema/index';

// Re-export validation schemas for backward compatibility
export { userValidationSchema, registerSchema, loginSchema } from '../validation/users';
export { createGoalSchema, updateGoalSchema } from '../validation/goals';
export { createFamilyMemberSchema, updateFamilyMemberSchema, createFamilyTaskFeedbackSchema } from '../validation/family';
export { createFocusSchema, updateFocusSchema, batchUpdateFocusesSchema } from '../validation/focus';
export { createSimpleTodoSchema, updateSimpleTodoSchema, completeSimpleTodoSchema } from '../validation/todos';
export {
  createExperimentSchema,
  updateExperimentSchema,
  createExperimentTaskSchema,
  updateExperimentTaskSchema,
  completeExperimentTaskSchema,
  getExperimentDashboardSchema,
} from '../validation/experiments';
export { createJournalSchema, updateJournalSchema, addChatMessageSchema, journalDateSchema, finishJournalSchema } from '../validation/journals';
export {
  createQuestSchema,
  updateQuestSchema,
  linkQuestExperimentSchema,
  linkQuestJournalSchema,
  questIdSchema,
  questDashboardSchema,
} from '../validation/quests';
export { createUserAttributeSchema, updateUserAttributeSchema, getUserAttributesSchema, inferredAttributeSchema, attributeInferenceResultSchema } from '../validation/user-attributes';

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
export type { Focus, NewFocus, FocusUpdate, CreateFocusRequest, UpdateFocusRequest, BatchUpdateFocusesRequest } from '../types/focus';
export type { SimpleTodo, NewSimpleTodo, UpdateSimpleTodo, CreateSimpleTodoRequest, UpdateSimpleTodoRequest, SimpleTodoResponse } from '../types/todos';
export type {
  Experiment,
  CreateExperiment,
  UpdateExperiment,
  ExperimentTask,
  CreateExperimentTask,
  UpdateExperimentTask,
  ExperimentTaskCompletion,
  CreateExperimentTaskCompletion,
  CreateExperimentRequest,
  UpdateExperimentRequest,
  CreateExperimentTaskRequest,
  UpdateExperimentTaskRequest,
  CompleteExperimentTaskRequest,
  ExperimentResponse,
  ExperimentTaskResponse,
  ExperimentTaskCompletionResponse,
  ExperimentWithTasksResponse,
  ExperimentTaskWithCompletionsResponse,
  ExperimentDashboardResponse,
} from '../types/experiments';
export type {
  Journal,
  NewJournal,
  CreateJournalRequest,
  UpdateJournalRequest,
  ChatMessage,
  StartReflectionRequest,
  AddChatMessageRequest,
  FinishJournalRequest,
  JournalResponse,
  TodayJournalResponse,
  ListJournalsRequest,
  ListJournalsResponse,
  JournalListItem,
} from '../types/journals';
export type {
  Quest,
  NewQuest,
  QuestExperiment,
  NewQuestExperiment,
  QuestJournal,
  NewQuestJournal,
  CreateQuestRequest,
  UpdateQuestRequest,
  QuestResponse,
  QuestWithExperimentsAndJournalsResponse,
  QuestDashboardResponse,
  LinkQuestExperimentRequest,
  LinkQuestJournalRequest,
} from '../types/quests';
export type {
  UserAttribute,
  CreateUserAttribute,
  UpdateUserAttribute,
  AttributeSource,
  AttributeCategory,
  CreateUserAttributeRequest,
  UpdateUserAttributeRequest,
  UserAttributeResponse,
  GroupedUserAttributes,
  InferredAttribute,
  AttributeInferenceResult,
} from '../types/user-attributes';
