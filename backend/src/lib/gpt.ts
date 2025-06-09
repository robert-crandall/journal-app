import OpenAI from 'openai'

interface GPTCallOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  system?: string
  temperature?: number
  maxTokens?: number
}

interface GPTResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class GPTService {
  private openai: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    
    this.openai = new OpenAI({
      apiKey,
    })
  }

  async callGPT(options: GPTCallOptions): Promise<GPTResponse> {
    try {
      const { messages, system, temperature = 0.7, maxTokens = 1000 } = options
      
      // Prepare messages array with system message if provided
      const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = []
      
      if (system) {
        chatMessages.push({ role: 'system', content: system })
      }
      
      // Add conversation messages
      chatMessages.push(...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })))

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: chatMessages,
        temperature,
        max_tokens: maxTokens,
      })

      const content = response.choices[0]?.message?.content || ''
      
      return {
        content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined
      }
    } catch (error) {
      console.error('GPT API call failed:', error)
      throw new Error('Failed to generate GPT response')
    }
  }

  async generateJournalResponse(conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const systemPrompt = `You are a gentle, empathetic journaling assistant. Your role is to help the user reflect on their day through conversation.

Guidelines:
- Respond with warmth and empathy
- Ask thoughtful follow-up questions to help them explore their feelings and experiences
- Keep responses conversational and natural
- Don't be overly formal or clinical
- Help them dive deeper into their experiences
- Show genuine interest in their responses

The user is journaling about their day. Respond naturally and ask 1-2 follow-up questions to keep the conversation flowing.`

    const response = await this.callGPT({
      messages: conversationHistory,
      system: systemPrompt,
      temperature: 0.8,
      maxTokens: 300
    })

    return response.content
  }

  async compileJournalEntry(conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const systemPrompt = `You are a skilled writer who helps people compile their journal conversations into cohesive, well-written journal entries.

Your task is to:
- Take the entire conversation and create a flowing, narrative journal entry
- Write in the user's voice and tone
- Focus on their experiences, thoughts, and feelings
- Create a cohesive story from the conversation
- Maintain the personal, reflective nature of journaling
- Don't add information that wasn't discussed

Write the entry in first person as if the user wrote it themselves. Make it feel natural and authentic.`

    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Me' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    const response = await this.callGPT({
      messages: [{ 
        role: 'user', 
        content: `Please compile this journal conversation into a cohesive journal entry:\n\n${conversationText}` 
      }],
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 800
    })

    return response.content
  }

  async extractMetadata(finalText: string, existingTags: string[] = []): Promise<{
    title: string
    condensedSummary: string
    fullSummary: string
    tagNames: string[]
  }> {
    const systemPrompt = `You are a metadata extraction assistant. Your job is to analyze journal entries and extract key information.

From the journal entry, extract:
1. A compelling, descriptive title (3-8 words)
2. A condensed summary (1-2 sentences capturing the essence)
3. A full summary (rewritten version of the entry, same tone but cleaned up)
4. Relevant tags from the existing tag list (if no close matches exist, suggest new ones)

Existing tags: ${existingTags.length > 0 ? existingTags.join(', ') : 'None yet'}

Return your response in this exact JSON format:
{
  "title": "Your Title Here",
  "condensedSummary": "Brief 1-2 sentence summary",
  "fullSummary": "Cleaned up, rewritten version of the full entry",
  "tagNames": ["tag1", "tag2", "tag3"]
}`

    const response = await this.callGPT({
      messages: [{ 
        role: 'user', 
        content: `Please extract metadata from this journal entry:\n\n${finalText}` 
      }],
      system: systemPrompt,
      temperature: 0.5,
      maxTokens: 600
    })

    try {
      const parsed = JSON.parse(response.content)
      return {
        title: parsed.title || 'Untitled Entry',
        condensedSummary: parsed.condensedSummary || '',
        fullSummary: parsed.fullSummary || finalText,
        tagNames: parsed.tagNames || []
      }
    } catch (error) {
      console.error('Failed to parse GPT metadata response:', error)
      return {
        title: 'Untitled Entry',
        condensedSummary: finalText.substring(0, 100) + '...',
        fullSummary: finalText,
        tagNames: []
      }
    }
  }
}

// Export singleton instance
export const gptService = new GPTService()
