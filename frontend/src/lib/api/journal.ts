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
    const response = await authenticatedClient.api.journal.start.$post({
      json: {},
    });
    const result = (await response.json()) as StartJournalSessionResponse;

    if (!result.success) {
      throw new Error('Failed to start journal session');
    }

    return result.data;
  },

  async sendMessage(sessionId: string, message: string): Promise<SendJournalMessageResponse['data']> {
    const response = await authenticatedClient.api.journal.message.$post({
      json: { sessionId, message },
    });
    const result = (await response.json()) as SendJournalMessageResponse;

    if (!result.success) {
      throw new Error('Failed to send message');
    }

    return result.data;
  },

  async saveEntry(sessionId: string): Promise<SaveJournalEntryResponse['data']> {
    const response = await authenticatedClient.api.journal.save.$post({
      json: { sessionId },
    });
    const result = (await response.json()) as SaveJournalEntryResponse;

    if (!result.success) {
      throw new Error('Failed to save journal entry');
    }

    return result.data;
  },

  // Long-form first mode API methods
  async startLongForm(): Promise<StartLongFormJournalResponse['data']> {
    const response = await authenticatedClient.api.journal.longform.start.$post({
      json: {},
    });
    const result = (await response.json()) as StartLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to start long-form journal entry');
    }

    return result.data;
  },

  async saveLongForm(content: string): Promise<SaveLongFormJournalResponse['data']> {
    const response = await authenticatedClient.api.journal.longform.save.$post({
      json: { content },
    });
    const result = (await response.json()) as SaveLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to save long-form journal entry');
    }

    return result.data;
  },

  async saveSimpleLongForm(content: string, entryId?: string): Promise<SaveSimpleLongFormJournalResponse['data']> {
    const response = await authenticatedClient.api.journal.longform['save-simple'].$post({
      json: { content, ...(entryId ? { entryId } : {}) },
    });
    const result = (await response.json()) as SaveSimpleLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to save journal entry');
    }

    return result.data;
  },

  async startReflection(entryId: string): Promise<StartReflectionResponse['data']> {
    const response = await authenticatedClient.api.journal.reflection.start.$post({
      json: { entryId },
    });
    const result = (await response.json()) as StartReflectionResponse;

    if (!result.success) {
      throw new Error('Failed to start reflection');
    }

    return result.data;
  },

  async getSession(sessionId: string): Promise<GetJournalSessionResponse['data']> {
    const response = await authenticatedClient.api.journal.session[':id'].$get({
      param: { id: sessionId },
    });
    const result = (await response.json()) as GetJournalSessionResponse;

    if (!result.success) {
      throw new Error('Failed to get session data');
    }

    return result.data;
  },

  // Common API methods
  async getEntries(): Promise<JournalEntryWithDetails[]> {
    const response = await authenticatedClient.api.journal.$get();
    const result = (await response.json()) as GetJournalEntriesResponse;

    if (!result.success) {
      throw new Error('Failed to get journal entries');
    }

    return result.data;
  },

  async getEntry(entryId: string): Promise<JournalEntryWithDetails> {
    const response = await authenticatedClient.api.journal[':id'].$get({
      param: { id: entryId },
    });
    const result = (await response.json()) as { success: boolean; data: JournalEntryWithDetails };

    if (!result.success) {
      throw new Error('Failed to get journal entry');
    }

    return result.data;
  },

  async updateLongForm(entryId: string, content: string): Promise<UpdateLongFormJournalResponse['data']> {
    const response = await authenticatedClient.api.journal.longform.update.$post({
      json: { entryId, content },
    });
    const result = (await response.json()) as UpdateLongFormJournalResponse;

    if (!result.success) {
      throw new Error('Failed to update journal entry');
    }

    return result.data;
  },
};
