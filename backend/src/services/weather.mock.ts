import type { WeatherGovForecastResponse } from '../../../shared/types/weather';

// Sample Weather.gov forecast response for testing
export const sampleWeatherGovResponse: WeatherGovForecastResponse = {
  properties: {
    periods: [
      {
        number: 1,
        name: 'Today',
        startTime: '2025-07-25T06:00:00-07:00',
        endTime: '2025-07-25T18:00:00-07:00',
        isDaytime: true,
        temperature: 75,
        temperatureUnit: 'F',
        windSpeed: '5 to 10 mph',
        windDirection: 'W',
        icon: 'https://api.weather.gov/icons/land/day/few?size=medium',
        shortForecast: 'Mostly Sunny',
        detailedForecast: 'Mostly sunny, with a high near 75. West wind 5 to 10 mph.',
        probabilityOfPrecipitation: {
          unitCode: 'wmoUnit:percent',
          value: 10,
        },
        relativeHumidity: {
          unitCode: 'wmoUnit:percent',
          value: 65,
        },
      },
      {
        number: 2,
        name: 'Tonight',
        startTime: '2025-07-25T18:00:00-07:00',
        endTime: '2025-07-26T06:00:00-07:00',
        isDaytime: false,
        temperature: 58,
        temperatureUnit: 'F',
        windSpeed: '5 mph',
        windDirection: 'W',
        icon: 'https://api.weather.gov/icons/land/night/few?size=medium',
        shortForecast: 'Mostly Clear',
        detailedForecast: 'Mostly clear, with a low around 58. West wind around 5 mph.',
        probabilityOfPrecipitation: {
          unitCode: 'wmoUnit:percent',
          value: 5,
        },
        relativeHumidity: {
          unitCode: 'wmoUnit:percent',
          value: 75,
        },
      },
    ],
  },
};
