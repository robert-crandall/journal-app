export interface DailyWeather {
  date: string; // YYYY-MM-DD format
  highTempF: number; // High temperature in Fahrenheit
  probabilityOfPrecipitation: number | null; // 0-100, can be null
  shortForecast: string; // "Mostly Sunny"
  detailedForecast: string; // Full detailed forecast text
  rawData?: any; // Full Weather.gov API response for flexibility
}

export interface NewDailyWeather {
  date: string;
  highTempF: number;
  probabilityOfPrecipitation: number | null;
  shortForecast: string;
  detailedForecast: string;
  rawData?: any;
}

// Request/Response types for API
export type WeatherResponse = {
  date: string;
  highTempF: number;
  probabilityOfPrecipitation: number | null;
  shortForecast: string;
  detailedForecast: string;
};

export type GetWeatherRequest = {
  date?: string; // Optional date, defaults to today
};

// Weather.gov API response structures
export interface WeatherGovPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    forecast: string;
    forecastHourly: string;
    forecastGridData: string;
    observationStations: string;
    relativeLocation: {
      properties: {
        city: string;
        state: string;
      };
    };
  };
}

export interface WeatherGovForecastResponse {
  properties: {
    periods: Array<{
      number: number;
      name: string;
      startTime: string;
      endTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      temperatureTrend?: string;
      windSpeed: string;
      windDirection: string;
      icon: string;
      shortForecast: string;
      detailedForecast: string;
      probabilityOfPrecipitation?: {
        unitCode: string;
        value: number | null;
      };
      dewpoint?: {
        unitCode: string;
        value: number;
      };
      relativeHumidity?: {
        unitCode: string;
        value: number;
      };
    }>;
  };
}
