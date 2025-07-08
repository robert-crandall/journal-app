import OpenAI from 'openai';
import { env } from '../env';
import type { ChatMessage } from '../types/journal';

// GPT service for journal conversation and analysis
export class GPTService {
  private client: OpenAI | null = null;
  private isConfigured = false;

  constructor() {
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      this.client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      this.isConfigured = true;
    }
  }

  async generateWelcomeMessage(userContext: { name: string; characterClass?: string; backstory?: string; goals?: string }): Promise<string> {
    if (!this.isConfigured || !this.client) {
      // Fallback to mock message if OpenAI is not configured
      return `Hi ${userContext.name}! I'm here to help you reflect on whatever's on your mind today. What would you like to share?`;
    }

    try {
      const systemPrompt = this.buildSystemPrompt(userContext);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: 'I want to start a journal session. Please give me a brief, warm welcome and ask what I want to share.',
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return (
        completion.choices[0]?.message?.content ||
        `Hi ${userContext.name}! I'm here to help you reflect on whatever's on your mind today. What would you like to share?`
      );
    } catch (error) {
      console.error('Error generating welcome message:', error);
      // Fallback to mock message on error
      return `Hi ${userContext.name}! I'm here to help you reflect on whatever's on your mind today. What would you like to share?`;
    }
  }

  async generateFollowUpResponse(
    conversation: ChatMessage[],
    userContext: {
      name: string;
      characterClass?: string;
      backstory?: string;
      goals?: string;
    },
  ): Promise<{ response: string; shouldOfferSave: boolean }> {
    const userMessages = conversation.filter((msg) => msg.role === 'user');
    const shouldOfferSave = userMessages.length >= 3;

    if (!this.isConfigured || !this.client) {
      // Fallback to mock responses if OpenAI is not configured
      if (shouldOfferSave) {
        return {
          response: `Thank you for sharing with me. I can sense this conversation has covered some important ground. Would you like to save this journal entry?`,
          shouldOfferSave: true,
        };
      }

      const responses = [
        `That sounds really meaningful. Can you tell me more about what that experience was like for you?`,
        `I can hear that this is important to you. What feelings came up when that happened?`,
        `Interesting perspective. How do you think that connects to what you're working toward right now?`,
        `That's a lot to process. What part of this feels most significant to you?`,
      ];

      return {
        response: responses[Math.floor(Math.random() * responses.length)],
        shouldOfferSave: false,
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(userContext);
      const lastUserMessage = conversation[conversation.length - 1]?.content || '';

      if (shouldOfferSave) {
        const completion = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}

The user has shared several messages with you in this journal session. It's time to offer to save this journal entry. Give a brief, empathetic response that acknowledges the depth of the conversation and asks if they'd like to save this journal entry.`,
            },
            {
              role: 'user',
              content: `Here's our conversation so far: ${JSON.stringify(conversation.map((m) => `${m.role}: ${m.content}`).join('\n'))}

Please acknowledge the conversation and ask if I want to save this journal entry.`,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        });

        return {
          response:
            completion.choices[0]?.message?.content ||
            `Thank you for sharing with me. I can sense this conversation has covered some important ground. Would you like to save this journal entry?`,
          shouldOfferSave: true,
        };
      }

      // Generate thoughtful follow-up
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

The user just shared: "${lastUserMessage}"

Respond with a brief, emotionally intelligent observation and ONE thoughtful follow-up question. Mirror their tone (serious, playful, vulnerable, etc.). Keep it concise - 2-3 sentences maximum.`,
          },
          {
            role: 'user',
            content: lastUserMessage,
          },
        ],
        max_tokens: 120,
        temperature: 0.8,
      });

      return {
        response: completion.choices[0]?.message?.content || `That sounds really meaningful. Can you tell me more about what that experience was like for you?`,
        shouldOfferSave: false,
      };
    } catch (error) {
      console.error('Error generating follow-up response:', error);
      // Fallback to mock responses on error
      if (shouldOfferSave) {
        return {
          response: `Thank you for sharing with me. I can sense this conversation has covered some important ground. Would you like to save this journal entry?`,
          shouldOfferSave: true,
        };
      }

      const responses = [
        `That sounds really meaningful. Can you tell me more about what that experience was like for you?`,
        `I can hear that this is important to you. What feelings came up when that happened?`,
        `Interesting perspective. How do you think that connects to what you're working toward right now?`,
        `That's a lot to process. What part of this feels most significant to you?`,
      ];

      return {
        response: responses[Math.floor(Math.random() * responses.length)],
        shouldOfferSave: false,
      };
    }
  }

  async generateJournalMetadata(
    conversation: ChatMessage[],
    userContext: {
      name: string;
      characterClass?: string;
      backstory?: string;
      goals?: string;
    },
  ): Promise<{
    title: string;
    synopsis: string;
    summary: string;
    suggestedTags: string[];
    suggestedStatTags: string[];
  }> {
    if (!this.isConfigured || !this.client) {
      // Fallback to mock metadata if OpenAI is not configured
      return {
        title: 'Reflective Journal Session',
        synopsis: 'A thoughtful conversation about current experiences and feelings.',
        summary: `In this journal session, ${userContext.name} shared their thoughts and feelings in a meaningful conversation. The discussion touched on personal experiences and provided space for reflection.`,
        suggestedTags: ['reflection', 'thoughts', 'personal'],
        suggestedStatTags: [],
      };
    }

    try {
      const systemPrompt = `You are an AI that analyzes journal conversations and generates structured metadata. You will analyze the full conversation and return a JSON response with the following structure:

{
  "title": "A 6-10 word title that captures the essence of the day/conversation",
  "synopsis": "A 1-2 sentence high-level summary",
  "summary": "A first-person narrative rewrite in the user's tone that captures the full conversation",
  "content_tags": ["3-6 tags describing what the day involved (e.g., 'relationship', 'rest', 'focus')"],
  "tone_tags": ["emotional tone(s) from: calm, frustrated, joyful, anxious, hopeful, sad, angry, peaceful, excited, overwhelmed, confident, vulnerable, grateful, tired"],
  "stat_tags": ["character stats that might be relevant based on described actions (e.g., 'strength', 'creativity', 'leadership', 'health', 'relationships', 'learning')"]
}

User context:
- Name: ${userContext.name}
- Character Class: ${userContext.characterClass || 'Not specified'}
- Backstory: ${userContext.backstory || 'Not specified'}
- Goals: ${userContext.goals || 'Not specified'}

Respond ONLY with valid JSON.`;

      const conversationText = conversation.map((msg) => `${msg.role === 'user' ? userContext.name : 'AI'}: ${msg.content}`).join('\n');

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please analyze this journal conversation and generate metadata:\n\n${conversationText}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from GPT');
      }

      const metadata = JSON.parse(responseText);

      return {
        title: metadata.title || 'Reflective Journal Session',
        synopsis: metadata.synopsis || 'A thoughtful conversation about current experiences and feelings.',
        summary: metadata.summary || `In this journal session, ${userContext.name} shared their thoughts and feelings in a meaningful conversation.`,
        suggestedTags: metadata.content_tags || ['reflection'],
        suggestedStatTags: metadata.stat_tags || [],
      };
    } catch (error) {
      console.error('Error generating journal metadata:', error);
      // Fallback to mock metadata on error
      return {
        title: 'Reflective Journal Session',
        synopsis: 'A thoughtful conversation about current experiences and feelings.',
        summary: `In this journal session, ${userContext.name} shared their thoughts and feelings in a meaningful conversation. The discussion touched on personal experiences and provided space for reflection.`,
        suggestedTags: ['reflection', 'thoughts', 'personal'],
        suggestedStatTags: [],
      };
    }
  }

  private buildSystemPrompt(userContext: { name: string; characterClass?: string; backstory?: string; goals?: string }): string {
    return `You are an emotionally intelligent life coach and journal companion. Your role is to help ${userContext.name} reflect on their experiences through thoughtful conversation.

User Context:
- Name: ${userContext.name}
- Character Class: ${userContext.characterClass || 'Not specified'}
- Backstory: ${userContext.backstory || 'Not specified'}
- Goals: ${userContext.goals || 'Not specified'}

Your approach:
- Be warm, empathetic, and genuinely curious
- Ask thoughtful follow-up questions that help them explore their feelings and experiences
- Mirror their emotional tone (serious, playful, vulnerable, etc.)
- Focus on understanding rather than giving advice
- Help them process what they're experiencing
- Be brief and conversational - avoid long responses
- Show that you're really listening to what they're sharing

Remember: This is their space to reflect and be heard. Your job is to be a supportive presence that helps them explore their thoughts and feelings.`;
  }
}
