import { authenticatedClient } from '../api';

// Local type definitions (should match backend types)
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalConversationMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary: string;
  synopsis: string | null;
  content: string | null; // Long-form content for hybrid journal mode
  reflected: boolean; // Whether the user has initiated chat/reflection mode
  startedAsChat: boolean; // Whether entry was started in chat mode (true) or long-form mode (false)
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryWithDetails extends JournalEntry {
  messages: JournalConversationMessage[];
  tags: { id: string; name: string }[];
  statTags: { id: string; name: string }[];
}

export interface StartJournalSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    message: string; // Welcome message from GPT
  };
}

export interface SendJournalMessageResponse {
  success: boolean;
  data: {
    response: string; // GPT's response
    shouldOfferSave: boolean; // True if GPT thinks it's time to save
    conversationLength: number; // Number of user messages so far
  };
}

export interface SaveJournalEntryResponse {
  success: boolean;
  data: {
    entryId: string;
    title: string;
    synopsis: string;
    summary: string;
    tags: string[]; // Tag names
    statTags: string[]; // Stat names
    familyTags: string[]; // Family member names
  };
}

export interface GetJournalEntriesResponse {
  success: boolean;
  data: JournalEntryWithDetails[];
}

export interface StartLongFormJournalResponse {
  success: boolean;
  data: {
    entryId: string;
  };
}

export interface SaveLongFormJournalResponse {
  success: boolean;
  data: {
    entryId: string;
    title: string;
    synopsis: string;
    summary: string;
  };
}

export interface StartReflectionResponse {
  success: boolean;
  data: {
    sessionId: string;
    message: string; // Initial reflection message from GPT
  };
}

export interface SaveSimpleLongFormJournalResponse {
  success: boolean;
  data: {
    entryId: string;
    title: string;
  };
}

export interface GetJournalSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    messages: ChatMessage[];
    isActive: boolean;
  };
}

export interface UpdateLongFormJournalResponse {
  success: boolean;
  data: {
    entryId: string;
    title: string;
    content: string;
  };
}

// API functions
export const journalApi = {
  // Chat-first mode API methods
  async startSession(): Promise<StartJournalSessionResponse['data']> {
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })) as StartJournalSessionResponse;

    if (!result.success) {
      throw new Error('Failed to start journal session');
    }

    return result.data;
  },

  async sendMessage(sessionId: string, message: string): Promise<SendJournalMessageResponse['data']> {
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    })) as SendJournalMessageResponse;

    if (!result.success) {
      throw new Error('Failed to send message');
    }

    return result.data;
  },

  async saveEntry(sessionId: string): Promise<SaveJournalEntryResponse['data']> {
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/save', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })) as SaveJournalEntryResponse;

    if (!result.success) {
      throw new Error('Failed to save journal entry');
    }

    return result.data;
  },

  // Long-form first mode API methods
  async startLongForm(): Promise<StartLongFormJournalResponse['data']> {
    // Use direct fetch instead of the Hono client for deeply nested routes
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/longform/start', {
      method: 'POST',
      body: JSON.stringify({}),
    })) as StartLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to start long-form journal entry');
    }

    return result.data;
  },

  async saveLongForm(content: string): Promise<SaveLongFormJournalResponse['data']> {
    // Use direct fetch instead of the Hono client for deeply nested routes
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/longform/save', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })) as SaveLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to save long-form journal entry');
    }

    return result.data;
  },

  async saveSimpleLongForm(content: string, entryId?: string): Promise<SaveSimpleLongFormJournalResponse['data']> {
    // Use direct fetch instead of the Hono client for deeply nested routes
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/longform/save-simple', {
      method: 'POST',
      body: JSON.stringify({ content, ...(entryId ? { entryId } : {}) }),
    })) as SaveSimpleLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to save journal entry');
    }

    return result.data;
  },

  async startReflection(entryId: string): Promise<StartReflectionResponse['data']> {
    // Use direct fetch instead of the Hono client for deeply nested routes
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/reflection/start', {
      method: 'POST',
      body: JSON.stringify({ entryId }),
    })) as StartReflectionResponse;

    if (!result.success) {
      throw new Error('Failed to start reflection');
    }

    return result.data;
  },

  async getSession(sessionId: string): Promise<GetJournalSessionResponse['data']> {
    // Use direct fetch instead of the Hono client for deeply nested routes
    const { apiFetch } = await import('../api');
    const result = (await apiFetch(`/api/journal/session/${sessionId}`, {
      method: 'GET',
    })) as GetJournalSessionResponse;

    if (!result.success) {
      throw new Error('Failed to get session data');
    }

    return result.data;
  },

  // Common API methods
  async getEntries(): Promise<JournalEntryWithDetails[]> {
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal', {
      method: 'GET',
    })) as GetJournalEntriesResponse;

    if (!result.success) {
      throw new Error('Failed to get journal entries');
    }

    return result.data;
  },

  async getEntry(entryId: string): Promise<JournalEntryWithDetails> {
    const { apiFetch } = await import('../api');
    const result = (await apiFetch(`/api/journal/${entryId}`, {
      method: 'GET',
    })) as { success: boolean; data: JournalEntryWithDetails };

    if (!result.success) {
      throw new Error('Failed to get journal entry');
    }

    return result.data;
  },

  async updateLongForm(entryId: string, content: string): Promise<UpdateLongFormJournalResponse['data']> {
    // Use direct fetch instead of the Hono client for deeply nested routes
    const { apiFetch } = await import('../api');
    const result = (await apiFetch('/api/journal/longform/update', {
      method: 'POST',
      body: JSON.stringify({ entryId, content }),
    })) as UpdateLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to update journal entry');
    }

    return result.data;
  },
};
