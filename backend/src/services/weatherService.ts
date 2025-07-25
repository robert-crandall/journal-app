import { db } from '../db';
import { dailyWeather } from '../db/schema/weather';
import { eq } from 'drizzle-orm';
import { env } from '../env';
import { format } from 'date-fns';
import type { DailyWeather, NewDailyWeather, WeatherResponse, WeatherGovForecastResponse } from '../../../shared/types/weather';
import { sampleWeatherGovResponse } from './weather.mock';

/**
 * WeatherService - Now uses Weather.gov API (free, no API key required)
 *
 * Setup:
 * 1. Set WEATHER_LAT and WEATHER_LON environment variables with your location coordinates
 * 2. Weather.gov API only covers US locations
 *
 * Example .env:
 * WEATHER_LAT=37.7749
 * WEATHER_LON=-122.4194
 */

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

  // Fetch weather data from Weather.gov API and store it
  static async fetchAndStoreWeatherData(date?: string): Promise<DailyWeather | null> {
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    let forecastData: WeatherGovForecastResponse;

    if (process.env.NODE_ENV === 'test') {
      // Use a realistic mock Weather.gov response in test
      forecastData = sampleWeatherGovResponse;
    } else {
      if (!env.WEATHER_LAT || !env.WEATHER_LON) {
        console.warn('Weather latitude/longitude not configured. Please set WEATHER_LAT and WEATHER_LON environment variables.');
        return null;
      }

      try {
        // Weather.gov API requires two calls:
        // 1. Get grid coordinates from lat/lon
        const pointUrl = `https://api.weather.gov/points/${env.WEATHER_LAT},${env.WEATHER_LON}`;
        const pointResponse = await fetch(pointUrl, {
          headers: {
            'User-Agent': 'journal-app/1.0 (contact@example.com)', // Weather.gov requires User-Agent
          },
        });

        if (!pointResponse.ok) {
          throw new Error(`Weather.gov point API error: ${pointResponse.status} ${pointResponse.statusText}`);
        }

        const pointData = (await pointResponse.json()) as any;
        const forecastUrl = pointData.properties.forecast;

        // 2. Get forecast from grid coordinates
        const forecastResponse = await fetch(forecastUrl, {
          headers: {
            'User-Agent': 'journal-app/1.0 (contact@example.com)',
          },
        });

        if (!forecastResponse.ok) {
          throw new Error(`Weather.gov forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
        }

        forecastData = (await forecastResponse.json()) as WeatherGovForecastResponse;
      } catch (error) {
        console.error('Failed to fetch weather data from Weather.gov:', error);
        return null;
      }
    }

    // Transform Weather.gov API data to our schema
    const periods = forecastData.properties.periods;
    const todayPeriod = periods.find((p) => p.isDaytime) || periods[0];

    const weatherData: NewDailyWeather = {
      date: targetDate,
      highTempF: todayPeriod.temperature, // Already in Fahrenheit from Weather.gov
      probabilityOfPrecipitation: todayPeriod.probabilityOfPrecipitation?.value || null,
      shortForecast: todayPeriod.shortForecast,
      detailedForecast: todayPeriod.detailedForecast,
      rawData: forecastData,
    };

    // Store in database
    const [storedWeather] = await db.insert(dailyWeather).values(weatherData).returning();
    return storedWeather;
  }

  // Manually refresh weather data for a date
  static async refreshWeatherData(date: string): Promise<WeatherResponse | null> {
    // In test environment, allow refreshing with mock data
    if (process.env.NODE_ENV === 'test') {
      // Delete existing data if it exists
      await db.delete(dailyWeather).where(eq(dailyWeather.date, date));

      // Fetch mock data
      const weatherData = await this.fetchAndStoreWeatherData(date);
      return weatherData ? this.formatWeatherResponse(weatherData) : null;
    }

    if (!env.WEATHER_LAT || !env.WEATHER_LON) {
      throw new Error('Weather latitude/longitude not configured. Please set WEATHER_LAT and WEATHER_LON environment variables.');
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

    // Define conditions that should avoid outdoor tasks based on shortForecast
    const badConditions = ['rain', 'thunderstorm', 'snow', 'storm', 'showers'];
    const isBadWeather = badConditions.some((condition) => weather.shortForecast.toLowerCase().includes(condition));

    if (isBadWeather) {
      return {
        avoid: true,
        reason: `${weather.shortForecast} expected`,
        weather,
      };
    }

    if (weather.probabilityOfPrecipitation && weather.probabilityOfPrecipitation > 70) {
      return {
        avoid: true,
        reason: `High chance of rain (${weather.probabilityOfPrecipitation}%)`,
        weather,
      };
    }

    // Extreme temperatures (converted from Fahrenheit)
    if (weather.highTempF > 95 || weather.highTempF < 14) {
      // 95°F = 35°C, 14°F = -10°C
      return {
        avoid: true,
        reason: `Extreme temperature (${weather.highTempF}°F)`,
        weather,
      };
    }

    return { avoid: false, weather };
  }

  // Helper method to format weather response
  private static formatWeatherResponse(weather: DailyWeather): WeatherResponse {
    return {
      date: weather.date,
      highTempF: weather.highTempF,
      probabilityOfPrecipitation: weather.probabilityOfPrecipitation,
      shortForecast: weather.shortForecast,
      detailedForecast: weather.detailedForecast,
    };
  }
}
