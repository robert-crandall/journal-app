<script lang="ts">
  import { onMount } from 'svelte';
  import { currentDayFocus, loadCurrentDayFocus } from '$lib/stores/focus';
  import WeeklyFocusView from '$lib/components/focus/WeeklyFocusView.svelte';
  import FocusCard from '$lib/components/focus/FocusCard.svelte';
  import { requireAuth } from '$lib/utils/auth';

  // Check authentication
  requireAuth();

  // Load today's focus on mount
  onMount(async () => {
    await loadCurrentDayFocus();
  });
</script>

<svelte:head>
  <title>Daily Focus | Life RPG</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div>
        <h1 class="text-primary mb-2 text-4xl font-bold">Daily Focus</h1>
        <p class="text-base-content/70 text-lg">Define your thematic structure for each day of the week</p>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-10">
      <h2 class="text-base-content mb-4 text-xl font-semibold">Today's Focus</h2>

      {#if $currentDayFocus}
        <FocusCard focus={$currentDayFocus} isActive={true} showActions={false} />
      {:else}
        <div class="card bg-base-100 border-base-300 border border-dashed p-6 text-center">
          <p class="text-base-content/70">No focus set for today. Create one in the weekly schedule below.</p>
        </div>
      {/if}
    </div>

    <div class="card bg-base-100 border-base-300 mb-8 border p-6 shadow-xl">
      <WeeklyFocusView />
    </div>

    <div class="card bg-base-100 border-base-300 mt-8 border p-6 shadow-xl">
      <h2 class="card-title text-base-content mb-2">About Daily Focus</h2>
      <p class="text-base-content/80 mb-4">
        The Daily Focus system helps you define a thematic structure for each day of the week. Your daily focus influences task generation and helps maintain a
        consistent rhythm to your week.
      </p>

      <h3 class="text-base-content mb-2 font-medium">Examples:</h3>
      <ul class="text-base-content/80 list-disc space-y-1 pl-5">
        <li><strong>Monday:</strong> "Reset & Prepare" - Start the week by organizing and preparing for the days ahead</li>
        <li><strong>Wednesday:</strong> "Midweek Momentum" - Keep energy high by focusing on progress and achievements</li>
        <li><strong>Saturday:</strong> "Call to Adventure" - Do something bold or memorable on the weekend</li>
      </ul>
    </div>
  </div>
</div>
