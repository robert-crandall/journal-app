import { writable, get } from 'svelte/store';
import type { JournalEntry, JournalStats, CreateJournalEntryInput, UpdateJournalEntryInput } from '$lib/api/client';
import { journalApi } from '$lib/api/client';

interface JournalState {
  entries: JournalEntry[];
  stats: JournalStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  hasMore: boolean;
  currentOffset: number;
}

function createJournalStore() {
  const { subscribe, set, update } = writable<JournalState>({
    entries: [],
    stats: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    hasMore: true,
    currentOffset: 0
  });

  const loadEntries = async (options?: {
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    append?: boolean;
  }) => {
    const { sortOrder = 'desc', limit = 20, offset = 0, append = false } = options || {};
    
    update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));
    
    try {
      const [entriesResponse, statsResponse] = await Promise.all([
        journalApi.getJournalEntries({ sortOrder, limit, offset }),
        offset === 0 ? journalApi.getJournalStats() : Promise.resolve({ success: true, data: null })
      ]);

      if (entriesResponse.success) {
        const newEntries = entriesResponse.data || [];
        const hasMore = newEntries.length === limit;

        update(state => ({
          ...state,
          entries: append ? [...state.entries, ...newEntries] : newEntries,
          stats: statsResponse.success && statsResponse.data ? statsResponse.data : state.stats,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
          hasMore,
          currentOffset: append ? offset + newEntries.length : newEntries.length
        }));
      } else {
        set({
          entries: [],
          stats: null,
          isLoading: false,
          error: entriesResponse.error || 'Failed to load journal entries',
          lastUpdated: null,
          hasMore: false,
          currentOffset: 0
        });
      }
    } catch (error) {
      set({
        entries: [],
        stats: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load journal entries',
        lastUpdated: null,
        hasMore: false,
        currentOffset: 0
      });
    }
  };

  const store = {
    subscribe,
    
    // Load journal entries and stats
    load: (options?: { sortOrder?: 'asc' | 'desc'; limit?: number }) => 
      loadEntries({ ...options, offset: 0, append: false }),

    // Load more entries (pagination)
    loadMore: async () => {
      const currentState = get(store);
      if (!currentState.hasMore || currentState.isLoading) return;
      
      await loadEntries({
        offset: currentState.currentOffset,
        append: true
      });
    },

    // Create a new journal entry
    create: async (entryData: CreateJournalEntryInput) => {
      try {
        const response = await journalApi.createJournalEntry(entryData);
        if (response.success && response.data) {
          update(state => ({
            ...state,
            entries: [response.data!, ...state.entries],
            stats: state.stats ? {
              ...state.stats,
              total: state.stats.total + 1,
              thisWeek: state.stats.thisWeek + 1,
              thisMonth: state.stats.thisMonth + 1
            } : null
          }));
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to create journal entry');
        }
      } catch (error) {
        throw error;
      }
    },

    // Update an existing journal entry
    update: async (entryId: string, entryData: UpdateJournalEntryInput) => {
      try {
        const response = await journalApi.updateJournalEntry(entryId, entryData);
        if (response.success && response.data) {
          update(state => ({
            ...state,
            entries: state.entries.map(entry =>
              entry.id === entryId ? response.data! : entry
            )
          }));
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to update journal entry');
        }
      } catch (error) {
        throw error;
      }
    },

    // Delete a journal entry
    delete: async (entryId: string) => {
      try {
        const response = await journalApi.deleteJournalEntry(entryId);
        if (response.success) {
          update(state => ({
            ...state,
            entries: state.entries.filter(entry => entry.id !== entryId),
            stats: state.stats ? {
              ...state.stats,
              total: Math.max(0, state.stats.total - 1)
            } : null
          }));
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to delete journal entry');
        }
      } catch (error) {
        throw error;
      }
    },

    // Get a specific entry by ID
    getById: async (entryId: string) => {
      try {
        const response = await journalApi.getJournalEntry(entryId);
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to get journal entry');
        }
      } catch (error) {
        throw error;
      }
    },

    // Clear all data
    clear: () => {
      set({
        entries: [],
        stats: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
        hasMore: true,
        currentOffset: 0
      });
    }
  };

  return store;
}

export const journalStore = createJournalStore();
