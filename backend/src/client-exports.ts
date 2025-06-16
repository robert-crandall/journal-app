// Main export for the Journal App Type-Safe Client
// This is the entry point for frontend applications

// Re-export everything from the main client
export * from './client/index';

// Export demo patterns for different frameworks
export { 
  useJournalApi,
  authStore,
  basicUsageExample,
  customClientExample 
} from './client/demo';

// Export test utilities
export { runClientTests } from './client/test';
