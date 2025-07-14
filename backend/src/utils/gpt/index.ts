/**
 * GPT Integration Module
 *
 * This module provides a structured approach to integrating OpenAI's GPT models
 * into the application, following the architecture outlined in gpt.md:
 *
 * 1. Central Configuration: API keys, model selection, debug settings
 * 2. GPT Client: Shared abstraction for API calls
 * 3. Utility Functions: Reusable helpers for prompts and parsing
 * 4. Domain-Specific Modules: Feature-specific GPT implementations
 */

// Re-export configuration
export { gptConfig } from './config';

// Re-export the client
export { callGptApi } from './client';
export type { ChatMessage, GptOptions, GptResponse } from './client';

// Re-export utility functions
export { createSystemPrompt, createUserPrompt, createPrompt, extractTagsFromText, generateTitleFromText, parseXPFromText } from './utils';

export { generateFollowUpResponse, generateJournalMetadata, generateJournalSummary } from './conversationalJournal';
export type { ChatMessage as GptChatMessage, JournalMetadata } from './conversationalJournal';

// New comprehensive user context service
export { getUserContext, formatUserContextForPrompt, getSpecificUserContext } from '../userContextService';
export type { ComprehensiveUserContext } from '../userContextService';

export { generateDailyTasks } from './taskGen';
export type { TaskGenerationRequest, TaskGenerationResponse, GeneratedTask } from './taskGen';

// Future exports:
// export { generateQuestTitle } from './questTitleGen';
// export { generateStatLevelTitles } from './statNamer';
