// Weather types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

export interface DailyWeather {
  date: string; // YYYY-MM-DD format
  highTempC: number;
  lowTempC: number;
  condition: string; // "Clear", "Rain", "Thunderstorm", etc.
  chanceOfRain: number; // 0-100
  isRainExpected: boolean;
  windSpeedKph: number;
  humidityPercent: number; // 0-100
  rawData?: any; // Full API response for flexibility
}

export interface NewDailyWeather {
  date: string;
  highTempC: number;
  lowTempC: number;
  condition: string;
  chanceOfRain: number;
  isRainExpected: boolean;
  windSpeedKph: number;
  humidityPercent: number;
  rawData?: any;
}

// Request/Response types for API
export type WeatherResponse = {
  date: string;
  highTempC: number;
  lowTempC: number;
  condition: string;
  chanceOfRain: number;
  isRainExpected: boolean;
  windSpeedKph: number;
  humidityPercent: number;
};

export type GetWeatherRequest = {
  date?: string; // Optional date, defaults to today
};

// OpenWeatherMap API response structure (for reference)
export interface OpenWeatherMapResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

// OpenWeatherMap One Call API daily forecast
export interface OpenWeatherMapDailyForecast {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: number;
  pop: number; // Probability of precipitation
  rain?: number;
  snow?: number;
  uvi: number;
}
