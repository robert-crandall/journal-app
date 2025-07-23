import { apiFetch } from '../api';
import type { XpGrantWithEntity } from '$lib/types/xpGrants';
export type { XpGrantWithEntity } from '$lib/types/xpGrants';

export class XpGrantsService {
  /**
   * Get XP grants for a specific journal entry
   */
  static async getJournalXpGrants(journalId: string): Promise<XpGrantWithEntity[]> {
    const response = await apiFetch(`/api/xp-grants/journal/${journalId}`);
    return response.data;
  }

  /**
   * Get recent XP grants for the user
   */
  static async getRecentXpGrants(limit = 10): Promise<XpGrantWithEntity[]> {
    const response = await apiFetch(`/api/xp-grants/recent?limit=${limit}`);
    return response.data;
  }

  /**
   * Get XP grants by entity type
   */
  static async getXpGrantsByType(entityType: string, limit = 10): Promise<XpGrantWithEntity[]> {
    const response = await apiFetch(`/api/xp-grants/by-type/${entityType}?limit=${limit}`);
    return response.data;
  }
}
