import { db } from '../db';
import { dailyWeather } from '../db/schema/weather';
import { eq } from 'drizzle-orm';
import { env } from '../env';
import { format } from 'date-fns';
import type { DailyWeather, NewDailyWeather, WeatherResponse, OpenWeatherMapResponse } from '../../../shared/types/weather';
import { sampleOpenWeatherMapResponse } from './weather.mock';

export class WeatherService {
  // Get weather for a specific date (defaults to today)
  static async getWeather(date?: string): Promise<WeatherResponse | null> {
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    // First, check if we already have weather data for this date
    const [existingWeather] = await db.select().from(dailyWeather).where(eq(dailyWeather.date, targetDate));

    if (existingWeather) {
      return this.formatWeatherResponse(existingWeather);
    }

    // If no data exists and it's today's date, fetch from API
    const today = format(new Date(), 'yyyy-MM-dd');
    if (targetDate === today) {
      const weatherData = await this.fetchAndStoreWeatherData(targetDate);
      return weatherData ? this.formatWeatherResponse(weatherData) : null;
    }

    // For historical dates, return null (we don't have data)
    return null;
  }

  // Fetch weather data from OpenWeatherMap API and store it
  static async fetchAndStoreWeatherData(date: string): Promise<DailyWeather | null> {
    let apiData: OpenWeatherMapResponse;
    if (process.env.NODE_ENV === 'test') {
      // Use a realistic mock OpenWeatherMap response in test
      apiData = sampleOpenWeatherMapResponse;
    } else {
      if (!env.OPENWEATHER_API_KEY || !env.ZIP_CODE) {
        console.warn('Weather API key or ZIP code not configured');
        return null;
      }
      try {
        // Use Current Weather API - free tier
        const url = `https://api.openweathermap.org/data/2.5/weather?zip=${env.ZIP_CODE}&appid=${env.OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
        }
        apiData = (await response.json()) as OpenWeatherMapResponse;
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return null;
      }
    }

    // Transform API data to our schema (shared logic)
    const weatherData: NewDailyWeather = {
      date,
      highTempC: apiData.main.temp_max,
      lowTempC: apiData.main.temp_min,
      condition: apiData.weather[0]?.main || 'Unknown',
      chanceOfRain: Math.round((apiData.clouds.all / 100) * 100),
      isRainExpected: apiData.weather[0]?.main.toLowerCase().includes('rain') || apiData.weather[0]?.main.toLowerCase().includes('thunderstorm') || false,
      windSpeedKph: Math.round(apiData.wind.speed * 3.6),
      humidityPercent: apiData.main.humidity,
      rawData: apiData,
    };

    // Store in database
    const [storedWeather] = await db.insert(dailyWeather).values(weatherData).returning();
    return storedWeather;
  }

  // Create mock weather data for testing
  private static async createMockWeatherData(date: string): Promise<DailyWeather | null> {
    try {
      const mockWeatherData: NewDailyWeather = {
        date,
        highTempC: 22.1,
        lowTempC: 18.2,
        condition: 'Clear',
        chanceOfRain: 10,
        isRainExpected: false,
        windSpeedKph: 13, // 3.6 m/s converted to km/h
        humidityPercent: 65,
        rawData: {
          coord: { lon: -122.08, lat: 37.39 },
          weather: [
            {
              id: 800,
              main: 'Clear',
              description: 'clear sky',
              icon: '01d',
            },
          ],
          base: 'stations',
          main: {
            temp: 20.5,
            feels_like: 19.8,
            temp_min: 18.2,
            temp_max: 22.1,
            pressure: 1013,
            humidity: 65,
          },
          visibility: 10000,
          wind: {
            speed: 3.6,
            deg: 220,
          },
          clouds: {
            all: 10,
          },
          dt: 1609459200,
          sys: {
            type: 1,
            id: 5122,
            country: 'US',
            sunrise: 1609422000,
            sunset: 1609458000,
          },
          timezone: -28800,
          id: 420006353,
          name: 'Mountain View',
          cod: 200,
        },
      };

      // Store in database
      const [storedWeather] = await db.insert(dailyWeather).values(mockWeatherData).returning();

      return storedWeather;
    } catch (error) {
      console.error('Failed to create mock weather data:', error);
      return null;
    }
  } // Manually refresh weather data for a date
  static async refreshWeatherData(date: string): Promise<WeatherResponse | null> {
    // In test environment, allow refreshing with mock data
    if (process.env.NODE_ENV === 'test') {
      // Delete existing data if it exists
      await db.delete(dailyWeather).where(eq(dailyWeather.date, date));

      // Fetch mock data
      const weatherData = await this.createMockWeatherData(date);
      return weatherData ? this.formatWeatherResponse(weatherData) : null;
    }

    if (!env.OPENWEATHER_API_KEY || !env.ZIP_CODE) {
      throw new Error('Weather API key or ZIP code not configured');
    }

    try {
      // Delete existing data if it exists
      await db.delete(dailyWeather).where(eq(dailyWeather.date, date));

      // Fetch fresh data
      const weatherData = await this.fetchAndStoreWeatherData(date);
      return weatherData ? this.formatWeatherResponse(weatherData) : null;
    } catch (error) {
      console.error('Failed to refresh weather data:', error);
      throw error;
    }
  }

  // Get weather data for multiple dates
  static async getWeatherRange(startDate: string, endDate: string): Promise<WeatherResponse[]> {
    const weatherData = await db.select().from(dailyWeather).where(
      eq(dailyWeather.date, startDate), // Note: This is simplified - in production you'd use BETWEEN
    );

    return weatherData.map(this.formatWeatherResponse);
  }

  // Check if weather should influence task generation (helper for GPT context)
  static async shouldAvoidOutdoorTasks(date?: string): Promise<{
    avoid: boolean;
    reason?: string;
    weather?: WeatherResponse;
  }> {
    const weather = await this.getWeather(date);

    if (!weather) {
      return { avoid: false };
    }

    // Define conditions that should avoid outdoor tasks
    const badConditions = ['rain', 'thunderstorm', 'snow', 'storm'];
    const isBadWeather = badConditions.some((condition) => weather.condition.toLowerCase().includes(condition));

    if (isBadWeather) {
      return {
        avoid: true,
        reason: `${weather.condition} expected`,
        weather,
      };
    }

    if (weather.isRainExpected || weather.chanceOfRain > 70) {
      return {
        avoid: true,
        reason: `High chance of rain (${weather.chanceOfRain}%)`,
        weather,
      };
    }

    // Extreme temperatures (adjust based on your preference)
    if (weather.highTempC > 35 || weather.lowTempC < -10) {
      return {
        avoid: true,
        reason: `Extreme temperature (${weather.lowTempC}°C - ${weather.highTempC}°C)`,
        weather,
      };
    }

    return { avoid: false, weather };
  }

  // Helper method to format weather response
  private static formatWeatherResponse(weather: DailyWeather): WeatherResponse {
    return {
      date: weather.date,
      highTempC: weather.highTempC,
      lowTempC: weather.lowTempC,
      condition: weather.condition,
      chanceOfRain: weather.chanceOfRain,
      isRainExpected: weather.isRainExpected,
      windSpeedKph: weather.windSpeedKph,
      humidityPercent: weather.humidityPercent,
    };
  }
}
