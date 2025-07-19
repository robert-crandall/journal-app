import { apiFetch } from '../api';
import type {
  QuestResponse,
  QuestWithExperimentsAndJournalsResponse,
  QuestDashboardResponse,
  CreateQuestRequest,
  UpdateQuestRequest,
  LinkQuestExperimentRequest,
  LinkQuestJournalRequest,
} from '../types/quest';

// Type-safe quests API using fetch wrapper
export const questsApi = {
  // Get user's quests
  async getUserQuests(): Promise<QuestResponse[]> {
    try {
      const result = await apiFetch('/api/quests');
      return result.data;
    } catch (error) {
      console.error('Get user quests API request failed:', error);
      throw error;
    }
  },

  // Get specific quest by ID
  async getQuest(questId: string): Promise<QuestResponse> {
    try {
      const result = await apiFetch(`/api/quests/${questId}`);
      return result.data;
    } catch (error) {
      console.error('Get quest API request failed:', error);
      throw error;
    }
  },

  // Get quest with full details (experiments, journals, XP)
  async getQuestWithDetails(questId: string): Promise<QuestWithExperimentsAndJournalsResponse> {
    try {
      const result = await apiFetch(`/api/quests/${questId}/details`);
      return result.data;
    } catch (error) {
      console.error('Get quest details API request failed:', error);
      throw error;
    }
  },

  // Get quest dashboard data
  async getQuestDashboard(questId: string): Promise<QuestDashboardResponse> {
    try {
      const result = await apiFetch(`/api/quests/${questId}/dashboard`);
      return result.data;
    } catch (error) {
      console.error('Get quest dashboard API request failed:', error);
      throw error;
    }
  },

  // Create a new quest
  async createQuest(data: CreateQuestRequest): Promise<QuestResponse> {
    try {
      const result = await apiFetch('/api/quests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.data;
    } catch (error) {
      console.error('Create quest API request failed:', error);
      throw error;
    }
  },

  // Update an existing quest
  async updateQuest(questId: string, data: UpdateQuestRequest): Promise<QuestResponse> {
    try {
      const result = await apiFetch(`/api/quests/${questId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return result.data;
    } catch (error) {
      console.error('Update quest API request failed:', error);
      throw error;
    }
  },

  // Delete a quest
  async deleteQuest(questId: string): Promise<void> {
    try {
      await apiFetch(`/api/quests/${questId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete quest API request failed:', error);
      throw error;
    }
  },

  // Link experiment to quest
  async linkExperiment(questId: string, data: LinkQuestExperimentRequest): Promise<void> {
    try {
      await apiFetch(`/api/quests/${questId}/experiments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Link experiment API request failed:', error);
      throw error;
    }
  },

  // Unlink experiment from quest
  async unlinkExperiment(questId: string, experimentId: string): Promise<void> {
    try {
      await apiFetch(`/api/quests/${questId}/experiments/${experimentId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Unlink experiment API request failed:', error);
      throw error;
    }
  },

  // Link journal to quest
  async linkJournal(questId: string, data: LinkQuestJournalRequest): Promise<void> {
    try {
      await apiFetch(`/api/quests/${questId}/journals`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Link journal API request failed:', error);
      throw error;
    }
  },

  // Unlink journal from quest
  async unlinkJournal(questId: string, journalId: string): Promise<void> {
    try {
      await apiFetch(`/api/quests/${questId}/journals/${journalId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Unlink journal API request failed:', error);
      throw error;
    }
  },

  // Auto-link journals to quest by date range
  async autoLinkJournals(questId: string): Promise<{ linkedCount: number }> {
    try {
      const result = await apiFetch(`/api/quests/${questId}/auto-link-journals`, {
        method: 'POST',
      });
      return result.data;
    } catch (error) {
      console.error('Auto-link journals API request failed:', error);
      throw error;
    }
  },
};
