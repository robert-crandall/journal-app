<script lang="ts">
  import { onMount } from 'svelte';
  import { getTodaysWeather } from '$lib/api/weather';
  import type { WeatherResponse } from '$lib/api/weather';

  let weather: WeatherResponse | null = $state(null);
  let loading = $state(true);
  let error = $state('');

  async function fetchWeather() {
    try {
      loading = true;
      error = '';
      
      weather = await getTodaysWeather();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to connect to weather service';
      console.error('Weather fetch error:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchWeather();
  });

  function celsiusToFahrenheit(celsius: number): number {
    return Math.round((celsius * 9/5) + 32);
  }
</script>

<div class="bg-base-100 rounded-lg p-4 shadow-sm border border-base-200">
  <h3 class="text-lg font-semibold text-base-content mb-2">Today's Weather</h3>
  
  {#if loading}
    <div class="flex items-center space-x-2">
      <span class="loading loading-spinner loading-sm"></span>
      <span class="text-base-content/70">Loading weather...</span>
    </div>
  {:else if error}
    <div class="text-error text-sm">
      <p>{error}</p>
      <button 
        class="btn btn-ghost btn-xs mt-1" 
        onclick={fetchWeather}
      >
        Try Again
      </button>
    </div>
  {:else if weather}
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="text-2xl font-bold text-primary">
          {celsiusToFahrenheit(weather.highTempC)}°F
        </div>
        <div class="text-right">
          <div class="capitalize text-base-content font-medium">
            {weather.condition}
          </div>
          <div class="text-sm text-base-content/70">
            Low: {celsiusToFahrenheit(weather.lowTempC)}°F
          </div>
        </div>
      </div>
      
      <div class="flex items-center justify-between text-sm text-base-content/70">
        <span>Humidity: {weather.humidityPercent}%</span>
        <span>Wind: {Math.round(weather.windSpeedKph * 0.621)} mph</span>
      </div>
      
      {#if weather.chanceOfRain > 0}
        <div class="text-sm text-info">
          💧 Rain chance: {weather.chanceOfRain}%
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-base-content/70">No weather data available</div>
  {/if}
</div>
