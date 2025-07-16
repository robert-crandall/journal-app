<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDayFocus, loadCurrentDayFocus } from '$lib/stores/focus';
  import { getDayName } from '$lib/api/focus';
  import { getToday } from '$lib/utils/date';

  let isLoading = true;

  // Get the current day of week from a timezone-aware date (uses browser's timezone)
  const dayOfWeek = getToday().getDay();
  const dayName = getDayName(dayOfWeek);

  onMount(async () => {
    try {
      await loadCurrentDayFocus();
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="card bg-base-100 border-base-300 border-l-primary border-l-4 p-5 shadow-xl transition-all duration-200 hover:shadow-2xl">
  <h3 class="card-title text-base-content flex items-center gap-2">
    Today's Focus
    <span class="badge badge-primary badge-sm">
      {dayName}
    </span>
  </h3>

  {#if isLoading}
    <div class="flex items-center py-4">
      <span class="loading loading-spinner loading-sm text-primary mr-2"></span>
      <p class="text-base-content/60">Loading today's focus...</p>
    </div>
  {:else if $currentDayFocus}
    <h4 class="text-md text-base-content mt-2 font-medium">{$currentDayFocus.title}</h4>
    <p class="text-base-content/80 mt-1">{$currentDayFocus.description}</p>
  {:else}
    <p class="text-base-content/60 mt-2">
      No focus set for today. <a href="/focus" class="link link-primary">Set one now</a>
    </p>
  {/if}
</div>
