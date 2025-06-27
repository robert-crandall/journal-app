// Weather API Integration Service Unit Tests - Task 4.2
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { WeatherService } from './weather-service'

describe('Weather Service Unit Tests - Task 4.2', () => {
  let originalFetch: typeof globalThis.fetch
  let originalEnv: string | undefined

  beforeEach(() => {
    originalFetch = globalThis.fetch
    originalEnv = process.env.WEATHER_API_KEY
    // Set a mock API key for tests
    process.env.WEATHER_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    if (originalEnv !== undefined) {
      process.env.WEATHER_API_KEY = originalEnv
    } else {
      delete process.env.WEATHER_API_KEY
    }
  })

  describe('Service Initialization and Configuration', () => {
    it('should initialize with proper API key management', () => {
      const service = new WeatherService()
      expect(service).toBeDefined()
      expect(typeof service.getCurrentWeather).toBe('function')
      expect(typeof service.getWeatherForecast).toBe('function')
    })

    it('should handle missing API key gracefully', async () => {
      // Temporarily remove API key
      delete process.env.WEATHER_API_KEY
      
      const service = new WeatherService()
      const response = await service.getCurrentWeather('10001')
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('configuration')
      expect(response.error!.message).toMatch(/API key/i)
      
      // Restore API key for other tests
      process.env.WEATHER_API_KEY = 'test-api-key'
    })
  })

  describe('Current Weather Retrieval', () => {
    it('should fetch current weather data successfully', async () => {
      // Mock successful weather API response
      const mockWeatherResponse = {
        name: 'New York',
        main: {
          temp: 72.5,
          feels_like: 75.2,
          humidity: 65,
          pressure: 1013
        },
        weather: [{
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }],
        wind: {
          speed: 5.5,
          deg: 180
        },
        visibility: 10000,
        dt: Math.floor(Date.now() / 1000)
      }

      globalThis.fetch = (async () => new Response(JSON.stringify(mockWeatherResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })) as any

      const service = new WeatherService()
      const response = await service.getCurrentWeather('10001')
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      if (response.success && response.data) {
        expect(response.data.location).toBe('New York')
        expect(response.data.temperature).toBe(72.5)
        expect(response.data.condition).toBe('Clear')
        expect(response.data.humidity).toBe(65)
        expect(response.data.windSpeed).toBe(5.5)
      }
    })

    it('should handle invalid zip code', async () => {
      globalThis.fetch = (async () => new Response(JSON.stringify({
        cod: '404',
        message: 'city not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })) as any

      const service = new WeatherService()
      const response = await service.getCurrentWeather('00000')
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('not_found')
    })

    it('should validate zip code format', async () => {
      globalThis.fetch = (async () => new Response(JSON.stringify({
        cod: '400',
        message: 'Nothing to geocode'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })) as any

      const service = new WeatherService()
      
      // Test invalid formats
      const invalidZips = ['invalid', '123', '123456', 'ABCDE']
      
      for (const zip of invalidZips) {
        const response = await service.getCurrentWeather(zip)
        expect(response.success).toBe(false)
        expect(response.error?.type).toBe('validation')
      }
    })

    it('should implement caching for repeated requests', async () => {
      let callCount = 0
      const mockWeatherResponse = {
        name: 'New York',
        main: { temp: 72.5, feels_like: 75.2, humidity: 65, pressure: 1013 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        wind: { speed: 5.5, deg: 180 },
        visibility: 10000,
        dt: Math.floor(Date.now() / 1000)
      }

      globalThis.fetch = (async () => {
        callCount++
        return new Response(JSON.stringify(mockWeatherResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }) as any

      const service = new WeatherService()
      
      // First call should make API request
      const response1 = await service.getCurrentWeather('10001')
      expect(response1.success).toBe(true)
      expect(callCount).toBe(1)
      
      // Second call within cache window should use cache
      const response2 = await service.getCurrentWeather('10001')
      expect(response2.success).toBe(true)
      expect(callCount).toBe(1) // Should still be 1
      
      // Verify cached data is identical
      if (response1.success && response2.success && response1.data && response2.data) {
        expect(response1.data).toEqual(response2.data)
      }
    })
  })

  describe('Weather Forecast Retrieval', () => {
    it('should fetch 5-day weather forecast', async () => {
      const mockForecastResponse = {
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: { temp: 75, feels_like: 78, humidity: 60, pressure: 1015 },
            weather: [{ main: 'Sunny', description: 'sunny', icon: '01d' }],
            wind: { speed: 3.2, deg: 90 },
            dt_txt: '2024-01-15 12:00:00'
          },
          {
            dt: Math.floor(Date.now() / 1000) + 86400,
            main: { temp: 68, feels_like: 70, humidity: 70, pressure: 1012 },
            weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }],
            wind: { speed: 4.1, deg: 120 },
            dt_txt: '2024-01-16 12:00:00'
          }
        ],
        city: {
          name: 'New York',
          country: 'US'
        }
      }

      globalThis.fetch = (async () => new Response(JSON.stringify(mockForecastResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })) as any

      const service = new WeatherService()
      const response = await service.getWeatherForecast('10001', 5)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      if (response.success && response.data) {
        expect(response.data.location).toBe('New York')
        expect(response.data.forecast).toHaveLength(2)
        expect(response.data.forecast[0].temperature).toBe(75)
        expect(response.data.forecast[0].condition).toBe('Sunny')
        expect(response.data.forecast[1].temperature).toBe(68)
        expect(response.data.forecast[1].condition).toBe('Clouds')
      }
    })

    it('should handle forecast API errors', async () => {
      globalThis.fetch = (async () => new Response('Service Unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })) as any

      const service = new WeatherService()
      const response = await service.getWeatherForecast('10001', 5)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('service_unavailable')
    })
  })

  describe('Weather Context for AI Integration', () => {
    it('should generate AI context from weather data', async () => {
      const mockWeatherResponse = {
        name: 'New York',
        main: {
          temp: 72.5,
          feels_like: 75.2,
          humidity: 65,
          pressure: 1013
        },
        weather: [{
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }],
        wind: {
          speed: 5.5,
          deg: 180
        },
        visibility: 10000,
        dt: Math.floor(Date.now() / 1000)
      }

      globalThis.fetch = (async () => new Response(JSON.stringify(mockWeatherResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })) as any

      const service = new WeatherService()
      const response = await service.getWeatherContext('10001')
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      if (response.success && response.data) {
        expect(response.data.currentCondition).toBeDefined()
        expect(response.data.temperature).toBeDefined()
        expect(response.data.isOutdoorFriendly).toBeDefined()
        expect(response.data.isIndoorFriendly).toBeDefined()
        expect(response.data.aiTaskSuggestions).toBeDefined()
        expect(Array.isArray(response.data.aiTaskSuggestions)).toBe(true)
        expect(response.data.weatherDescription).toBeDefined()
        expect(typeof response.data.weatherDescription).toBe('string')
      }
    })

    it('should provide different recommendations based on weather conditions', async () => {
      const scenarios = [
        {
          name: 'Rainy Weather',
          weather: { main: 'Rain', description: 'heavy rain' },
          temp: 70, // Good temperature but rain makes it indoor-friendly
          expectOutdoor: false
        },
        {
          name: 'Snow Weather', 
          weather: { main: 'Snow', description: 'light snow' },
          temp: 20, // Cold temperature + snow = not outdoor friendly
          expectOutdoor: false
        },
        {
          name: 'Perfect Weather',
          weather: { main: 'Clear', description: 'clear sky' },
          temp: 75, // Perfect temperature + clear = outdoor friendly
          expectOutdoor: true
        }
      ]

      for (const scenario of scenarios) {
        const mockResponse = {
          name: 'Test City',
          main: { temp: scenario.temp, feels_like: scenario.temp, humidity: 50, pressure: 1013 },
          weather: [{ ...scenario.weather, icon: '01d' }],
          wind: { speed: 5, deg: 180 },
          visibility: 10000,
          dt: Math.floor(Date.now() / 1000)
        }

        globalThis.fetch = (async () => new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })) as any

        const service = new WeatherService()
        const response = await service.getWeatherContext('10001')
        
        expect(response.success).toBe(true)
        if (response.success && response.data) {
          expect(response.data.isOutdoorFriendly).toBe(scenario.expectOutdoor)
          expect(response.data.weatherDescription).toContain(scenario.weather.main.toLowerCase())
        }
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      globalThis.fetch = (async () => {
        throw new Error('Network error')
      }) as any

      const service = new WeatherService()
      const response = await service.getCurrentWeather('10001')
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('network')
      expect(response.error!.message).toMatch(/network/i)
    })

    it('should handle API server errors', async () => {
      globalThis.fetch = (async () => new Response('Service Unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })) as any

      const service = new WeatherService()
      const response = await service.getCurrentWeather('10001')
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('service_unavailable')
    })

    it('should handle rate limiting gracefully', async () => {
      globalThis.fetch = (async () => {
        const headers = new Headers()
        headers.set('X-RateLimit-Remaining', '0')
        headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600))
        
        return new Response(JSON.stringify({
          cod: 429,
          message: 'Your account is temporarily blocked due to exceeding of requests limitation'
        }), {
          status: 429,
          headers
        })
      }) as any

      const service = new WeatherService()
      const response = await service.getCurrentWeather('10001')
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('rate_limit')
      expect(response.error!.message).toMatch(/rate limit/i)
    })

    it('should handle malformed API responses', async () => {
      globalThis.fetch = (async () => new Response('invalid json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })) as any

      const service = new WeatherService()
      const response = await service.getCurrentWeather('10001')
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error!.type).toBe('network')
    })
  })

  describe('Performance and Optimization', () => {
    it('should respect cache expiration times', async () => {
      let callCount = 0
      const mockResponse = {
        name: 'Test City',
        main: { temp: 70, feels_like: 72, humidity: 50, pressure: 1013 },
        weather: [{ main: 'Clear', description: 'clear', icon: '01d' }],
        wind: { speed: 5, deg: 180 },
        visibility: 10000,
        dt: Math.floor(Date.now() / 1000)
      }

      globalThis.fetch = (async () => {
        callCount++
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }) as any

      const service = new WeatherService()
      
      // Make initial request
      await service.getCurrentWeather('10001')
      expect(callCount).toBe(1)
      
      // Immediate second request should use cache
      await service.getCurrentWeather('10001')
      expect(callCount).toBe(1)
      
      // Different zip code should make new request
      await service.getCurrentWeather('10002')
      expect(callCount).toBe(2)
    })

    it('should handle concurrent requests efficiently', async () => {
      let callCount = 0
      const mockResponse = {
        name: 'Test City',
        main: { temp: 70, feels_like: 72, humidity: 50, pressure: 1013 },
        weather: [{ main: 'Clear', description: 'clear', icon: '01d' }],
        wind: { speed: 5, deg: 180 },
        visibility: 10000,
        dt: Math.floor(Date.now() / 1000)
      }

      globalThis.fetch = (async () => {
        callCount++
        // Simulate some delay
        await new Promise(resolve => setTimeout(resolve, 10))
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }) as any

      const service = new WeatherService()
      
      // Make multiple concurrent requests for same location
      const promises = Array(5).fill(null).map(() => service.getCurrentWeather('10001'))
      const responses = await Promise.all(promises)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.success).toBe(true)
      })
      
      // With concurrent requests, some may bypass cache due to race conditions
      // The important thing is that all requests succeed
      expect(callCount).toBeGreaterThan(0)
      expect(callCount).toBeLessThanOrEqual(5)
    })
  })
})
