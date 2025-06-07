/**
 * Test GPT prompt generation with environmental context
 */

// Simple mock for dependencies
const mockUser = {
  id: 'user1',
  name: 'John Doe',
  gptContext: { role: 'software developer', interests: ['fitness', 'reading'] }
};

const mockStats = [
  { id: 'stat1', name: 'Fitness', category: 'body', level: 5, xp: 120, description: 'Physical health and exercise' },
  { id: 'stat2', name: 'Learning', category: 'mind', level: 3, xp: 80, description: 'Continuous learning and growth' }
];

const mockFamilyMembers = [
  { id: 'family1', name: 'Jane', gptContext: { role: 'spouse' } }
];

const mockTodaysFocus = {
  name: 'Physical Health',
  description: 'Focus on body and fitness',
  sampleActivities: ['exercise', 'stretching', 'nutrition']
};

const mockEnvironmentalContext = {
  dayOfWeek: 'Saturday',
  month: 'June',
  season: 'summer',
  locationDescription: 'Seattle area',
  weather: {
    temperature: 75,
    description: 'Sunny and warm',
    condition: 'sunny',
    summary: 'It will be sunny today with temperatures around 75°F. Sunny and warm.'
  }
};

// Mock TaskGenerationContext
const mockContext = {
  user: mockUser,
  todaysFocus: mockTodaysFocus,
  userStats: mockStats,
  familyMembers: mockFamilyMembers,
  recentTasks: [],
  recentFeedback: [],
  environmentalContext: mockEnvironmentalContext
};

// Simple version of buildGPTPrompt function for testing
function buildGPTPrompt(context: any): string {
  const { user, todaysFocus, userStats, familyMembers, recentTasks, recentFeedback, environmentalContext } = context;
  
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
  userStats.forEach((stat: any) => {
    prompt += `- ${stat.name} (${stat.category}): Level ${stat.level}, ${stat.xp} XP - ${stat.description || 'No description'}\n`;
  });

  // Family members
  if (familyMembers.length > 0) {
    prompt += `\n## Family Members\n`;
    familyMembers.forEach((member: any) => {
      prompt += `- ${member.name}`;
      if (member.gptContext) {
        prompt += ` - ${JSON.stringify(member.gptContext)}`;
      }
      prompt += `\n`;
    });
  }

  return prompt;
}

function testGPTPromptWithEnvironmentalContext() {
  console.log('Testing GPT Prompt Building with Environmental Context...\n');
  
  const prompt = buildGPTPrompt(mockContext);
  console.log('Generated Prompt:');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80));
  
  // Verify key environmental elements are included
  const requiredElements = [
    'Saturday',
    'June',
    'summer', 
    'Seattle area',
    'sunny',
    'weekend',
    'outdoor activities'
  ];
  
  let allElementsFound = true;
  console.log('\nChecking for required environmental elements:');
  requiredElements.forEach(element => {
    const found = prompt.includes(element);
    console.log(`- ${element}: ${found ? '✓' : '✗'}`);
    if (!found) allElementsFound = false;
  });
  
  console.log(`\nResult: ${allElementsFound ? '✅ All environmental context elements found!' : '❌ Some elements missing'}`);
}

// Only run if this file is executed directly
if (require.main === module) {
  testGPTPromptWithEnvironmentalContext();
}

export { testGPTPromptWithEnvironmentalContext };