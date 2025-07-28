/**
 * Shared utility for generating tone instructions for GPT-based features
 */

/**
 * Generate tone instruction for conversational GPT based on user preference
 */
export function getConversationalToneInstruction(gptTone?: string): string {
  switch (gptTone) {
    case 'motivational':
      return 'Be an energetic life coach and cheerleader. Use high-energy language, exclamation points, and focus on action and motivation. Push them to see their potential and take action.';
    case 'funny':
      return 'Use humor, wit, and playful banter. Make light of situations appropriately, use jokes and funny observations, but still be supportive and insightful.';
    case 'serious':
      return 'Be direct, professional, and analytical. Focus on facts, logical insights, and practical advice. Avoid overly emotional language or excessive pleasantries.';
    case 'minimal':
      return 'Be concise and to the point. Use few words, get straight to insights, avoid elaboration or lengthy responses.';
    case 'wholesome':
      return 'Be nurturing, gentle, and deeply supportive. Use calming language, focus on self-compassion and understanding. Be like a wise, caring mentor.';
    case 'friendly':
    default:
      return 'Be warm, approachable, and conversational. Strike a balance between supportive and insightful, like a good friend who really listens.';
  }
}
