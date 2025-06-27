// Weather API Integration Service - Task 4.2
import { env } from '../env'

export interface WeatherError {
  type: 'configuration' | 'validation' | 'not_found' | 'rate_limit' | 'network' | 'service_unavailable'
  message: string
}

export interface CurrentWeatherData {
  location: string
  temperature: number
  feelsLike: number
  condition: string
  description: string
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  visibility: number
  timestamp: number
}

export interface WeatherForecastDay {
  date: string
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  timestamp: number
}

export interface WeatherForecastData {
  location: string
  forecast: WeatherForecastDay[]
}

export interface WeatherContext {
  currentCondition: string
  temperature: number
  isOutdoorFriendly: boolean
  isIndoorFriendly: boolean
  aiTaskSuggestions: string[]
  weatherDescription: string
  recommendedActivities: string[]
  avoidActivities: string[]
}

export interface WeatherResponse<T> {
  success: boolean
  data?: T
  error?: WeatherError
}

// Simple in-memory cache for weather data (5 minute expiration)
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }
}

export class WeatherService {
  private readonly apiKey: string | undefined
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5'
  private currentWeatherCache = new SimpleCache<CurrentWeatherData>()
  private forecastCache = new SimpleCache<WeatherForecastData>()

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || env.WEATHER_API_KEY
  }

  /**
   * Get current weather data for a zip code
   */
  async getCurrentWeather(zipCode: string): Promise<WeatherResponse<CurrentWeatherData>> {
    try {
      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: {
            type: 'configuration',
            message: 'Weather API key is not configured'
          }
        }
      }

      // Validate zip code format
      if (!this.isValidZipCode(zipCode)) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Invalid zip code format. Please provide a valid US zip code.'
          }
        }
      }

      // Check cache first
      const cacheKey = `current_${zipCode}`
      const cachedData = this.currentWeatherCache.get(cacheKey)
      if (cachedData) {
        return {
          success: true,
          data: cachedData
        }
      }

      // Make API request
      const url = `${this.baseUrl}/weather?zip=${zipCode},US&appid=${this.apiKey}&units=imperial`
      const response = await fetch(url)

      if (!response.ok) {
        return this.handleApiError(response)
      }

      const apiData = await response.json()
      
      // Transform API response to our format
      const weatherData: CurrentWeatherData = {
        location: apiData.name,
        temperature: apiData.main.temp,
        feelsLike: apiData.main.feels_like,
        condition: apiData.weather[0].main,
        description: apiData.weather[0].description,
        humidity: apiData.main.humidity,
        pressure: apiData.main.pressure,
        windSpeed: apiData.wind?.speed || 0,
        windDirection: apiData.wind?.deg || 0,
        visibility: apiData.visibility || 0,
        timestamp: apiData.dt
      }

      // Cache the result
      this.currentWeatherCache.set(cacheKey, weatherData)

      return {
        success: true,
        data: weatherData
      }

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'network',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  /**
   * Get weather forecast for a zip code
   */
  async getWeatherForecast(zipCode: string, days: number = 5): Promise<WeatherResponse<WeatherForecastData>> {
    try {
      // Validate API key
      if (!this.apiKey) {
        return {
          success: false,
          error: {
            type: 'configuration',
            message: 'Weather API key is not configured'
          }
        }
      }

      // Validate zip code format
      if (!this.isValidZipCode(zipCode)) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Invalid zip code format. Please provide a valid US zip code.'
          }
        }
      }

      // Validate days parameter
      if (days < 1 || days > 5) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Forecast days must be between 1 and 5. Maximum 5 days supported.'
          }
        }
      }

      // Check cache first
      const cacheKey = `forecast_${zipCode}_${days}`
      const cachedData = this.forecastCache.get(cacheKey)
      if (cachedData) {
        return {
          success: true,
          data: cachedData
        }
      }

      // Make API request
      const url = `${this.baseUrl}/forecast?zip=${zipCode},US&appid=${this.apiKey}&units=imperial&cnt=${days * 8}` // 8 forecasts per day (3-hour intervals)
      const response = await fetch(url)

      if (!response.ok) {
        return this.handleApiError(response)
      }

      const apiData = await response.json()
      
      // Group forecasts by day and take the midday forecast for each day
      const forecastByDay = new Map<string, any>()
      
      for (const forecast of apiData.list) {
        const date = new Date(forecast.dt * 1000)
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
        const hour = date.getHours()
        
        // Prefer midday forecasts (around 12:00 PM) for daily summary
        if (!forecastByDay.has(dateKey) || Math.abs(hour - 12) < Math.abs(forecastByDay.get(dateKey).hour - 12)) {
          forecastByDay.set(dateKey, { ...forecast, hour })
        }
      }

      // Transform to our format
      const forecastDays: WeatherForecastDay[] = Array.from(forecastByDay.values())
        .slice(0, days)
        .map(forecast => ({
          date: new Date(forecast.dt * 1000).toISOString().split('T')[0],
          temperature: forecast.main.temp,
          condition: forecast.weather[0].main,
          description: forecast.weather[0].description,
          humidity: forecast.main.humidity,
          windSpeed: forecast.wind?.speed || 0,
          timestamp: forecast.dt
        }))

      const forecastData: WeatherForecastData = {
        location: apiData.city.name,
        forecast: forecastDays
      }

      // Cache the result
      this.forecastCache.set(cacheKey, forecastData)

      return {
        success: true,
        data: forecastData
      }

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'network',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  /**
   * Get weather context for AI task generation
   */
  async getWeatherContext(zipCode: string): Promise<WeatherResponse<WeatherContext>> {
    try {
      const currentWeatherResponse = await this.getCurrentWeather(zipCode)
      
      if (!currentWeatherResponse.success || !currentWeatherResponse.data) {
        return {
          success: false,
          error: currentWeatherResponse.error
        }
      }

      const weather = currentWeatherResponse.data
      
      // Determine activity recommendations based on weather conditions
      const context = this.analyzeWeatherForActivities(weather)

      return {
        success: true,
        data: context
      }

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'network',
          message: `Error generating weather context: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  /**
   * Analyze weather conditions to provide activity recommendations
   */
  private analyzeWeatherForActivities(weather: CurrentWeatherData): WeatherContext {
    const { condition, temperature, windSpeed, description } = weather
    
    let isOutdoorFriendly = true
    let aiTaskSuggestions: string[] = []
    let recommendedActivities: string[] = []
    let avoidActivities: string[] = []

    // Temperature considerations
    if (temperature < 32) {
      isOutdoorFriendly = false
      aiTaskSuggestions.push('indoor', 'cozy', 'warm')
      avoidActivities.push('swimming', 'beach activities', 'outdoor sports')
    } else if (temperature > 95) {
      isOutdoorFriendly = false
      aiTaskSuggestions.push('indoor', 'cooling', 'air conditioned')
      avoidActivities.push('hiking', 'running', 'outdoor exercise')
    } else if (temperature >= 65 && temperature <= 85) {
      aiTaskSuggestions.push('outdoor', 'adventure', 'nature')
      recommendedActivities.push('walking', 'hiking', 'outdoor sports')
    }

    // Condition-based recommendations
    const conditionLower = condition.toLowerCase()
    const descriptionLower = description.toLowerCase()

    if (conditionLower.includes('rain') || conditionLower.includes('storm')) {
      isOutdoorFriendly = false
      aiTaskSuggestions.push('indoor', 'reading', 'creative projects')
      avoidActivities.push('hiking', 'picnics', 'outdoor activities')
      recommendedActivities.push('indoor hobbies', 'cooking', 'organizing')
    } else if (conditionLower.includes('snow')) {
      if (temperature > 25) {
        aiTaskSuggestions.push('winter sports', 'snow activities')
        recommendedActivities.push('snow games', 'winter photography')
      } else {
        isOutdoorFriendly = false
        aiTaskSuggestions.push('indoor', 'warm beverages', 'cozy activities')
      }
      avoidActivities.push('cycling', 'running')
    } else if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
      aiTaskSuggestions.push('outdoor', 'adventure', 'vitamin D', 'nature')
      recommendedActivities.push('hiking', 'walking', 'outdoor exercise', 'gardening')
    } else if (conditionLower.includes('cloud')) {
      aiTaskSuggestions.push('outdoor', 'comfortable weather')
      recommendedActivities.push('walking', 'sightseeing')
    }

    // Wind considerations
    if (windSpeed > 20) {
      isOutdoorFriendly = false
      avoidActivities.push('cycling', 'outdoor sports')
      aiTaskSuggestions.push('indoor', 'protected areas')
    }

    // Fog/visibility considerations
    if (descriptionLower.includes('fog') || descriptionLower.includes('mist')) {
      avoidActivities.push('driving', 'hiking', 'cycling')
      aiTaskSuggestions.push('indoor', 'close-to-home')
    }

    return {
      currentCondition: condition,
      temperature,
      isOutdoorFriendly,
      isIndoorFriendly: true, // Indoor activities are always possible
      aiTaskSuggestions,
      weatherDescription: description,
      recommendedActivities,
      avoidActivities
    }
  }

  /**
   * Validate US zip code format
   */
  private isValidZipCode(zipCode: string): boolean {
    // US zip code patterns: 12345 or 12345-6789
    const zipRegex = /^\d{5}(-\d{4})?$/
    return zipRegex.test(zipCode)
  }

  /**
   * Handle API error responses
   */
  private async handleApiError(response: Response): Promise<WeatherResponse<never>> {
    const status = response.status
    
    try {
      const errorData = await response.json()
      
      switch (status) {
        case 404:
          return {
            success: false,
            error: {
              type: 'not_found',
              message: 'Location not found. Please check the zip code and try again.'
            }
          }
        case 429:
          return {
            success: false,
            error: {
              type: 'rate_limit',
              message: 'API rate limit exceeded. Please try again later.'
            }
          }
        case 503:
          return {
            success: false,
            error: {
              type: 'service_unavailable',
              message: 'Weather service is temporarily unavailable. Please try again later.'
            }
          }
        default:
          return {
            success: false,
            error: {
              type: 'network',
              message: `API error: ${errorData.message || 'Unknown error'}`
            }
          }
      }
    } catch {
      return {
        success: false,
        error: {
          type: 'service_unavailable',
          message: 'Weather service is temporarily unavailable. Please try again later.'
        }
      }
    }
  }

  /**
   * Clear all cached weather data (useful for testing)
   */
  clearCache(): void {
    this.currentWeatherCache.clear()
    this.forecastCache.clear()
  }
}
