// Generate tasks types - shared between backend and frontend

export interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  todoId?: string;
}

export interface GeneratedTasksContext {
  character?: {
    name: string;
    class: string;
    backstory?: string;
  };
  familyMembers?: Array<{
    id: string;
    name: string;
    relationship: string;
  }>;
  weather?: {
    temperature: number;
    condition: string;
    forecast: string;
  };
  activeQuests?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  activeProjects?: Array<{
    id: string;
    title: string;
    description: string;
    type: 'project' | 'adventure';
  }>;
}

export interface GeneratedTasksResponse {
  personalTask: GeneratedTask;
  familyTask: GeneratedTask;
  context: GeneratedTasksContext;
  metadata: {
    date: string;
    includedIntent: boolean;
    generatedAt: string;
  };
}

export interface GenerateTasksRequest {
  date: string;
  includeIntent: boolean;
}

export interface GeneratedTasksForDateResponse {
  date: string;
  tasks: Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    source: string;
    createdAt: string;
    expirationTime: string | null;
  }>;
  intent: {
    id: string;
    date: string;
    importanceStatement: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}
