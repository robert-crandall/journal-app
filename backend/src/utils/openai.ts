import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const openAiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ExtractedInsights {
  title: string
  summary: string
  synopsis: string
  contentTags: string[]
  toneTags: string[]
  characterTags: string[]
}

export async function generateFollowUpQuestion(
  messages: ConversationMessage[]
): Promise<string> {
  const systemPrompt = `You are a compassionate and emotionally intelligent life coach or therapist engaging in a journal conversation.

- Your responses should be brief (1-3 sentences), include an observation about what the user said, and followed by a thoughtful follow-up question.
- Mirror the user's tone, energy level, and depth.
- If the user is playful, be playful in return.
- If the user is vulnerable or serious, respond with appropriate warmth and care.

If the conversation seems complete (they've shared enough detail and reflection, or they say goodbye, goodnight, or similar), respond with "CONVERSATION_COMPLETE" instead of a question.`

  try {
    // Build the conversation messages array
    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: 'Generate a follow-up question or indicate completion.' }
    ]

    const response = await openai.chat.completions.create({
      model: openAiModel,
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 150,
    })

    const content = response.choices[0]?.message?.content?.trim()
    return content || 'What else would you like to reflect on about today?'
  } catch (error) {
    console.error('Error generating follow-up question:', error)
    return 'What else would you like to reflect on about today?'
  }
}

export async function extractInsights(
  messages: ConversationMessage[],
  existingContentTags: string[],
  existingCharacterStats: { name: string }[]
): Promise<ExtractedInsights> {
  const conversationText = messages.map(msg => msg.content).join('\n')
  
  const systemPrompt = `You are a thoughtful, context-aware assistant that analyzes journal entries and returns structured insights. Your job is to generate:

1. TITLE: A 6-10 word title capturing the essence of the day
2. SUMMARY: A narrative rewrite in the user's voice (2-3 paragraphs).
3. SYNOPSIS: 1-2 sentence overview of what happened. Use first-person perspective (e.g., 'I went to the store today', not 'The author went to the store today')
4. CONTENT_TAGS: 3-6 topic-based tags (prefer existing: ${existingContentTags.join(', ')})
5. TONE_TAGS: Mood-based tags from this list: calm, overwhelmed, frustrated, excited, anxious, focused, scattered, accomplished, lonely, grateful, energetic, tired, optimistic, pessimistic, content, restless, confident, doubtful, creative, blocked
6. CHARACTER_TAGS: Personal growth stats used/developed (choose only from: ${existingCharacterStats.map(s => s.name).join(', ')})

SUMMARY Guidelines:
Transform the user's messages into a single coherent journal entry that:
1. Maintains the user's voice, style, and key phrases
2. Connects fragmented thoughts while preserving the emotional tone
3. Creates a narrative flow that captures the essence of the conversation
4. Sounds like a single journal entry rather than a back-and-forth conversation
5. Do not guess the user's voice or emotions. Do not add any extra emotion. Just summarize what they said.

Do not include the assistant's questions or comments in the summary.
Focus only on the user's thoughts, feelings, and experiences.
Write in first person from the user's perspective.

You can break the summary into paragraphs if it helps with readability. You can also add markdown formatting, bullets, or other elements to enhance the entry, but do not feel obligated to do so.

Return ONLY a JSON object with this exact structure:
{
  "title": "string",
  "summary": "string", 
  "synopsis": "string",
  "contentTags": ["tag1", "tag2"],
  "toneTags": ["tag1", "tag2"],
  "characterTags": ["stat1", "stat2"]
}`

  try {
    const response = await openai.chat.completions.create({
      model: openAiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationText }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const insights = JSON.parse(content) as ExtractedInsights
    
    // Validate required fields
    if (!insights.title || !insights.summary || !insights.synopsis) {
      throw new Error('Missing required insights fields')
    }

    return insights
  } catch (error) {
    console.error('Error extracting insights:', error)
    
    // Return fallback insights
    return {
      title: 'Journal Entry',
      summary: conversationText.substring(0, 500) + '...',
      synopsis: 'Reflected on the day\'s experiences.',
      contentTags: [],
      toneTags: [],
      characterTags: []
    }
  }
}
