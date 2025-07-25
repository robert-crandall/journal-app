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
</script>

<div class="bg-base-100 border-base-200 rounded-lg border p-4 shadow-sm">
  <h3 class="text-base-content mb-2 text-lg font-semibold">Today's Weather</h3>

  {#if loading}
    <div class="flex items-center space-x-2">
      <span class="loading loading-spinner loading-sm"></span>
      <span class="text-base-content/70">Loading weather...</span>
    </div>
  {:else if error}
    <div class="text-error text-sm">
      <p>{error}</p>
      <button class="btn btn-ghost btn-xs mt-1" onclick={fetchWeather}> Try Again </button>
    </div>
  {:else if weather}
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="text-primary text-2xl font-bold">
          {weather.highTempF}°F
        </div>
        <div class="text-right">
          <div class="text-base-content font-medium">
            {weather.shortForecast}
          </div>
          {#if weather.probabilityOfPrecipitation && weather.probabilityOfPrecipitation > 0}
            <div class="text-info text-sm">
              💧 Rain: {weather.probabilityOfPrecipitation}%
            </div>
          {/if}
        </div>
      </div>

      <div class="text-base-content/70 text-sm">
        {weather.detailedForecast}
      </div>
    </div>
  {:else}
    <div class="text-base-content/70">No weather data available</div>
  {/if}
</div>
