import { z } from 'zod';

/**
 * Schema for validating OpenAI-related environment variables
 */
const gptEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_DEFAULT_MODEL: z.string().default('gpt-4o'),
  GPT_DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

/**
 * Load and validate OpenAI configuration from environment variables
 */
export function loadGptConfig() {
  try {
    return gptEnvSchema.parse(process.env);
  } catch (error) {
    throw new Error(`Invalid GPT configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Central configuration for GPT integration
 */
export const gptConfig = {
  /**
   * Get the default OpenAI model to use
   */
  getDefaultModel: (): string => {
    try {
      const config = loadGptConfig();
      return config.OPENAI_DEFAULT_MODEL;
    } catch (error) {
      console.warn('Failed to load GPT config, falling back to default model', error);
      return 'gpt-4o';
    }
  },

  /**
   * Get the OpenAI API key
   */
  getApiKey: (): string => {
    const config = loadGptConfig();
    return config.OPENAI_API_KEY;
  },

  /**
   * Check if GPT debug mode is enabled
   */
  isDebugEnabled: (): boolean => {
    try {
      const config = loadGptConfig();
      return config.GPT_DEBUG;
    } catch (error) {
      return false;
    }
  },

  /**
   * Default retry settings - can be expanded in the future
   */
  retrySettings: {
    maxRetries: 3,
    initialDelay: 1000, // ms
  },
};
