// Re-export all schemas for backward compatibility
export * from './schema/index';

// Re-export validation schemas for backward compatibility
export { userValidationSchema, registerSchema, loginSchema } from '../validation/users';
export { createGoalSchema, updateGoalSchema } from '../validation/goals';
export { createFamilyMemberSchema, updateFamilyMemberSchema, createFamilyTaskFeedbackSchema } from '../validation/family';
export { startJournalSessionSchema, sendJournalMessageSchema, saveJournalEntrySchema, getJournalEntrySchema } from '../validation/journal';
export { createQuestSchema, updateQuestSchema, createQuestTaskSchema, updateQuestTaskSchema } from '../validation/quests';

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
  JournalEntry,
  NewJournalEntry,
  JournalConversationMessage,
  NewJournalConversationMessage,
  JournalSession,
  NewJournalSession,
  StartJournalSessionRequest,
  StartJournalSessionResponse,
  SendJournalMessageRequest,
  SendJournalMessageResponse,
  SaveJournalEntryRequest,
  SaveJournalEntryResponse,
  GetJournalEntriesResponse,
  JournalEntryWithDetails,
  ChatMessage,
} from '../types/journal';
export type {
  Quest,
  NewQuest,
  QuestTask,
  NewQuestTask,
  QuestWithTasks,
  QuestWithProgress,
  CreateQuestRequest,
  CreateQuestResponse,
  GetQuestsResponse,
  GetQuestResponse,
  UpdateQuestResponse,
  CompleteQuestTaskResponse,
} from '../types/quests';
