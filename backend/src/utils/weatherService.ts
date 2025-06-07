/**
 * Weather API integration for context-aware task generation
 * Uses a free weather service to provide environmental context
 */

export interface WeatherData {
  temperature: number;
  description: string;
  condition: string; // sunny, cloudy, rainy, snowy, etc.
  summary: string; // human-readable summary for GPT
}

/**
 * Get weather data for a zip code
 * Falls back gracefully if weather data is unavailable
 */
export async function getWeatherData(zipCode: string): Promise<WeatherData | null> {
  // For now, we'll use a mock implementation since we don't want to add
  // external API dependencies without API keys
  // In a real implementation, you would use OpenWeatherMap, WeatherAPI, or similar
  
  try {
    // Mock weather data based on zip code patterns
    // This provides realistic fallback behavior for testing
    const mockWeather = generateMockWeather(zipCode);
    return mockWeather;
  } catch (error) {
    console.warn('Failed to fetch weather data:', error);
    return null;
  }
}

/**
 * Generate mock weather data for testing and fallback
 * This can be replaced with real API calls when API keys are configured
 */
function generateMockWeather(zipCode: string): WeatherData {
  // Simple mock based on zip code patterns and current date
  const today = new Date();
  const month = today.getMonth();
  const isWinter = month === 11 || month === 0 || month === 1;
  const isSummer = month >= 5 && month <= 8;
  
  // Mock temperature based on season and location (first digit of zip code as rough region)
  const region = parseInt(zipCode.charAt(0)) || 5;
  let baseTemp = 65; // Default temperature
  
  if (isWinter) {
    baseTemp = 35 + (region * 3); // Colder in winter
  } else if (isSummer) {
    baseTemp = 75 + (region * 2); // Warmer in summer  
  } else {
    baseTemp = 55 + (region * 3); // Spring/fall
  }
  
  // Add some variation
  const temperature = baseTemp + Math.random() * 20 - 10;
  
  // Mock conditions based on season
  const conditions = isWinter 
    ? ['cloudy', 'cold', 'overcast', 'chilly']
    : isSummer 
    ? ['sunny', 'warm', 'clear', 'bright']
    : ['partly cloudy', 'mild', 'pleasant', 'cool'];
    
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  const description = isWinter 
    ? 'Cold and overcast'
    : isSummer
    ? 'Warm and sunny'
    : 'Pleasant and mild';
    
  const summary = `It will be ${condition} today with temperatures around ${Math.round(temperature)}°F. ${description}.`;
  
  return {
    temperature: Math.round(temperature),
    description,
    condition,
    summary
  };
}

/**
 * Get environmental context including day, season, and weather
 */
export interface EnvironmentalContext {
  dayOfWeek: string;
  month: string;
  season: string;
  locationDescription?: string;
  weather?: WeatherData;
}

export async function getEnvironmentalContext(
  locationDescription?: string, 
  zipCode?: string
): Promise<EnvironmentalContext> {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const month = today.toLocaleDateString('en-US', { month: 'long' });
  
  // Determine season
  const monthIndex = today.getMonth();
  let season: string;
  if (monthIndex >= 2 && monthIndex <= 4) {
    season = 'spring';
  } else if (monthIndex >= 5 && monthIndex <= 7) {
    season = 'summer';
  } else if (monthIndex >= 8 && monthIndex <= 10) {
    season = 'fall';
  } else {
    season = 'winter';
  }
  
  // Get weather data if zip code is provided
  let weather: WeatherData | undefined;
  if (zipCode) {
    weather = await getWeatherData(zipCode) || undefined;
  }
  
  return {
    dayOfWeek,
    month,
    season,
    locationDescription,
    weather
  };
}