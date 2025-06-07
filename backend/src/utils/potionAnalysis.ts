import OpenAI from 'openai';
import { db } from '../db';
import { journals, tasks, potions } from '../db/schema';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const openAiModel = process.env.OPENAI_MODEL || 'gpt-4-1106-preview';

export interface PotionAnalysisContext {
  potion: any;
  linkedJournals: any[];
  linkedTasks: any[];
}

export interface PotionAnalysisResult {
  effectiveness: 'likely_effective' | 'mixed_results' | 'likely_ineffective' | 'insufficient_data';
  summary: string;
  journalTrends: string;
  taskTrends: string;
  recommendations: string;
}

/**
 * Analyze a potion's effectiveness based on linked journal entries and task completions
 */
export async function analyzePotionEffectiveness(potionId: string): Promise<PotionAnalysisResult> {
  // If OpenAI API key is not configured, return a mock analysis
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using mock potion analysis');
    return generateMockAnalysis();
  }

  try {
    // Get the potion details
    const potion = await db.query.potions.findFirst({
      where: eq(potions.id, potionId),
    });

    if (!potion) {
      throw new Error('Potion not found');
    }

    // Get linked journal entries during the potion period
    const linkedJournals = await db.query.journals.findMany({
      where: and(
        eq(journals.potionId, potionId),
        eq(journals.status, 'completed'),
        isNotNull(journals.sentimentScore)
      ),
    });

    // Get linked task completions during the potion period
    const linkedTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.potionId, potionId),
        eq(tasks.status, 'complete')
      ),
    });

    // If insufficient data, return early
    if (linkedJournals.length === 0 && linkedTasks.length === 0) {
      return {
        effectiveness: 'insufficient_data',
        summary: 'Not enough data collected during this potion period to make an assessment.',
        journalTrends: 'No journal entries linked to this potion.',
        taskTrends: 'No task completions linked to this potion.',
        recommendations: 'Continue using this potion for a longer period to gather more data.'
      };
    }

    const context: PotionAnalysisContext = {
      potion,
      linkedJournals,
      linkedTasks,
    };

    const prompt = buildAnalysisPrompt(context);
    
    const completion = await openai.chat.completions.create({
      model: openAiModel,
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the structured response
    return parseAnalysisResponse(response);
  } catch (error) {
    console.error('Error analyzing potion effectiveness:', error);
    return generateMockAnalysis();
  }
}

/**
 * Build the GPT prompt for potion effectiveness analysis
 */
function buildAnalysisPrompt(context: PotionAnalysisContext): string {
  const { potion, linkedJournals, linkedTasks } = context;
  
  let prompt = `You are analyzing the effectiveness of a personal experiment (called a "Potion") based on mood and productivity data.\n\n`;
  
  prompt += `POTION DETAILS:\n`;
  prompt += `Title: ${potion.title}\n`;
  if (potion.hypothesis) {
    prompt += `Hypothesis: ${potion.hypothesis}\n`;
  }
  prompt += `Duration: ${potion.startDate} to ${potion.endDate}\n\n`;
  
  if (linkedJournals.length > 0) {
    prompt += `JOURNAL SENTIMENT DATA (${linkedJournals.length} entries):\n`;
    linkedJournals.forEach((journal, index) => {
      prompt += `Entry ${index + 1}: Sentiment ${journal.sentimentScore}/5`;
      if (journal.moodTags && journal.moodTags.length > 0) {
        prompt += `, Mood: ${journal.moodTags.join(', ')}`;
      }
      prompt += `\n`;
    });
    prompt += `\n`;
  }
  
  if (linkedTasks.length > 0) {
    prompt += `TASK COMPLETION DATA (${linkedTasks.length} completions):\n`;
    linkedTasks.forEach((task, index) => {
      prompt += `Task ${index + 1}: "${task.title}" - Status: ${task.status}`;
      if (task.moodScore) {
        prompt += `, Energy/Mood: ${task.moodScore}/5`;
      }
      if (task.emotionTag) {
        prompt += `, Emotion: ${task.emotionTag}`;
      }
      if (task.feedback) {
        prompt += `, Feedback: "${task.feedback}"`;
      }
      prompt += `\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `ANALYSIS TASK:\n`;
  prompt += `Analyze whether this potion appears to be effective based on the data. Consider:\n`;
  prompt += `1. Average sentiment scores and mood trends from journals\n`;
  prompt += `2. Task completion rates and energy levels\n`;
  prompt += `3. Emotional feedback and user experience\n`;
  prompt += `4. Overall patterns that suggest positive or negative impact\n\n`;
  
  prompt += `RESPONSE FORMAT (JSON):\n`;
  prompt += `{\n`;
  prompt += `  "effectiveness": "likely_effective" | "mixed_results" | "likely_ineffective" | "insufficient_data",\n`;
  prompt += `  "summary": "Overall assessment in 1-2 sentences",\n`;
  prompt += `  "journalTrends": "Summary of mood/sentiment patterns from journals",\n`;
  prompt += `  "taskTrends": "Summary of task completion and energy patterns",\n`;
  prompt += `  "recommendations": "Actionable suggestions for next steps"\n`;
  prompt += `}\n\n`;
  
  prompt += `Return only the JSON response:`;
  
  return prompt;
}

/**
 * Parse the GPT response for analysis results
 */
function parseAnalysisResponse(response: string): PotionAnalysisResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      effectiveness: parsed.effectiveness || 'insufficient_data',
      summary: parsed.summary || 'Analysis could not be completed.',
      journalTrends: parsed.journalTrends || 'No journal trends identified.',
      taskTrends: parsed.taskTrends || 'No task trends identified.',
      recommendations: parsed.recommendations || 'Continue monitoring for more data.',
    };
  } catch (error) {
    console.error('Error parsing GPT analysis response:', error);
    return generateMockAnalysis();
  }
}

/**
 * Generate a mock analysis when GPT is not available
 */
function generateMockAnalysis(): PotionAnalysisResult {
  return {
    effectiveness: 'mixed_results',
    summary: 'Mock analysis: This potion shows mixed results based on available data.',
    journalTrends: 'Mock data shows average sentiment patterns.',
    taskTrends: 'Mock data shows typical task completion patterns.',
    recommendations: 'Continue monitoring this potion for more conclusive results.',
  };
}

/**
 * Run weekly analysis for all active potions for a user
 */
export async function runWeeklyPotionAnalysis(userId: string): Promise<any[]> {
  const userPotions = await db.query.potions.findMany({
    where: and(
      eq(potions.userId, userId),
      eq(potions.isActive, true)
    ),
  });

  const analyses = [];
  
  for (const potion of userPotions) {
    try {
      const analysis = await analyzePotionEffectiveness(potion.id);
      
      // Store the analysis back to the potion
      await db.update(potions)
        .set({
          gptAnalysis: JSON.stringify(analysis),
          updatedAt: new Date(),
        })
        .where(eq(potions.id, potion.id));
      
      analyses.push({
        potionId: potion.id,
        potionTitle: potion.title,
        analysis,
      });
    } catch (error) {
      console.error(`Error analyzing potion ${potion.id}:`, error);
    }
  }
  
  return analyses;
}