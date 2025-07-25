import { writable } from 'svelte/store';
import type { GeneratedTasksResponse, GeneratedTasksForDateResponse } from '$lib/types/generate-tasks';
import { generateTasksApi } from '../api/generate-tasks';

// Types for the store
interface GenerateTasksState {
  lastGenerated: GeneratedTasksResponse | null;
  currentDateTasks: GeneratedTasksForDateResponse | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: GenerateTasksState = {
  lastGenerated: null,
  currentDateTasks: null,
  loading: false,
  error: null,
};

// Create the writable store
const createGenerateTasksStore = () => {
  const { subscribe, set, update } = writable<GenerateTasksState>(initialState);

  return {
    subscribe,

    // Generate tasks for a specific date
    async generateTasks(date: string, includeIntent: boolean = true) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const result = await generateTasksApi.generateTasks({ date, includeIntent });
        update((state) => ({ ...state, lastGenerated: result, loading: false }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate tasks';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to generate tasks:', error);
        throw error;
      }
    },

    // Get generated tasks for a specific date
    async getGeneratedTasksForDate(date: string) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const result = await generateTasksApi.getGeneratedTasksForDate(date);
        update((state) => ({ ...state, currentDateTasks: result, loading: false }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load generated tasks';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to load generated tasks:', error);
        throw error;
      }
    },

    // Clear error
    clearError() {
      update((state) => ({ ...state, error: null }));
    },

    // Reset store
    reset() {
      set(initialState);
    },
  };
};

// Export the store instance
export const generateTasksStore = createGenerateTasksStore();
