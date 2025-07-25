import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import appExport from '../index';
import { testDb, schema } from './setup';
import { eq } from 'drizzle-orm';

// Create wrapper to maintain compatibility with test expectations
const app = {
  request: (url: string, init?: RequestInit) => {
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return appExport.fetch(new Request(absoluteUrl, init));
  },
};

describe('Weather API Integration Tests', () => {
  const testDate = '2024-01-15'; // Use a fixed historical date for tests
  let mockFetch: any;

  beforeEach(async () => {
    // Create and setup mock fetch
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
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
      }),
    });

    // Assign mock to global
    (global as any).fetch = mockFetch;

    // Clean up any existing weather data for our test date
    const db = testDb();
    await db.delete(schema.dailyWeather).where(eq(schema.dailyWeather.date, testDate));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/weather', () => {
    it('should return weather data for specific date if provided and exists in DB', async () => {
      const db = testDb();

      // Insert test data directly into database
      await db.insert(schema.dailyWeather).values({
        date: testDate,
        highTempC: 15.5,
        lowTempC: 5.2,
        condition: 'Rain',
        chanceOfRain: 80,
        isRainExpected: true,
        windSpeedKph: 25.2,
        humidityPercent: 85,
        rawData: { test: 'data' },
      });

      const res = await app.request(`/api/weather?date=${testDate}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        date: testDate,
        condition: 'Rain',
        highTempC: 15.5,
        lowTempC: 5.2,
        chanceOfRain: 80,
        isRainExpected: true,
        windSpeedKph: 25.2,
        humidityPercent: 85,
      });

      // Should not call API for existing data
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return 404 for historical dates without data', async () => {
      const historicalDate = '2023-01-01';

      const res = await app.request(`/api/weather?date=${historicalDate}`, {
        method: 'GET',
      });

      expect(res.status).toBe(404);
      const responseData = await res.json();

      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Weather data not available');

      // Should not call API for historical dates
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate date format', async () => {
      const invalidDate = '2024-13-45';

      const res = await app.request(`/api/weather?date=${invalidDate}`, {
        method: 'GET',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/weather/outdoor-advice', () => {
    it('should recommend avoiding outdoor tasks for rain', async () => {
      const db = testDb();

      // Insert rainy weather data
      await db.insert(schema.dailyWeather).values({
        date: testDate,
        highTempC: 18.0,
        lowTempC: 12.0,
        condition: 'Rain',
        chanceOfRain: 90,
        isRainExpected: true,
        windSpeedKph: 20.0,
        humidityPercent: 95,
      });

      const res = await app.request(`/api/weather/outdoor-advice?date=${testDate}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.avoid).toBe(true);
      expect(responseData.data.reason).toContain('Rain');
      expect(responseData.data.weather).toBeDefined();
    });

    it('should recommend avoiding outdoor tasks for high chance of rain', async () => {
      const db = testDb();
      const testDate2 = '2024-02-15';

      // Clean up this date too
      await db.delete(schema.dailyWeather).where(eq(schema.dailyWeather.date, testDate2));

      // Insert weather with high rain chance
      await db.insert(schema.dailyWeather).values({
        date: testDate2,
        highTempC: 20.0,
        lowTempC: 15.0,
        condition: 'Cloudy',
        chanceOfRain: 80,
        isRainExpected: true,
        windSpeedKph: 15.0,
        humidityPercent: 85,
      });

      const res = await app.request(`/api/weather/outdoor-advice?date=${testDate2}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.avoid).toBe(true);
      expect(responseData.data.reason).toContain('rain');
    });

    it('should recommend avoiding outdoor tasks for extreme temperatures', async () => {
      const db = testDb();
      const testDate3 = '2024-03-15';

      // Clean up this date too
      await db.delete(schema.dailyWeather).where(eq(schema.dailyWeather.date, testDate3));

      // Insert extremely hot weather data
      await db.insert(schema.dailyWeather).values({
        date: testDate3,
        highTempC: 40.0,
        lowTempC: 30.0,
        condition: 'Clear',
        chanceOfRain: 0,
        isRainExpected: false,
        windSpeedKph: 5.0,
        humidityPercent: 30,
      });

      const res = await app.request(`/api/weather/outdoor-advice?date=${testDate3}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.avoid).toBe(true);
      expect(responseData.data.reason).toContain('Extreme temperature');
    });

    it('should allow outdoor tasks for good weather', async () => {
      const db = testDb();
      const testDate4 = '2024-04-15';

      // Clean up this date too
      await db.delete(schema.dailyWeather).where(eq(schema.dailyWeather.date, testDate4));

      // Insert good weather data
      await db.insert(schema.dailyWeather).values({
        date: testDate4,
        highTempC: 22.0,
        lowTempC: 16.0,
        condition: 'Clear',
        chanceOfRain: 10,
        isRainExpected: false,
        windSpeedKph: 8.0,
        humidityPercent: 55,
      });

      const res = await app.request(`/api/weather/outdoor-advice?date=${testDate4}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.avoid).toBe(false);
      expect(responseData.data.weather).toBeDefined();
    });

    it('should handle missing weather data gracefully', async () => {
      const futureDate = '2025-12-31';

      const res = await app.request(`/api/weather/outdoor-advice?date=${futureDate}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.avoid).toBe(false);
      expect(responseData.data.weather).toBeUndefined();
    });
  });

  describe('Weather Database Integration', () => {
    it('should store and retrieve weather data correctly', async () => {
      const db = testDb();
      const testDate5 = '2024-05-15';

      // Clean up this date
      await db.delete(schema.dailyWeather).where(eq(schema.dailyWeather.date, testDate5));

      // Insert test weather data
      const testWeatherData = {
        date: testDate5,
        highTempC: 25.5,
        lowTempC: 15.2,
        condition: 'Partly Cloudy',
        chanceOfRain: 30,
        isRainExpected: false,
        windSpeedKph: 12.5,
        humidityPercent: 60,
        rawData: { testField: 'testValue' },
      };

      await db.insert(schema.dailyWeather).values(testWeatherData);

      // Retrieve the data
      const res = await app.request(`/api/weather?date=${testDate5}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const responseData = await res.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toMatchObject({
        date: testDate5,
        highTempC: 25.5,
        lowTempC: 15.2,
        condition: 'Partly Cloudy',
        chanceOfRain: 30,
        isRainExpected: false,
        windSpeedKph: 12.5,
        humidityPercent: 60,
      });

      // Verify data was stored correctly in database
      const storedWeather = await db.select().from(schema.dailyWeather).where(eq(schema.dailyWeather.date, testDate5)).limit(1);

      expect(storedWeather).toHaveLength(1);
      expect(storedWeather[0]).toMatchObject(testWeatherData);
    });
  });
});
