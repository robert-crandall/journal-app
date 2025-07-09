// Export all API clients here
export { goalsApi } from './goals';
export { default as tagsApi } from './tags';
export { tasksApi } from './tasks';
export { questsApi } from './quests';
export { projectsApi } from './projects';
export { journalApi } from './journal';

// Re-export types from API clients
export type { GoalWithParsedTags, CreateGoalWithTags, UpdateGoalWithTags } from './goals';
export type { Tag, TagWithCount } from './tags';
export type { 
  Task, 
  TaskCompletion, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskWithRelations,
  DailyTaskView 
} from './tasks';
export type { Quest, CreateQuestRequest, UpdateQuestRequest, QuestWithRelations } from './quests';
export type { 
  Project, 
  ProjectSubtask,
  ProjectWithRelations,
  CreateProjectRequest, 
  UpdateProjectRequest,
  CreateProjectSubtaskRequest,
  UpdateProjectSubtaskRequest
} from './projects';
export type { 
  JournalEntry, 
  CreateJournalEntryRequest, 
  UpdateJournalEntryRequest
} from './journal';
