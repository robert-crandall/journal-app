import { env } from '../env'

export interface LevelTitleRequest {
  statCategory: string
  newLevel: number
  characterClass: string
  characterBackstory?: string
}

/**
 * Generate a humorous, contextual level title using GPT
 * Based on the character's stat progression, class, and backstory
 */
export async function generateLevelTitle(request: LevelTitleRequest): Promise<string> {
  const { statCategory, newLevel, characterClass, characterBackstory } = request

  // If no OpenAI API key is configured, return a fallback title
  if (!env.OPENAI_API_KEY) {
    return generateFallbackTitle(statCategory, newLevel)
  }

  try {
    // Construct the GPT prompt for level title generation
    const prompt = buildLevelTitlePrompt(statCategory, newLevel, characterClass, characterBackstory)

    // Make API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_GPT_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative D&D Dungeon Master who generates humorous, contextual level titles for character stats. Keep titles concise (2-6 words), appropriate for all ages, and tailored to the character\'s class and backstory.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.8, // Higher creativity for humorous titles
        n: 1
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return generateFallbackTitle(statCategory, newLevel)
    }

    const data = await response.json()
    const generatedTitle = data.choices?.[0]?.message?.content?.trim()

    if (!generatedTitle) {
      console.error('No title generated from OpenAI response')
      return generateFallbackTitle(statCategory, newLevel)
    }

    // Clean up the title (remove quotes, extra formatting)
    const cleanTitle = cleanLevelTitle(generatedTitle)
    
    // Validate title length and content
    if (cleanTitle.length > 50 || cleanTitle.length < 2) {
      console.warn(`Generated title length invalid: "${cleanTitle}"`)
      return generateFallbackTitle(statCategory, newLevel)
    }

    return cleanTitle

  } catch (error) {
    console.error('Error generating level title with GPT:', error)
    return generateFallbackTitle(statCategory, newLevel)
  }
}

/**
 * Build the prompt for GPT level title generation
 */
function buildLevelTitlePrompt(
  statCategory: string,
  newLevel: number, 
  characterClass: string,
  characterBackstory?: string
): string {
  const levelContext = getLevelContext(newLevel)
  const backstoryContext = characterBackstory ? `\nCharacter backstory: ${characterBackstory}` : ''

  return `Generate a humorous level title for a character's stat progression:

Stat Category: ${statCategory}
New Level: ${newLevel} (${levelContext})
Character Class: ${characterClass}${backstoryContext}

The title should:
- Be 2-6 words long
- Be humorous but appropriate for all ages
- Reflect the character's class and backstory
- Match the level progression (low levels = humble/beginner, high levels = impressive/master)
- Be specific to the "${statCategory}" stat category

Examples for reference:
- Physical Health Level 2: "Enthusiastic Couch Escapee"
- Mental Wellness Level 5: "Zen Garden Apprentice" 
- Family Bonding Level 10: "Master Bedtime Storyteller"
- Adventure Spirit Level 15: "Legendary Trail Blazer"

Generate only the title, no additional text:`
}

/**
 * Get context about what the level represents
 */
function getLevelContext(level: number): string {
  if (level <= 2) return 'beginner'
  if (level <= 5) return 'novice'
  if (level <= 10) return 'intermediate'
  if (level <= 15) return 'advanced'
  return 'master'
}

/**
 * Clean and format the generated title
 */
function cleanLevelTitle(title: string): string {
  return title
    .replace(/['"]/g, '') // Remove quotes
    .replace(/^(Level \d+:?\s*)?/i, '') // Remove "Level X:" prefix if present
    .replace(/^\w+\s+(Level|Lvl)\s+\d+:?\s*/i, '') // Remove other level prefixes
    .trim()
}

/**
 * Generate a fallback title when GPT is unavailable
 */
function generateFallbackTitle(statCategory: string, newLevel: number): string {
  const fallbackTitles: Record<string, string[]> = {
    'Physical Health': [
      'Couch Escapee',
      'Gym Explorer', 
      'Fitness Enthusiast',
      'Athletic Achiever',
      'Wellness Warrior',
      'Health Champion',
      'Fitness Guru',
      'Physical Peak',
      'Body Master',
      'Strength Legend'
    ],
    'Mental Wellness': [
      'Stress Rookie',
      'Calm Seeker',
      'Mindful Student', 
      'Zen Apprentice',
      'Peace Practitioner',
      'Clarity Champion',
      'Mindfulness Master',
      'Mental Monk',
      'Wisdom Keeper',
      'Enlightened One'
    ],
    'Family Bonding': [
      'Family Friend',
      'Quality Timer',
      'Memory Maker',
      'Connection Creator',
      'Bonding Builder',
      'Family Champion',
      'Love Leader',
      'Relationship Master',
      'Family Guru',
      'Bond Legend'
    ],
    'Professional Growth': [
      'Career Climber',
      'Skill Seeker',
      'Growth Minded',
      'Professional Player',
      'Career Champion',
      'Skill Master',
      'Growth Guru',
      'Professional Peak',
      'Career Legend',
      'Success Sage'
    ],
    'Creative Expression': [
      'Creative Curious',
      'Art Explorer',
      'Creative Craft',
      'Artistic Achiever',
      'Creative Champion',
      'Art Master',
      'Creative Guru',
      'Artistic Peak',
      'Creative Legend',
      'Imagination Icon'
    ],
    'Social Connection': [
      'Social Starter',
      'Friend Finder',
      'Social Seeker',
      'Connection Creator',
      'Social Champion',
      'Friend Master',
      'Social Guru',
      'Connection Peak',
      'Social Legend',
      'Network Ninja'
    ]
  }

  const categoryTitles = fallbackTitles[statCategory] || fallbackTitles['Physical Health']
  const titleIndex = Math.min(newLevel - 1, categoryTitles.length - 1)
  
  return categoryTitles[titleIndex] || `Level ${newLevel} Achiever`
}
