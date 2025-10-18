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
export { getWeatherSchema, weatherResponseSchema, openWeatherMapResponseSchema } from '../validation/weather';
export { generateMetricsSchema, listMetricSummariesSchema, metricSummaryIdSchema } from '../validation/metric-summaries';
export {
  createMeasurementSchema,
  updateMeasurementSchema,
  listMeasurementsSchema,
  measurementIdSchema,
  updateUserWithMeasurementFieldsSchema,
} from '../validation/measurements';
export { createPhotoSchema, updatePhotoSchema, listPhotosSchema, photoIdSchema, fileUploadSchema, bulkPhotoUploadSchema } from '../validation/photos';
export { createDailyQuestionSchema, updateDailyQuestionSchema, dailyQuestionIdSchema, getTodayQuestionSchema } from '../validation/daily-questions';

// Re-export types for backward compatibility
export type { User, NewUser, PublicUser, Sex } from '../../../shared/types/users';
export type { Goal, CreateGoal, UpdateGoal, GoalWithParsedTags, GoalWithTags, CreateGoalWithTags, UpdateGoalWithTags } from '../../../shared/types/goals';
export type { Tag, CreateTag, UpdateTag, GoalTag, CreateGoalTag, TagWithCount, CreateTagWithName } from '../../../shared/types/tags';
export type {
  FamilyMember,
  NewFamilyMember,
  UpdateFamilyMember,
  FamilyTaskFeedback,
  NewFamilyTaskFeedback,
  CreateFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  CreateFamilyTaskFeedbackRequest,
} from '../../../shared/types/family';
export type { Focus, NewFocus, FocusUpdate, CreateFocusRequest, UpdateFocusRequest, BatchUpdateFocusesRequest } from '../../../shared/types/focus';
export type {
  SimpleTodo,
  NewSimpleTodo,
  UpdateSimpleTodo,
  CreateSimpleTodoRequest,
  UpdateSimpleTodoRequest,
  SimpleTodoResponse,
} from '../../../shared/types/todos';
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
} from '../../../shared/types/experiments';
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
} from '../../../shared/types/journals';
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
} from '../../../shared/types/quests';
export type {
  DailyWeather,
  NewDailyWeather,
  WeatherResponse,
  GetWeatherRequest,
  WeatherGovForecastResponse,
  WeatherGovPointResponse,
} from '../../../shared/types/weather';
export type {
  MetricSummary,
  NewMetricSummary,
  PeriodMetrics,
  MetricSummaryResponse,
  ListMetricSummariesRequest,
  ListMetricSummariesResponse,
  GenerateMetricsRequest,
} from '../../../shared/types/metric-summaries';
export type {
  Measurement,
  NewMeasurement,
  MeasurementUpdate,
  CreateMeasurementRequest,
  UpdateMeasurementRequest,
  MeasurementResponse,
  ListMeasurementsRequest,
  ListMeasurementsResponse,
} from '../../../shared/types/measurements';
export type {
  Photo,
  NewPhoto,
  PhotoUpdate,
  CreatePhotoRequest,
  UpdatePhotoRequest,
  BulkPhotoUploadRequest,
  PhotoResponse,
  ListPhotosRequest,
  ListPhotosResponse,
  PhotoUploadResponse,
  BulkPhotoUploadResponse,
} from '../../../shared/types/photos';
export type {
  DailyQuestion,
  NewDailyQuestion,
  UpdateDailyQuestion,
  CreateDailyQuestionRequest,
  UpdateDailyQuestionRequest,
  DailyQuestionResponse,
  GetTodayQuestionResponse,
} from '../../../shared/types/daily-questions';
