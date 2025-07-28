<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDayFocus, loadCurrentDayFocus } from '$lib/stores/focus';
  import { getDayName } from '$lib/api/focus';

  let isLoading = true;

  const dayOfWeek = new Date().getDay();
  const dayName = getDayName(dayOfWeek);

  onMount(async () => {
    try {
      await loadCurrentDayFocus();
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="card">
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
