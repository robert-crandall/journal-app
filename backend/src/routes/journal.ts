import { analyzeJournalEntry, JournalAnalysisRequest } from '../utils/gpt';
import { HTTPException } from 'hono/http-exception';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { handleApiError } from '../utils/logger';
import { jwtAuth, getUserId } from '../middleware/auth';

/**
 * Example route handlers for journal analysis
 * This demonstrates how the GPT integration would be used in a real-world scenario
 */

// Define the request schema
const analyzeJournalSchema = z.object({
  content: z.string().min(1, 'Journal content is required'),
});

// Create a Hono app for journal routes
const app = new Hono();

// Middleware for authentication
app.use('*', jwtAuth);

// Endpoint for analyzing journal entries
app.post('/analyze', zValidator('json', analyzeJournalSchema), async (c) => {
  try {
    // Get the validated request body
    const { content } = c.req.valid('json');

    // Get the user ID from the context
    const userId = getUserId(c);

    // In a real implementation, we would fetch:
    // 1. User's character information (class, backstory)
    // 2. Available stats to tag
    // For this example, we'll use dummy data

    const request: JournalAnalysisRequest = {
      journalContent: content,
      userBackstory: 'You are a Ranger who thrives in nature and seeks adventure.',
      characterClass: 'Ranger',
      availableStats: [
        { id: 'strength', name: 'Strength', description: 'Physical power and endurance' },
        { id: 'wisdom', name: 'Wisdom', description: 'Insight, perception, and good judgment' },
        { id: 'charisma', name: 'Charisma', description: 'Force of personality and social influence' },
      ],
    };

    // Call the GPT-powered journal analysis
    const analysis = await analyzeJournalEntry(request);

    // Return the analysis results
    return c.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to analyze journal entry');
  }
});

export default app;
