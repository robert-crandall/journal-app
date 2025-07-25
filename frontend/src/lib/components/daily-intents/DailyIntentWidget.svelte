<script lang="ts">
  import { onMount } from 'svelte';
  import { dailyIntentsStore } from '$lib/stores/daily-intents';

  let importanceStatement = '';
  let saving = false;
  let currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Reactive references to store state
  $: ({ currentIntent, loading, error } = $dailyIntentsStore);

  onMount(() => {
    loadTodayIntent();
  });

  async function loadTodayIntent() {
    try {
      const intent = await dailyIntentsStore.getDailyIntent(currentDate);
      if (intent) {
        importanceStatement = intent.importanceStatement;
      }
    } catch (err) {
      console.error("Failed to load today's intent:", err);
    }
  }

  async function saveIntent() {
    if (!importanceStatement.trim() || saving) return;

    saving = true;
    try {
      await dailyIntentsStore.createOrUpdateDailyIntent(currentDate, importanceStatement.trim());
    } catch (err) {
      console.error('Failed to save intent:', err);
    } finally {
      saving = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveIntent();
    }
  }
</script>

<div class="bg-base-100 rounded-lg border border-base-300 p-4 sm:p-6">
  <!-- Header with icon and title -->
  <div class="mb-4">
    <div class="flex items-center gap-2 mb-2">
      <div class="text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-base-content">Today's Focus</h3>
    </div>
    <p class="text-sm text-base-content/70 leading-relaxed">
      What's the most important thing you can accomplish today? This helps generate personalized tasks.
    </p>
  </div>

  {#if loading && !currentIntent}
    <div class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>
  {:else if error}
    <div class="alert alert-error mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6" />
        <path d="M12 16h.01" />
      </svg>
      <span class="text-sm">{error}</span>
    </div>
  {:else}
    <form on:submit|preventDefault={saveIntent} class="space-y-4">
      <div class="form-control w-full">
        <textarea
          id="intent-input"
          class="textarea textarea-bordered focus:textarea-primary resize-none transition-colors duration-200 text-sm leading-relaxed w-full sm:text-base"
          class:textarea-error={error}
          placeholder="The most important thing I can accomplish today is..."
          bind:value={importanceStatement}
          on:keypress={handleKeyPress}
          disabled={saving}
          maxlength="300"
          rows="3"
        ></textarea>      
      </div>

      <!-- Action buttons -->
      <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button 
          type="submit" 
          class="btn btn-primary btn-sm sm:btn-md"
          disabled={saving || !importanceStatement.trim()}
        >
          {#if saving}
            <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
            Saving...
          {:else if currentIntent}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Update Focus
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
            Set Focus
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
