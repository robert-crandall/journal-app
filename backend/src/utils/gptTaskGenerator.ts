import { db } from '../db';
import { tasks, stats, focuses, users, preferences, family } from '../db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import { type User, type Focus, type Stat, type Task, type Preference, type Family } from '../db/schema';
import OpenAI from 'openai';
import { getEnvironmentalContext, type EnvironmentalContext } from './weatherService';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const openAiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

export interface TaskGenerationContext {
  user: User;
  todaysFocus?: Focus;
  userStats: Stat[];
  familyMembers: Family[];
  recentTasks?: Task[];
  recentFeedback?: string[];
  environmentalContext?: EnvironmentalContext;
  userPreferences?: Preference;
}

export interface GeneratedTask {
  title: string;
  description: string;
  source: 'primary' | 'connection';
  focusId?: string;
  statId?: string;
  linkedStatIds: string[];
  familyName?: string;
}

export interface GeneratedTaskSet {
  primaryTask: GeneratedTask;
  connectionTask: GeneratedTask;
}

/**
 * Generate daily tasks using OpenAI GPT
 * Creates personalized tasks based on user context and feedback
 */
export async function generateDailyTasks(context: TaskGenerationContext): Promise<GeneratedTaskSet> {
  const { user, todaysFocus, userStats, familyMembers, recentTasks, recentFeedback } = context;

  // If OpenAI API key is not configured, fall back to mock implementation
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using mock task generation');
    return generateMockTasks(context);
  }

  try {
    const prompt = buildGPTPrompt(context);
    
    const completion = await openai.chat.completions.create({
      model: openAiModel,
      messages: [
        {
          role: "system",
          content: "You are a personal development coach that generates meaningful daily tasks. You understand personal growth, family relationships, and emotional intelligence. Always respond with valid JSON matching the requested structure."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(response);
    
    // Validate the response structure
    if (!parsedResponse.primaryTask || !parsedResponse.connectionTask) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return {
      primaryTask: {
        title: parsedResponse.primaryTask.title,
        description: parsedResponse.primaryTask.description,
        source: 'primary',
        focusId: context.todaysFocus?.id,
        statId: parsedResponse.primaryTask.linkedStatIds?.[0] || context.userStats[0]?.id,
        linkedStatIds: parsedResponse.primaryTask.linkedStatIds || [],
        familyName: parsedResponse.primaryTask.familyName
      },
      connectionTask: {
        title: parsedResponse.connectionTask.title,
        description: parsedResponse.connectionTask.description,
        source: 'connection',
        focusId: context.todaysFocus?.id,
        statId: parsedResponse.connectionTask.linkedStatIds?.[0] || context.userStats.find(s => s.category === 'connection')?.id || context.userStats[0]?.id,
        linkedStatIds: parsedResponse.connectionTask.linkedStatIds || [],
        familyName: parsedResponse.connectionTask.familyName,
      },
    };
  } catch (error) {
    console.error('Error generating tasks with OpenAI:', error);
    // Fall back to mock implementation on error
    return generateMockTasks(context);
  }
}

/**
 * Build a comprehensive prompt for GPT task generation
 */
function buildGPTPrompt(context: TaskGenerationContext): string {
  const { user, todaysFocus, userStats, familyMembers, recentTasks, recentFeedback, environmentalContext, userPreferences } = context;
  
  let prompt = `Generate two personalized daily tasks for ${user.name}:\n\n`;

  // Environmental context for better task relevance
  if (environmentalContext) {
    prompt += `## Environmental Context\n`;
    prompt += `Day: ${environmentalContext.dayOfWeek}\n`;
    prompt += `Month: ${environmentalContext.month} (${environmentalContext.season})\n`;
    
    if (environmentalContext.locationDescription) {
      prompt += `Location: ${environmentalContext.locationDescription}\n`;
    }
    
    if (environmentalContext.weather) {
      prompt += `Weather: ${environmentalContext.weather.summary}\n`;
    }
    
    // Add contextual hints based on environment
    if (environmentalContext.dayOfWeek === 'Saturday' || environmentalContext.dayOfWeek === 'Sunday') {
      prompt += `Note: It's a weekend, so the user likely has more free time and flexibility.\n`;
    }
    
    if (environmentalContext.weather?.condition.includes('sunny') || environmentalContext.weather?.condition.includes('clear')) {
      prompt += `Note: Good weather for outdoor activities.\n`;
    } else if (environmentalContext.weather?.condition.includes('rain') || environmentalContext.weather?.condition.includes('storm')) {
      prompt += `Note: Indoor activities may be more suitable today.\n`;
    }
    
    prompt += `\n`;
  }

  // User context
  prompt += `## User Profile\n`;
  prompt += `Name: ${user.name}\n`;
  if (user.gptContext) {
    prompt += `Context: ${JSON.stringify(user.gptContext)}\n`;
  }

  // RPG Class information (for flavor when enabled) - removed as class info is now in family members

  // Today's focus
  if (todaysFocus) {
    prompt += `\n## Today's Focus: ${todaysFocus.name}\n`;
    prompt += `Description: ${todaysFocus.description || 'No description provided'}\n`;
    if (todaysFocus.sampleActivities?.length) {
      prompt += `Sample Activities: ${todaysFocus.sampleActivities.join(', ')}\n`;
    }
  }

  // User stats for XP assignment
  prompt += `\n## User Stats (for XP assignment)\n`;
  userStats.forEach(stat => {
    prompt += `- ${stat.name} (${stat.category}): Level ${stat.level}, ${stat.xp} XP - ${stat.description || 'No description'}\n`;
  });

  // Family members
  if (familyMembers.length > 0) {
    prompt += `\n## Family Members\n`;
    familyMembers.forEach(member => {
      prompt += `- ${member.name}`;
      if (member.age) {
        prompt += ` (age ${member.age})`;
      }
      // Include family member class info for collaborative tasks when RPG flavor is enabled
      if (userPreferences?.rpgFlavorEnabled && member.className) {
        prompt += ` - Class: ${member.className}`;
        if (member.description) {
          prompt += ` (${member.description})`;
        }
      }
      prompt += `\n`;
    });
  }

  // Recent task history and feedback
  if (recentTasks?.length) {
    prompt += `\n## Recent Task History\n`;
    recentTasks.slice(-5).forEach(task => {
      prompt += `- "${task.title}" (${task.status})`;
      if (task.feedback) {
        prompt += ` - Feedback: ${task.feedback}`;
      }
      if (task.emotionTag) {
        prompt += ` - Emotion: ${task.emotionTag}`;
      }
      prompt += `\n`;
    });
  }

  if (recentFeedback?.length) {
    prompt += `\n## Recent User Feedback\n`;
    recentFeedback.forEach(feedback => {
      prompt += `- ${feedback}\n`;
    });
  }

  // Task generation instructions
  prompt += `\n## Task Generation Requirements\n`;
  prompt += `Generate exactly TWO tasks:\n\n`;
  
  prompt += `1. **Primary Task**: Aligned with today's focus "${todaysFocus?.name || 'personal growth'}"\n`;
  prompt += `   - Should be meaningful and actionable\n`;
  prompt += `   - Take 15-45 minutes to complete\n`;
  prompt += `   - Help advance the user's growth in the focus area\n`;
  
  prompt += `\n2. **Connection Task**: Focus on relationships and emotional well-being\n`;
  if (familyMembers.length > 0) {
    prompt += `   - Should involve one of the family members OR self-connection\n`;
    prompt += `   - Rotate between family members to ensure balanced attention\n`;
  } else {
    prompt += `   - Should focus on self-connection, mindfulness, or reaching out to friends\n`;
  }
  prompt += `   - Emphasize quality time and emotional presence\n`;

  prompt += `\n## Response Format\n`;
  prompt += `Respond with ONLY valid JSON in this exact structure:\n`;
  prompt += `{
  "primaryTask": {
    "title": "Short, actionable title (max 60 chars)",
    "description": "Detailed guidance and context (2-3 sentences)",
    "linkedStatIds": ["stat_id1", "stat_id2"],
    "familyName": "Family Name" // optional, only if task involves family
  },
  "connectionTask": {
    "title": "Short, actionable title (max 60 chars)", 
    "description": "Detailed guidance and context (2-3 sentences)",
    "linkedStatIds": ["stat_id1"],
    "familyName": "Family Name" // optional, only if task involves family
  }
}\n`;

  prompt += `\nFor connection tasks, prefer stats in categories: connection, spirit, mind.`;

  return prompt;
}

/**
 * Fallback mock task generator (same as original implementation)
 */
function generateMockTasks(context: TaskGenerationContext): GeneratedTaskSet {
  const { user, todaysFocus, userStats, familyMembers } = context;

  // Mock primary task based on today's focus
  const primaryTask: GeneratedTask = {
    title: todaysFocus 
      ? `Focus on ${todaysFocus.name}: Take one meaningful step`
      : `Personal Growth: Complete a challenging task that stretches your abilities`,
    description: todaysFocus?.description 
      ? `Today's focus is ${todaysFocus.name}. ${todaysFocus.description} Take 30 minutes to work on something that advances this area of your life.`
      : `Spend 30 minutes working on personal development. Choose something that challenges you and moves you forward.`,
    source: 'primary',
    focusId: todaysFocus?.id,
    statId: todaysFocus?.statId || userStats[0]?.id,
    linkedStatIds: todaysFocus?.statId ? [todaysFocus.statId] : userStats.slice(0, 1).map(s => s.id),
  };

  // Mock connection task that rotates through family members
  const randomFamilyMember = familyMembers.length > 0 
    ? familyMembers[Math.floor(Math.random() * familyMembers.length)]
    : null;

  const connectionStats = userStats.filter(s => s.category === 'connection' || s.category === 'spirit');
  const connectionStatForTask = connectionStats[0] || userStats[0];

  const connectionTask: GeneratedTask = {
    title: randomFamilyMember 
      ? `Connect with ${randomFamilyMember.name}: Quality time together`
      : `Self-Connection: Practice mindfulness or self-reflection`,
    description: randomFamilyMember
      ? `Spend focused, quality time with ${randomFamilyMember.name}. Put away distractions and be fully present. Ask them about something they're excited about or curious about.`
      : `Take 15 minutes for mindful self-connection. This could be meditation, journaling, or simply sitting quietly and checking in with how you're feeling.`,
    source: 'connection',
    focusId: todaysFocus?.id,
    statId: connectionStatForTask?.id,
    linkedStatIds: connectionStats.slice(0, 2).map(s => s.id),
    familyName: randomFamilyMember ? randomFamilyMember.name : undefined,
  };

  return {
    primaryTask,
    connectionTask,
  };
}

/**
 * Get today's focus based on day of week
 */
export function getTodaysFocus(focuses: Focus[]): Focus | undefined {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return focuses.find(focus => focus.dayOfWeek === today);
}

/**
 * Mark old GPT tasks as skipped
 * Any GPT-generated tasks for yesterday or older that are not completed will be marked as skipped
 */
export async function markOldGptTasksAsSkipped(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    // Find GPT tasks that are older than today and still pending
    const oldPendingTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, userId),
        eq(tasks.origin, 'gpt'),
        eq(tasks.status, 'pending'),
        lt(tasks.taskDate, today)
      ),
    });

    if (oldPendingTasks.length > 0) {
      // Update all found tasks to 'skipped' status
      const taskIds = oldPendingTasks.map(task => task.id);
      
      await db.update(tasks)
        .set({
          status: 'skipped',
          updatedAt: new Date(),
        })
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.origin, 'gpt'),
          eq(tasks.status, 'pending'),
          lt(tasks.taskDate, today)
        ));

      console.log(`Marked ${oldPendingTasks.length} old GPT tasks as skipped for user ${userId}`);
    }
  } catch (error) {
    console.error('Failed to mark old GPT tasks as skipped:', error);
    // Don't throw - this is cleanup logic and shouldn't break task generation
  }
}

/**
 * Get or generate today's tasks for a user
 * This is the main function that implements the persistence logic
 */
export async function getOrGenerateTodaysTask(userId: string): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Check if today's tasks already exist
  const existingTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.userId, userId),
      eq(tasks.taskDate, today),
      eq(tasks.origin, 'gpt')
    ),
    with: {
      focus: true,
      stat: true,
    },
  });
  
  // If tasks exist, return them
  if (existingTasks.length > 0) {
    return existingTasks;
  }
  
  // Otherwise, generate new tasks
  try {
    // Get user and context
    const [user, userFocuses, userStats, familyMembers, recentTasks, userPreferences] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
      db.query.focuses.findMany({
        where: eq(focuses.userId, userId),
        with: { stat: true },
      }),
      db.query.stats.findMany({
        where: eq(stats.userId, userId),
      }),
      db.query.family.findMany({
        where: eq(family.userId, userId),
      }),
      db.query.tasks.findMany({
        where: eq(tasks.userId, userId),
        orderBy: [desc(tasks.createdAt)],
        limit: 10,
      }),
      db.query.preferences.findFirst({
        where: eq(preferences.userId, userId),
      }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }
    
    // Get environmental context
    const environmentalContext = await getEnvironmentalContext(
      userPreferences?.locationDescription || undefined,
      userPreferences?.zipCode || undefined
    );
    
    // Get today's focus
    const todaysFocus = getTodaysFocus(userFocuses);
    
    // Collect recent feedback from completed tasks
    const recentFeedback = recentTasks
      .filter(task => task.feedback)
      .map(task => task.feedback!)
      .slice(0, 5);
    
    // Generate tasks using GPT
    const context: TaskGenerationContext = {
      user,
      todaysFocus,
      userStats,
      familyMembers,
      recentTasks,
      recentFeedback,
      environmentalContext,
      userPreferences,
    };
    
    const generatedTasks = await generateDailyTasks(context);
    // Save generated tasks to database
    const tasksToInsert: Array<{
      userId: string;
      focusId?: string;
      statId?: string;
      title: string;
      description: string;
      taskDate: string;
      source: 'primary' | 'connection';
      linkedStatIds: string[];
      familyId?: string;
      familyName?: string;
      origin: 'gpt';
      status: 'pending';
    }> = [
      {
        userId: user.id,
        focusId: generatedTasks.primaryTask.focusId,
        statId: undefined, // statId will be set below if linkedStatIds is provided
        title: generatedTasks.primaryTask.title,
        description: generatedTasks.primaryTask.description,
        taskDate: today,
        source: generatedTasks.primaryTask.source,
        linkedStatIds: generatedTasks.primaryTask.linkedStatIds,
        familyId: undefined, // familyId will be set below if familyName is provided
        familyName: generatedTasks.primaryTask.familyName,
        origin: 'gpt',
        status: 'pending',
      },
      {
        userId: user.id,
        focusId: generatedTasks.connectionTask.focusId,
        statId: undefined, // statId will be set below if linkedStatIds is provided
        title: generatedTasks.connectionTask.title,
        description: generatedTasks.connectionTask.description,
        taskDate: today,
        source: generatedTasks.connectionTask.source,
        linkedStatIds: generatedTasks.connectionTask.linkedStatIds,
        familyId: undefined, // familyId will be set below if familyName is provided
        familyName: generatedTasks.connectionTask.familyName,
        origin: 'gpt',
        status: 'pending',
      },
    ];

    // Convert familyName to familyId if available
    for (const task of tasksToInsert) {
      if (task.familyName) {
        const familyMember = familyMembers.find(f => f.name === task.familyName);
        if (familyMember) {
          task.familyId = familyMember.id;
        }
      }
      delete task.familyName;
    }
    
    await db.insert(tasks).values(tasksToInsert);
    
    // Clean up old GPT tasks by marking them as skipped
    await markOldGptTasksAsSkipped(userId);
    
    // Fetch the tasks with relations
    const savedTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.userId, userId),
        eq(tasks.taskDate, today),
        eq(tasks.origin, 'gpt')
      ),
      with: {
        focus: true,
        stat: true,
      },
    });
    
    return savedTasks;
  } catch (error) {
    console.error('Failed to generate daily tasks:', error);
    throw error;
  }
}
