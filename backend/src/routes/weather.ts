import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { WeatherService } from '../services/weatherService';
import { getWeatherSchema } from '../validation/weather';
import { handleApiError } from '../utils/logger';

const app = new Hono()
  // Get weather for a specific date (defaults to today)
  .get('/', zValidator('query', getWeatherSchema), async (c) => {
    try {
      const { date } = c.req.valid('query');
      
      const weather = await WeatherService.getWeather(date);
      
      if (!weather) {
        return c.json(
          {
            success: false,
            error: 'Weather data not available for the requested date',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: weather,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch weather data');
    }
  })

  // Get today's weather (convenience endpoint)
  .get('/today', async (c) => {
    try {
      const weather = await WeatherService.getWeather();
      
      if (!weather) {
        return c.json(
          {
            success: false,
            error: 'Weather data not available for today',
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: weather,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch today\'s weather');
    }
  })

  // Refresh weather data for a specific date (force fetch from API)
  .post('/refresh', zValidator('json', getWeatherSchema), async (c) => {
    try {
      const { date } = c.req.valid('json');
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const weather = await WeatherService.refreshWeatherData(targetDate);
      
      if (!weather) {
        return c.json(
          {
            success: false,
            error: 'Failed to refresh weather data',
          },
          500,
        );
      }

      return c.json({
        success: true,
        data: weather,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to refresh weather data');
    }
  })

  // Check if outdoor tasks should be avoided today
  .get('/outdoor-advice', zValidator('query', getWeatherSchema), async (c) => {
    try {
      const { date } = c.req.valid('query');
      
      const advice = await WeatherService.shouldAvoidOutdoorTasks(date);
      
      return c.json({
        success: true,
        data: advice,
      });
    } catch (error) {
      return handleApiError(error, 'Failed to get outdoor task advice');
    }
  });

export default app;
