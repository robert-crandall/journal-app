import { apiFetch } from '../api';
import type { 
  Quest, 
  CreateQuestRequest, 
  UpdateQuestRequest,
  QuestWithRelations
} from '../../../../backend/src/types/quests';

export interface QuestFilters {
  type?: 'quest' | 'experiment';
  status?: 'active' | 'completed' | 'cancelled';
}

class QuestsApi {
  /**
   * Get all quests for the authenticated user
   */
  async getUserQuests(filters?: QuestFilters): Promise<Quest[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.status) queryParams.append('status', filters.status);

    const queryString = queryParams.toString();
    const endpoint = `/api/quests${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiFetch(endpoint);
    return response.data;
  }

  /**
   * Get a specific quest by ID
   */
  async getQuest(questId: string): Promise<Quest> {
    const response = await apiFetch(`/api/quests/${questId}`);
    return response.data;
  }

  /**
   * Create a new quest
   */
  async createQuest(questData: CreateQuestRequest): Promise<Quest> {
    const response = await apiFetch('/api/quests', {
      method: 'POST',
      body: JSON.stringify(questData),
    });
    return response.data;
  }

  /**
   * Update an existing quest
   */
  async updateQuest(questId: string, questData: UpdateQuestRequest): Promise<Quest> {
    const response = await apiFetch(`/api/quests/${questId}`, {
      method: 'PUT',
      body: JSON.stringify(questData),
    });
    return response.data;
  }

  /**
   * Complete a quest
   */
  async completeQuest(questId: string, conclusionNotes?: string): Promise<Quest> {
    const response = await apiFetch(`/api/quests/${questId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ conclusionNotes }),
    });
    return response.data;
  }

  /**
   * Cancel a quest
   */
  async cancelQuest(questId: string, conclusionNotes?: string): Promise<Quest> {
    const response = await apiFetch(`/api/quests/${questId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ conclusionNotes }),
    });
    return response.data;
  }
}

// Export a singleton instance
export const questsApi = new QuestsApi();

// Export types for components to use
export type { Quest, CreateQuestRequest, UpdateQuestRequest, QuestWithRelations };
