import type {
  User, UserRegisterInput, UserLoginInput, ApiResponse,
  Quest, QuestInput, QuestMilestone, QuestMilestoneInput,
  JournalEntry, JournalEntryInput, JournalAnalysisResult, JournalAnalysisInput,
  Task, TaskInput, CharacterStat, CharacterStatInput,
  Experiment, ExperimentInput,
  Conversation, ConversationInput, Message, MessageInput, UserContextInput
} from '../types/api';

/**
 * Client for making API requests to the backend
 */
export class JournalClient {
  private baseUrl: string;
  private token: string | null = null;
  
  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.token = token || null;
  }
  
  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }
  
  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
  }
  
  /**
   * Make a request to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    // Prepare headers
    const headersObj: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authentication token if available and required
    if (requiresAuth && this.token) {
      headersObj['Authorization'] = `Bearer ${this.token}`;
    }
    
    // Add any headers from options
    if (options.headers) {
      const optionHeaders = options.headers as Record<string, string>;
      Object.keys(optionHeaders).forEach(key => {
        headersObj[key] = optionHeaders[key];
      });
    }
    
    const headers = new Headers(headersObj);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'An unknown error occurred';
        throw new Error(errorMessage);
      }
      
      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  }
  
  /**
   * Authentication endpoints
   */
  async register(input: UserRegisterInput): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      false
    );
    
    return response.data!;
  }
  
  async login(input: UserLoginInput): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      false
    );
    
    return response.data!;
  }
  
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.request<{ user: User }>('/me');
    return response.data!;
  }
  
  /**
   * Quest endpoints
   */
  async getQuests(): Promise<{ quests: Quest[] }> {
    const response = await this.request<{ quests: Quest[] }>('/quests');
    return response.data!;
  }
  
  async getQuestById(id: string): Promise<{ quest: Quest; milestones: QuestMilestone[] }> {
    const response = await this.request<{ quest: Quest; milestones: QuestMilestone[] }>(`/quests/${id}`);
    return response.data!;
  }
  
  async createQuest(input: QuestInput): Promise<{ quest: Quest }> {
    const response = await this.request<{ quest: Quest }>(
      '/quests',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async updateQuest(id: string, input: QuestInput): Promise<{ quest: Quest }> {
    const response = await this.request<{ quest: Quest }>(
      `/quests/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async completeQuest(id: string): Promise<{ quest: Quest }> {
    const response = await this.request<{ quest: Quest }>(
      `/quests/${id}/complete`,
      {
        method: 'POST',
      }
    );
    
    return response.data!;
  }
  
  async deleteQuest(id: string): Promise<void> {
    await this.request(
      `/quests/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
  
  async createQuestMilestone(input: QuestMilestoneInput): Promise<{ milestone: QuestMilestone }> {
    const response = await this.request<{ milestone: QuestMilestone }>(
      '/quest-milestones',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async completeMilestone(id: string): Promise<{ milestone: QuestMilestone }> {
    const response = await this.request<{ milestone: QuestMilestone }>(
      `/quest-milestones/${id}/complete`,
      {
        method: 'POST',
      }
    );
    
    return response.data!;
  }
  
  /**
   * Journal entry endpoints
   */
  async getJournalEntries(): Promise<{ entries: JournalEntry[] }> {
    const response = await this.request<{ entries: JournalEntry[] }>('/journal');
    return response.data!;
  }
  
  async getJournalEntryById(id: string): Promise<{ entry: JournalEntry }> {
    const response = await this.request<{ entry: JournalEntry }>(`/journal/${id}`);
    return response.data!;
  }
  
  async createJournalEntry(input: JournalEntryInput): Promise<{ entry: JournalEntry }> {
    const response = await this.request<{ entry: JournalEntry }>(
      '/journal',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async updateJournalEntry(id: string, input: JournalEntryInput): Promise<{ entry: JournalEntry }> {
    const response = await this.request<{ entry: JournalEntry }>(
      `/journal/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async deleteJournalEntry(id: string): Promise<void> {
    await this.request(
      `/journal/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
  
  async analyzeJournalEntry(input: JournalAnalysisInput): Promise<{ analysis: JournalAnalysisResult }> {
    const response = await this.request<{ analysis: JournalAnalysisResult }>(
      '/journal/analyze',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  /**
   * Task endpoints
   */
  async getTasks(): Promise<{ tasks: Task[] }> {
    const response = await this.request<{ tasks: Task[] }>('/tasks');
    return response.data!;
  }
  
  async getTaskById(id: string): Promise<{ task: Task }> {
    const response = await this.request<{ task: Task }>(`/tasks/${id}`);
    return response.data!;
  }
  
  async createTask(input: TaskInput): Promise<{ task: Task }> {
    const response = await this.request<{ task: Task }>(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async updateTask(id: string, input: TaskInput): Promise<{ task: Task }> {
    const response = await this.request<{ task: Task }>(
      `/tasks/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async completeTask(id: string): Promise<{ task: Task }> {
    const response = await this.request<{ task: Task }>(
      `/tasks/${id}/complete`,
      {
        method: 'POST',
      }
    );
    
    return response.data!;
  }
  
  async deleteTask(id: string): Promise<void> {
    await this.request(
      `/tasks/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
  
  /**
   * Experiment endpoints
   */
  async getExperiments(): Promise<{ experiments: Experiment[] }> {
    const response = await this.request<{ experiments: Experiment[] }>('/experiments');
    return response.data!;
  }
  
  async getExperimentById(id: string): Promise<{ experiment: Experiment }> {
    const response = await this.request<{ experiment: Experiment }>(`/experiments/${id}`);
    return response.data!;
  }
  
  async createExperiment(input: ExperimentInput): Promise<{ experiment: Experiment }> {
    const response = await this.request<{ experiment: Experiment }>(
      '/experiments',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async updateExperiment(id: string, input: ExperimentInput): Promise<{ experiment: Experiment }> {
    const response = await this.request<{ experiment: Experiment }>(
      `/experiments/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async completeExperiment(id: string, isSuccessful: boolean): Promise<{ experiment: Experiment }> {
    const response = await this.request<{ experiment: Experiment }>(
      `/experiments/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ isSuccessful }),
      }
    );
    
    return response.data!;
  }
  
  async deleteExperiment(id: string): Promise<void> {
    await this.request(
      `/experiments/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
  
  /**
   * Character Stats endpoints
   */
  async getCharacterStats(): Promise<{ characterStats: CharacterStat[] }> {
    const response = await this.request<{ characterStats: CharacterStat[] }>('/character-stats');
    return response.data!;
  }
  
  async getCharacterStatById(id: string): Promise<{ characterStat: CharacterStat }> {
    const response = await this.request<{ characterStat: CharacterStat }>(`/character-stats/${id}`);
    return response.data!;
  }
  
  async createCharacterStat(input: CharacterStatInput): Promise<{ characterStat: CharacterStat }> {
    const response = await this.request<{ characterStat: CharacterStat }>(
      '/character-stats',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async updateCharacterStat(id: string, input: CharacterStatInput): Promise<{ characterStat: CharacterStat }> {
    const response = await this.request<{ characterStat: CharacterStat }>(
      `/character-stats/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async deleteCharacterStat(id: string): Promise<void> {
    await this.request(
      `/character-stats/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
  
  /**
   * Conversation endpoints (AI assistant)
   */
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const response = await this.request<{ conversations: Conversation[] }>('/conversations');
    return response.data!;
  }
  
  async getConversationById(id: string): Promise<{ conversation: Conversation }> {
    const response = await this.request<{ conversation: Conversation }>(`/conversations/${id}`);
    return response.data!;
  }
  
  async createConversation(input: ConversationInput): Promise<{ conversation: Conversation }> {
    const response = await this.request<{ conversation: Conversation }>(
      '/conversations',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async updateConversation(id: string, input: ConversationInput): Promise<{ conversation: Conversation }> {
    const response = await this.request<{ conversation: Conversation }>(
      `/conversations/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async sendMessage(input: MessageInput): Promise<{ messages: Message[] }> {
    const response = await this.request<{ messages: Message[] }>(
      '/conversations/message',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    
    return response.data!;
  }
  
  async deleteConversation(id: string): Promise<void> {
    await this.request(
      `/conversations/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
  
  /**
   * User context endpoints (for AI)
   */
  async getUserContext(): Promise<{ context: Record<string, string> }> {
    const response = await this.request<{ context: Record<string, string> }>('/user-context');
    return response.data!;
  }
  
  async setUserContext(input: UserContextInput): Promise<void> {
    await this.request(
      '/user-context',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
  }
  
  async deleteUserContext(key: string): Promise<void> {
    await this.request(
      `/user-context/${key}`,
      {
        method: 'DELETE',
      }
    );
  }
}
