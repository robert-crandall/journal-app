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

<div class="w-full">
  <div class="mb-4 flex items-center gap-3">
    <div class="text-primary">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
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
    <h3 class="text-xl font-semibold">Today's Most Important Thing</h3>
  </div>

  {#if loading && !currentIntent}
    <div class="flex justify-center py-4">
      <span class="loading loading-spinner loading-md"></span>
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
    <div class="space-y-4">
      <p class="text-base-content/70 text-sm">What is the most important thing you can do today? This will help guide your daily task generation.</p>

      <div class="form-control">
        <textarea
          class="textarea textarea-bordered focus:textarea-primary min-h-20 transition-all duration-200"
          placeholder="The most important thing I can do today is..."
          bind:value={importanceStatement}
          on:keypress={handleKeyPress}
          disabled={saving}
          maxlength="500"
        ></textarea>
        <div class="label">
          <span class="label-text-alt text-base-content/50">
            {importanceStatement.length}/500 characters
          </span>
          <span class="label-text-alt">
            {#if currentIntent}
              <span class="text-success">
                Last updated: {new Date(currentIntent.updatedAt).toLocaleDateString()}
              </span>
            {/if}
          </span>
        </div>
      </div>

      <div class="flex justify-end">
        <button class="btn btn-primary transition-all duration-200 hover:scale-105" on:click={saveIntent} disabled={saving || !importanceStatement.trim()}>
          {#if saving}
            <span class="loading loading-spinner loading-sm"></span>
            Saving...
          {:else if currentIntent}
            Update Intent
          {:else}
            Save Intent
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
