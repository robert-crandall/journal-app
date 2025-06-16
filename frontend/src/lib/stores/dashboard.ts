import { writable } from 'svelte/store';
import type { DashboardData, Task, JournalEntry } from '$lib/api/client';
import { journalApi } from '$lib/api/client';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

function createDashboardStore() {
  const { subscribe, set, update } = writable<DashboardState>({
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const load = async () => {
    update(state => ({ ...state, isLoading: true, error: null }));
    
    try {
      const response = await journalApi.getDashboard();
      if (response.success && response.data) {
        set({
          data: response.data,
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        set({
          data: null,
          isLoading: false,
          error: response.error || 'Failed to load dashboard',
          lastUpdated: null
        });
      }
    } catch (error) {
      set({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard',
        lastUpdated: null
      });
    }
  };

  return {
    subscribe,
    
    // Load dashboard data
    load,

    // Refresh dashboard data
    refresh: async () => {
      return await load();
    },

    // Clear dashboard data
    clear: () => {
      set({
        data: null,
        isLoading: false,
        error: null,
        lastUpdated: null
      });
    },

    // Update task in dashboard after changes
    updateTask: (updatedTask: Task) => {
      update(state => {
        if (!state.data) return state;

        const updatedUpcoming = state.data.tasks.upcoming.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        );

        return {
          ...state,
          data: {
            ...state.data,
            tasks: {
              ...state.data.tasks,
              upcoming: updatedUpcoming
            }
          }
        };
      });
    },

    // Remove task from dashboard after deletion
    removeTask: (taskId: string) => {
      update(state => {
        if (!state.data) return state;

        const updatedUpcoming = state.data.tasks.upcoming.filter(task => task.id !== taskId);

        return {
          ...state,
          data: {
            ...state.data,
            tasks: {
              ...state.data.tasks,
              upcoming: updatedUpcoming
            }
          }
        };
      });
    },

    // Add new journal entry to recent list
    addJournalEntry: (newEntry: JournalEntry) => {
      update(state => {
        if (!state.data) return state;

        const updatedRecent = [newEntry, ...state.data.journal.recent].slice(0, 3);

        return {
          ...state,
          data: {
            ...state.data,
            journal: {
              ...state.data.journal,
              recent: updatedRecent,
              stats: {
                ...state.data.journal.stats,
                total: state.data.journal.stats.total + 1
              }
            }
          }
        };
      });
    }
  };
}

export const dashboardStore = createDashboardStore();
