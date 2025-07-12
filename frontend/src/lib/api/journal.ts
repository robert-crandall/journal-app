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

// API functions
export const journalApi = {
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
};
