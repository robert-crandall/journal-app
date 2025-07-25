import type { OpenWeatherMapResponse } from '../../../shared/types/weather';

export const sampleOpenWeatherMapResponse: OpenWeatherMapResponse = {
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
};
