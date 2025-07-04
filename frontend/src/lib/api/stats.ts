import { api } from '../api';
import { authStore } from '../stores/auth';
import { get } from 'svelte/store';

// Import the types from our types directory
// These are re-exported from the backend
import type {
  Stat,
  StatGroup,
  StatTemplate,
  StatSampleActivity,
  StatLevelTitle,
  CreateStatData,
  UpdateStatData,
  GrantXPData,
  AssignTemplatesData,
  CreateSampleActivityData,
  CreateStatLevelTitleData
} from '../types/stats';

// Stats API client
export const statsApi = {
  // Get all stats for the current character
  async getStats(): Promise<Stat[]> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats.$get({
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Stats API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { success: boolean; data: Stat[] };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get stats API request failed:', error);
      throw error;
    }
  },

  // Create a new stat
  async createStat(data: CreateStatData): Promise<Stat> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats.$post({
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        json: data
      });

      if (!response.ok) {
        console.error('Create stat API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { data: Stat };
      return result.data;
    } catch (error) {
      console.error('Create stat API request failed:', error);
      throw error;
    }
  },

  // Update an existing stat
  async updateStat(statId: string, data: UpdateStatData): Promise<Stat> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats[':statId'].$put({
        param: { statId },
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        json: data
      });

      if (!response.ok) {
        console.error('Update stat API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));

        if (response.status === 400 && (result as any).error?.issues) {
          const issues = (result as any).error.issues;
          const messages = issues.map((issue: any) => issue.message).join(', ');
          throw new Error(`Validation error: ${messages}`);
        }

        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { data: Stat };
      return result.data;
    } catch (error) {
      console.error('Update stat API request failed:', error);
      throw error;
    }
  },

  // Delete a stat
  async deleteStat(statId: string): Promise<void> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats[':statId'].$delete({
        param: { statId },
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Delete stat API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Delete stat API request failed:', error);
      throw error;
    }
  },

  // Grant XP to a stat
  async grantXP(data: GrantXPData): Promise<Stat> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats['grant-xp'].$post({
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        json: data
      });

      if (!response.ok) {
        console.error('Grant XP API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { data: Stat };
      return result.data;
    } catch (error) {
      console.error('Grant XP API request failed:', error);
      throw error;
    }
  },

  // Level up a stat
  async levelUp(statId: string): Promise<Stat> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats['level-up'].$post({
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        json: { statId }
      });

      if (!response.ok) {
        console.error('Level up API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { data: Stat };
      return result.data;
    } catch (error) {
      console.error('Level up API request failed:', error);
      throw error;
    }
  },

  // Get all stat groups
  async getStatGroups(): Promise<StatGroup[]> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats.groups.$get({
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Get stat groups API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { success: boolean; data: StatGroup[] };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get stat groups API request failed:', error);
      throw error;
    }
  },

  // Get all stat templates
  async getStatTemplates(): Promise<StatTemplate[]> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats.templates.$get({
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Get stat templates API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { success: boolean; data: StatTemplate[] };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get stat templates API request failed:', error);
      throw error;
    }
  },

  // Get stat templates for a specific character class
  async getStatTemplatesByClass(characterClass: string): Promise<StatTemplate[]> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats.templates['by-class'][':characterClass'].$get({
        param: { characterClass },
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Get stat templates by class API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { success: boolean; data: StatTemplate[] };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get stat templates by class API request failed:', error);
      throw error;
    }
  },

  // Assign templates to a character
  async assignTemplates(data: AssignTemplatesData): Promise<Stat[]> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats['assign-templates'].$post({
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        json: data
      });

      if (!response.ok) {
        console.error('Assign templates API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { success: boolean; data: Stat[] };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Assign templates API request failed:', error);
      throw error;
    }
  },

  // Get sample activities for a stat
  async getSampleActivities(statId: string): Promise<StatSampleActivity[]> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats[':statId'].activities.$get({
        param: { statId },
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Get sample activities API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { success: boolean; data: StatSampleActivity[] };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get sample activities API request failed:', error);
      throw error;
    }
  },

  // Create a sample activity for a stat
  async createSampleActivity(statId: string, data: CreateSampleActivityData): Promise<StatSampleActivity> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats[':statId'].activities.$post({
        param: { statId },
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        json: data
      });

      if (!response.ok) {
        console.error('Create sample activity API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { data: StatSampleActivity };
      return result.data;
    } catch (error) {
      console.error('Create sample activity API request failed:', error);
      throw error;
    }
  },

  // Get level titles for a stat
  async getLevelTitles(statId: string): Promise<StatLevelTitle[]> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats[':statId']['level-titles'].$get({
        param: { statId },
        header: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Get level titles API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { success: boolean; data: StatLevelTitle[] };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get level titles API request failed:', error);
      throw error;
    }
  },

  // Create a level title for a stat
  async createLevelTitle(statId: string, data: CreateStatLevelTitleData): Promise<StatLevelTitle> {
    const { token } = get(authStore);

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.api.stats[':statId']['level-titles'].$post({
        param: { statId },
        header: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        json: data
      });

      if (!response.ok) {
        console.error('Create level title API error:', response.status, response.statusText);
        const result = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
          (result as any).error || `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json() as { data: StatLevelTitle };
      return result.data;
    } catch (error) {
      console.error('Create level title API request failed:', error);
      throw error;
    }
  }
};
