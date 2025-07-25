import { apiFetch, authenticatedClient } from '$lib/api';
import type { WeatherResponse, GetWeatherRequest } from '../../../../shared/types/weather';

// API response types
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Get weather for today
 */
export async function getTodaysWeather(): Promise<WeatherResponse> {
  const response = await authenticatedClient.api.weather.today.$get();
  const data = (await response.json()) as ApiResponse<WeatherResponse>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : "Failed to fetch today's weather");
  }

  return data.data;
}

/**
 * Get weather for a specific date
 */
export async function getWeatherForDate(date?: string): Promise<WeatherResponse> {
  const query = date ? { date } : {};
  const response = await authenticatedClient.api.weather.$get({
    query: query as any,
  });
  const data = (await response.json()) as ApiResponse<WeatherResponse>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : 'Failed to fetch weather data');
  }

  return data.data;
}

/**
 * Refresh weather data for a specific date (force fetch from API)
 */
export async function refreshWeatherData(date?: string): Promise<WeatherResponse> {
  const requestData = date ? { date } : {};
  const response = await authenticatedClient.api.weather.refresh.$post({
    json: requestData,
  });
  const data = (await response.json()) as ApiResponse<WeatherResponse>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : 'Failed to refresh weather data');
  }

  return data.data;
}

/**
 * Get outdoor task advice based on weather conditions
 */
export async function getOutdoorAdvice(date?: string): Promise<{
  avoid: boolean;
  reason?: string;
  weather?: WeatherResponse;
}> {
  const query = date ? { date } : {};
  const response = await authenticatedClient.api.weather['outdoor-advice'].$get({
    query: query as any,
  });
  const data = (await response.json()) as ApiResponse<{
    avoid: boolean;
    reason?: string;
    weather?: WeatherResponse;
  }>;

  if (!data.success) {
    throw new Error('error' in data ? data.error : 'Failed to get outdoor advice');
  }

  return data.data;
}

// Export types for convenience
export type { WeatherResponse, GetWeatherRequest };
