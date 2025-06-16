// Import and re-export everything from the local journal client
export * from './journal-client';

// Create a default client instance configured for the frontend
import { JournalApiClient } from './journal-client';

// Default client instance with frontend-specific configuration
export const journalApi = new JournalApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  defaultHeaders: {
    'X-Client': 'SvelteKit-Frontend'
  }
});
