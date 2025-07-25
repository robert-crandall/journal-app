import { writable } from 'svelte/store';
import type { DailyIntentResponse } from '$lib/types/daily-intents';
import { dailyIntentsApi } from '../api/daily-intents';

// Types for the store
interface DailyIntentsState {
  currentIntent: DailyIntentResponse | null;
  recentIntents: DailyIntentResponse[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DailyIntentsState = {
  currentIntent: null,
  recentIntents: [],
  loading: false,
  error: null,
};

// Create the writable store
const createDailyIntentsStore = () => {
  const { subscribe, set, update } = writable<DailyIntentsState>(initialState);

  return {
    subscribe,

    // Get daily intent for a specific date
    async getDailyIntent(date: string) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const intent = await dailyIntentsApi.getDailyIntent(date);
        update((state) => ({ ...state, currentIntent: intent, loading: false }));
        return intent;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load daily intent';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to load daily intent:', error);
        throw error;
      }
    },

    // Create or update a daily intent
    async createOrUpdateDailyIntent(date: string, importanceStatement: string) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const intent = await dailyIntentsApi.createOrUpdateDailyIntent({
          date,
          importanceStatement,
        });
        update((state) => ({ ...state, currentIntent: intent, loading: false }));
        return intent;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save daily intent';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to save daily intent:', error);
        throw error;
      }
    },

    // Load recent daily intents
    async loadRecentIntents(limit: number = 10) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const intents = await dailyIntentsApi.getRecentDailyIntents(limit);
        update((state) => ({ ...state, recentIntents: intents, loading: false }));
        return intents;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load recent intents';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to load recent intents:', error);
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
export const dailyIntentsStore = createDailyIntentsStore();
