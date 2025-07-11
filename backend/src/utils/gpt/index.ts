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

// Re-export domain-specific modules
export { analyzeJournalEntry } from './journal';
export type { JournalAnalysisRequest, JournalAnalysisResponse } from './journal';

export { generateWelcomeMessage, generateFollowUpResponse, generateJournalMetadata } from './conversationalJournal';
export type { UserContext, ChatMessage as GptChatMessage, JournalMetadata } from './conversationalJournal';

export { generateDailyTasks } from './taskGen';
export type { TaskGenerationRequest, TaskGenerationResponse, GeneratedTask } from './taskGen';

// Future exports:
// export { generateQuestTitle } from './questTitleGen';
// export { generateStatLevelTitles } from './statNamer';
