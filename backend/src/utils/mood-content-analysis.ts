/**
 * Mood and Content Analysis Utilities for Journal System
 * Provides sentiment analysis and content detection for generating contextual follow-up questions
 */

export interface MoodAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  confidence: number
  keywords: string[]
  emotions: string[]
  intensity: 'low' | 'medium' | 'high'
}

export interface ContentAnalysis {
  themes: string[]
  categories: string[]
  entities: string[]
  topics: string[]
}

export interface ContextualAnalysis {
  mood: MoodAnalysis
  content: ContentAnalysis
  suggestedQuestionTypes: string[]
  conversationDepth: number
}

/**
 * Enhanced sentiment analysis with emotion detection
 */
export function analyzeMoodAndContent(text: string, conversationHistory: Array<{ role: string, content: string }> = []): ContextualAnalysis {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)
  
  // Emotion keywords
  const positiveWords = ['love', 'amazing', 'fantastic', 'perfect', 'great', 'excellent', 'wonderful', 'enjoyed', 'fun', 'exciting', 'awesome', 'brilliant', 'happy', 'joy', 'celebration', 'proud', 'grateful', 'blessed', 'accomplished', 'successful']
  const negativeWords = ['hate', 'terrible', 'awful', 'boring', 'difficult', 'frustrated', 'disappointed', 'bad', 'poor', 'worst', 'annoying', 'hard', 'sad', 'angry', 'stressed', 'overwhelmed', 'worried', 'anxious', 'upset', 'struggle']
  const neutralWords = ['okay', 'fine', 'alright', 'decent', 'normal', 'average', 'nothing special', 'routine', 'typical', 'regular']
  
  // Content theme keywords
  const familyWords = ['family', 'kids', 'children', 'daughter', 'son', 'wife', 'husband', 'partner', 'parent', 'mom', 'dad', 'parenting']
  const workWords = ['work', 'job', 'career', 'boss', 'colleague', 'project', 'meeting', 'office', 'deadline', 'promotion', 'business']
  const adventureWords = ['adventure', 'travel', 'hike', 'explore', 'outdoor', 'nature', 'mountain', 'beach', 'journey', 'discovery', 'exercise', 'sport']
  const healthWords = ['health', 'medical', 'doctor', 'wellness', 'fitness', 'diet', 'exercise', 'sleep', 'energy', 'sick', 'recovery']
  const creativeWords = ['creative', 'art', 'music', 'writing', 'painting', 'photography', 'design', 'craft', 'hobby', 'imagination']
  const socialWords = ['friends', 'social', 'party', 'gathering', 'community', 'relationship', 'connection', 'support', 'lonely', 'isolated']
  const learningWords = ['learn', 'study', 'education', 'skill', 'knowledge', 'book', 'course', 'practice', 'improvement', 'growth']
  const challengeWords = ['challenge', 'problem', 'obstacle', 'difficult', 'struggle', 'overcome', 'persevere', 'resilience', 'determination']

  // Emotion detection
  let positiveScore = 0
  let negativeScore = 0
  let neutralScore = 0
  const foundKeywords: string[] = []
  const emotions: string[] = []

  for (const word of words) {
    if (positiveWords.some(pw => word.includes(pw))) {
      positiveScore++
      foundKeywords.push(word)
      if (['joy', 'happy', 'excited', 'proud', 'grateful'].some(e => word.includes(e))) {
        emotions.push(word)
      }
    } else if (negativeWords.some(nw => word.includes(nw))) {
      negativeScore++
      foundKeywords.push(word)
      if (['sad', 'angry', 'frustrated', 'worried', 'stressed'].some(e => word.includes(e))) {
        emotions.push(word)
      }
    } else if (neutralWords.some(nuw => word.includes(nuw))) {
      neutralScore++
      foundKeywords.push(word)
    }
  }

  // Content theme detection
  const themes: string[] = []
  const categories: string[] = []
  const entities: string[] = []

  if (familyWords.some(fw => lowerText.includes(fw))) {
    themes.push('family')
    categories.push('relationships')
  }
  if (workWords.some(ww => lowerText.includes(ww))) {
    themes.push('work')
    categories.push('career')
  }
  if (adventureWords.some(aw => lowerText.includes(aw))) {
    themes.push('adventure')
    categories.push('outdoor')
  }
  if (healthWords.some(hw => lowerText.includes(hw))) {
    themes.push('health')
    categories.push('wellness')
  }
  if (creativeWords.some(cw => lowerText.includes(cw))) {
    themes.push('creativity')
    categories.push('artistic')
  }
  if (socialWords.some(sw => lowerText.includes(sw))) {
    themes.push('social')
    categories.push('relationships')
  }
  if (learningWords.some(lw => lowerText.includes(lw))) {
    themes.push('learning')
    categories.push('growth')
  }
  if (challengeWords.some(chw => lowerText.includes(chw))) {
    themes.push('challenge')
    categories.push('growth')
  }

  // Extract entities (people, places, specific things mentioned)
  const namePatterns = /\b[A-Z][a-z]+\b/g
  const nameMatches = text.match(namePatterns) || []
  entities.push(...nameMatches.filter(name => !['I', 'My', 'The', 'This', 'That', 'Today', 'Yesterday', 'Tomorrow'].includes(name)))

  // Determine overall sentiment
  const totalScore = positiveScore + negativeScore + neutralScore
  let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  let confidence: number
  let intensity: 'low' | 'medium' | 'high'

  if (totalScore === 0) {
    sentiment = 'neutral'
    confidence = 0.5
    intensity = 'low'
  } else if (positiveScore > 0 && negativeScore > 0 && Math.abs(positiveScore - negativeScore) <= 1) {
    sentiment = 'mixed'
    confidence = Math.min(0.8, 0.6 + (Math.min(positiveScore, negativeScore) / totalScore) * 0.2)
    intensity = positiveScore + negativeScore > 3 ? 'high' : 'medium'
  } else if (positiveScore > negativeScore && positiveScore > neutralScore) {
    sentiment = 'positive'
    confidence = Math.min(0.9, 0.5 + (positiveScore / totalScore) * 0.4)
    intensity = positiveScore > 3 ? 'high' : positiveScore > 1 ? 'medium' : 'low'
  } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
    sentiment = 'negative'
    confidence = Math.min(0.9, 0.5 + (negativeScore / totalScore) * 0.4)
    intensity = negativeScore > 3 ? 'high' : negativeScore > 1 ? 'medium' : 'low'
  } else {
    sentiment = 'neutral'
    confidence = Math.min(0.8, 0.5 + (neutralScore / totalScore) * 0.3)
    intensity = 'low'
  }

  // Determine conversation depth (how many exchanges so far)
  const conversationDepth = conversationHistory.length

  // Suggest question types based on analysis
  const suggestedQuestionTypes: string[] = []

  if (sentiment === 'positive') {
    if (intensity === 'high') {
      suggestedQuestionTypes.push('celebrate', 'amplify', 'share')
    } else {
      suggestedQuestionTypes.push('explore', 'build-on')
    }
  } else if (sentiment === 'negative') {
    if (intensity === 'high') {
      suggestedQuestionTypes.push('support', 'process', 'cope')
    } else {
      suggestedQuestionTypes.push('understand', 'explore-challenge')
    }
  } else if (sentiment === 'mixed') {
    suggestedQuestionTypes.push('balance', 'complexity', 'nuanced')
  } else {
    suggestedQuestionTypes.push('clarify', 'deepen', 'reflect')
  }

  // Add content-specific question types
  if (themes.includes('family')) {
    suggestedQuestionTypes.push('relationship', 'connection')
  }
  if (themes.includes('work')) {
    suggestedQuestionTypes.push('professional', 'achievement')
  }
  if (themes.includes('adventure')) {
    suggestedQuestionTypes.push('exploration', 'experience')
  }
  if (themes.includes('challenge')) {
    suggestedQuestionTypes.push('growth', 'learning')
  }

  // Adjust based on conversation depth
  if (conversationDepth > 4) {
    suggestedQuestionTypes.push('synthesis', 'insight')
  } else if (conversationDepth < 2) {
    suggestedQuestionTypes.push('opening', 'encourage')
  }

  return {
    mood: {
      sentiment,
      confidence,
      keywords: foundKeywords,
      emotions,
      intensity
    },
    content: {
      themes,
      categories,
      entities: Array.from(new Set(entities)), // Remove duplicates
      topics: Array.from(new Set([...themes, ...categories]))
    },
    suggestedQuestionTypes,
    conversationDepth
  }
}

/**
 * Generate contextual follow-up questions based on mood and content analysis
 */
export function generateContextualQuestions(analysis: ContextualAnalysis): string[] {
  const { mood, content, suggestedQuestionTypes } = analysis
  const questions: string[] = []

  // Positive mood questions
  if (mood.sentiment === 'positive') {
    if (mood.intensity === 'high') {
      questions.push(
        "That sounds absolutely wonderful! What made this experience so special for you?",
        "I can hear the joy in your words! What part of this do you want to remember most?",
        "This sounds like such a meaningful moment. How do you want to celebrate or build on this feeling?"
      )
    } else {
      questions.push(
        "That sounds really nice! What aspects of this experience stood out to you?",
        "I'm glad you had a positive experience. What made it feel good for you?",
        "It sounds like things went well. What do you think contributed to that?"
      )
    }
  }

  // Negative mood questions
  else if (mood.sentiment === 'negative') {
    if (mood.intensity === 'high') {
      questions.push(
        "That sounds really challenging. How are you feeling about it right now?",
        "I can hear this was difficult for you. What support do you need to process this?",
        "This sounds overwhelming. What's the most important thing for you to focus on right now?"
      )
    } else {
      questions.push(
        "That sounds frustrating. What part of this situation is bothering you most?",
        "I understand this is challenging. What do you think might help in this situation?",
        "It sounds like you're working through something difficult. What are your thoughts on how to move forward?"
      )
    }
  }

  // Mixed emotions questions
  else if (mood.sentiment === 'mixed') {
    questions.push(
      "It sounds like you're experiencing some complex feelings about this. Can you tell me more about that mix of emotions?",
      "I hear both positive and challenging aspects in what you're sharing. Which feeling is stronger right now?",
      "These situations with mixed emotions can be really interesting to explore. What's it like to hold both of these feelings at once?"
    )
  }

  // Content-specific questions
  if (content.themes.includes('family')) {
    questions.push(
      "Family relationships can be so meaningful. How did this interaction affect your connection with them?",
      "It sounds like family is important to you. What did you learn about your relationship through this experience?",
      "Family moments like this can teach us a lot. What stood out to you about this interaction?"
    )
  }

  if (content.themes.includes('work')) {
    questions.push(
      "Work experiences can really impact how we feel about ourselves. How did this affect your sense of accomplishment?",
      "Professional situations like this can be complex. What did you learn about yourself through this?",
      "How do you think this work experience aligns with your broader goals and values?"
    )
  }

  if (content.themes.includes('adventure')) {
    questions.push(
      "Adventures often teach us something about ourselves. What did you discover through this experience?",
      "It sounds like you really value these kinds of experiences. What draws you to adventures like this?",
      "Outdoor experiences can be so grounding. How did being in nature affect your perspective?"
    )
  }

  if (content.themes.includes('challenge')) {
    questions.push(
      "Challenges often reveal our strengths. What did you learn about yourself through facing this?",
      "Difficult situations can be great teachers. What insights are you taking from this experience?",
      "How do you think working through this challenge might help you in the future?"
    )
  }

  // Conversation depth adjustments
  if (analysis.conversationDepth > 4) {
    questions.push(
      "As we've been talking, what patterns or themes are you noticing in your thoughts?",
      "Looking back on everything you've shared, what feels most important or meaningful to you?",
      "What insights are you walking away with from reflecting on all of this?"
    )
  }

  // Return a selection of the most relevant questions
  return questions.slice(0, 5)
}

/**
 * Get a fallback question when AI is not available, based on basic analysis
 */
export function getFallbackQuestion(analysis: ContextualAnalysis): string {
  const { mood, content } = analysis

  if (mood.sentiment === 'positive') {
    if (content.themes.includes('family')) {
      return "That sounds wonderful! How did this experience with your family make you feel?"
    } else if (content.themes.includes('work')) {
      return "That's great news! What did this accomplishment mean to you?"
    } else {
      return "That sounds really positive! What made this experience special for you?"
    }
  }

  if (mood.sentiment === 'negative') {
    if (content.themes.includes('work')) {
      return "Work challenges can be tough. How are you thinking about moving forward with this?"
    } else if (content.themes.includes('family')) {
      return "Family situations can be complex. What support do you need to work through this?"
    } else {
      return "That sounds challenging. What's the most important thing for you to focus on right now?"
    }
  }

  if (mood.sentiment === 'mixed') {
    return "It sounds like you're experiencing some complex feelings about this. Can you tell me more about that?"
  }

  // Neutral fallback
  if (mood.sentiment === 'neutral') {
    if (content.themes.includes('family')) {
      return "That sounds like a meaningful moment with your family. How did that experience make you feel?"
    } else if (content.themes.includes('work')) {
      return "That's interesting about your work situation. How are you feeling about it?"
    } else if (content.themes.includes('adventure')) {
      return "That adventure sounds interesting. What stood out most to you about that experience?"
    }
  }

  const fallbacks = [
    "That's interesting. How did that make you feel?",
    "Can you tell me more about what was going through your mind?",
    "What was the most significant part of that experience for you?",
    "How do you think that experience might influence you going forward?",
    "What emotions came up for you during that time?"
  ]

  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

/**
 * Generate a system prompt for AI based on the contextual analysis
 */
export function generateSystemPrompt(analysis: ContextualAnalysis): string {
  const { mood, content } = analysis
  
  let basePrompt = "You are a supportive journal companion helping the user explore their thoughts and feelings. "
  
  // Adjust tone based on mood
  if (mood.sentiment === 'positive') {
    basePrompt += "The user is in a positive mood. Encourage them to elaborate on their positive experiences and help them savor these moments. "
  } else if (mood.sentiment === 'negative') {
    basePrompt += "The user is experiencing some challenges. Be empathetic and supportive. Help them process their feelings without being overly solution-focused. "
  } else if (mood.sentiment === 'mixed') {
    basePrompt += "The user has complex or mixed feelings. Acknowledge the nuance of their experience and help them explore both sides. "
  } else {
    basePrompt += "Ask thoughtful questions to help the user explore their thoughts and feelings. "
  }
  
  // Add content-specific guidance
  if (content.themes.length > 0) {
    basePrompt += `They mentioned topics related to: ${content.themes.join(', ')}. `
  }
  
  basePrompt += "Ask a follow-up question that feels natural and encouraging. Keep your response under 2-3 sentences. Be warm but not overly enthusiastic."
  
  return basePrompt
}

/**
 * Generate conversation metadata without AI based on content analysis
 */
export function generateConversationMetadata(messages: Array<{role: 'user' | 'assistant', content: string}>): {
  title: string
  summary: string
  synopsis: string
  contentTags: string[]
  statTags: string[]
} {
  // Filter user messages and analyze content
  const userMessages = messages.filter(msg => msg.role === 'user')
  const conversationText = userMessages.map(msg => msg.content).join(' ')
  
  if (conversationText.length === 0) {
    return {
      title: 'Journal Entry',
      summary: 'Daily reflection recorded',
      synopsis: 'User shared thoughts and experiences',
      contentTags: ['reflection'],
      statTags: []
    }
  }
  
  // Analyze the complete conversation
  const analysis = analyzeMoodAndContent(conversationText, [])
  
  // Generate title based on themes and sentiment
  let title = 'Journal Entry'
  if (analysis.content.themes.length > 0) {
    const primaryTheme = analysis.content.themes[0]
    if (primaryTheme === 'family') {
      title = analysis.mood.sentiment === 'positive' ? 'Family Time' : 
             analysis.mood.sentiment === 'negative' ? 'Family Challenges' : 'Family Reflections'
    } else if (primaryTheme === 'work') {
      title = analysis.mood.sentiment === 'positive' ? 'Work Success' : 
             analysis.mood.sentiment === 'negative' ? 'Work Challenges' : 'Work Reflections'
    } else if (primaryTheme === 'adventure') {
      title = 'Adventure Story'
    } else if (primaryTheme === 'health') {
      title = 'Health Journey'
    } else if (primaryTheme === 'creativity') {
      title = 'Creative Expression'
    } else if (primaryTheme === 'social') {
      title = 'Social Connection'
    } else if (primaryTheme === 'learning') {
      title = 'Learning Experience'
    } else if (primaryTheme === 'challenge') {
      title = 'Personal Challenge'
    }
  }
  
  // Generate summary based on sentiment and themes
  let summary = 'Daily reflection recorded'
  if (analysis.mood.sentiment === 'positive') {
    summary = `Positive experience shared`
    if (analysis.content.themes.includes('family')) summary += ' about family time'
    if (analysis.content.themes.includes('work')) summary += ' about work achievements'
    if (analysis.content.themes.includes('adventure')) summary += ' about an adventure'
  } else if (analysis.mood.sentiment === 'negative') {
    summary = `Challenging experience processed`
    if (analysis.content.themes.includes('family')) summary += ' involving family'
    if (analysis.content.themes.includes('work')) summary += ' related to work'
  } else if (analysis.mood.sentiment === 'mixed') {
    summary = `Complex feelings explored`
    if (analysis.content.themes.length > 0) summary += ` about ${analysis.content.themes[0]}`
  } else {
    summary = `Thoughts and reflections shared`
    if (analysis.content.themes.length > 0) summary += ` about ${analysis.content.themes[0]}`
  }
  
  // Create synopsis
  const synopsis = `User reflected on ${analysis.content.themes.length > 0 ? analysis.content.themes.join(', ') : 'their experiences'} with ${analysis.mood.sentiment} sentiment`
  
  // Generate content tags
  const contentTags = ['reflection', analysis.mood.sentiment, ...analysis.content.themes]
  
  // Map themes to potential stat categories
  const statTags: string[] = []
  if (analysis.content.themes.includes('family')) statTags.push('Social')
  if (analysis.content.themes.includes('work')) statTags.push('Professional')
  if (analysis.content.themes.includes('adventure')) statTags.push('Physical Health')
  if (analysis.content.themes.includes('health')) statTags.push('Physical Health')
  if (analysis.content.themes.includes('creativity')) statTags.push('Creativity')
  if (analysis.content.themes.includes('learning')) statTags.push('Knowledge')
  if (analysis.content.themes.includes('challenge')) statTags.push('Mental Health')
  
  return {
    title,
    summary,
    synopsis,
    contentTags,
    statTags
  }
}
