<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDayFocus, loadCurrentDayFocus } from '$lib/stores/focus';
  import { getDayName } from '$lib/api/focus';
  
  let isLoading = true;
  
  onMount(async () => {
    try {
      await loadCurrentDayFocus();
    } finally {
      isLoading = false;
    }
  });
  
  $: today = new Date();
  $: dayName = getDayName(today.getDay());
</script>

<div class="card bg-base-100 border-base-300 border-l-4 border-l-primary p-5 shadow-xl hover:shadow-2xl transition-all duration-200">
  <h3 class="card-title text-base-content flex items-center gap-2">
    Today's Focus
    <span class="badge badge-primary badge-sm">
      {dayName}
    </span>
  </h3>
  
  {#if isLoading}
    <div class="py-4 flex items-center">
      <span class="loading loading-spinner loading-sm text-primary mr-2"></span>
      <p class="text-base-content/60">Loading today's focus...</p>
    </div>
  {:else if $currentDayFocus}
    <h4 class="mt-2 text-md font-medium text-base-content">{$currentDayFocus.title}</h4>
    <p class="mt-1 text-base-content/80">{$currentDayFocus.description}</p>
  {:else}
    <p class="mt-2 text-base-content/60">
      No focus set for today. <a href="/focus" class="link link-primary">Set one now</a>
    </p>
  {/if}
</div>
