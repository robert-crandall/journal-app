// Import and re-export everything from the backend client
export * from '@journal-app/backend/client';

// Create a default client instance configured for the frontend
import { createJournalApiClient } from '@journal-app/backend/client';

// Default client instance with frontend-specific configuration
export const journalApi = createJournalApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  defaultHeaders: {
    'X-Client': 'SvelteKit-Frontend'
  }
});
