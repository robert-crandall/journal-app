## 🌤️ Feature: Daily Weather Fetch for GPT Context

### Overview

Fetch daily weather data using OpenWeatherMap, to provide GPT with environmental context during task generation (e.g., avoid outdoor tasks during storms).

---

### 📦 Requirements

* [ ] Add `ZIP_CODE` as an environment variable
* [ ] Once per day, before GPT task generation, fetch weather data from OpenWeatherMap using ZIP
  * Use the **One Call API** or **Current + Daily Forecast** depending on plan
* [ ] Store weather using `YYYY-MM-DD` as the primary key (same as journal)
  * Create a `daily_weather` table:

    ```ts
    {
      date: string (PK), // '2025-07-19'
      high_temp_c: number,
      low_temp_c: number,
      condition: string,        // "Clear", "Rain", "Thunderstorm", etc.
      chance_of_rain: number,   // 0–100
      is_rain_expected: boolean,
      wind_speed_kph: number,
      humidity_percent: number,
      raw_data: JSONB           // for flexibility in future
    }
    ```

* [ ] Fetch this on dashboard load if it's not available for today yet
* [ ] Handle API errors gracefully and allow re-fetching manually (CLI or dashboard)
