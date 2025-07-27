<script lang="ts">
  import { onMount } from 'svelte';
  import { dailyIntentsStore } from '$lib/stores/daily-intents';

  export let isOpen = false;
  export let onConfirm: (intentText: string) => void;
  export let onCancel: () => void;

  let importanceStatement = '';
  let saving = false;
  let currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Reactive references to store state
  $: ({ currentIntent, loading, error } = $dailyIntentsStore);

  // Load existing intent when modal opens
  $: {
    if (isOpen) {
      loadTodayIntent();
    }
  }

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

  async function handleConfirm() {
    if (saving) return;

    if (importanceStatement.trim()) {
      saving = true;
      try {
        await dailyIntentsStore.createOrUpdateDailyIntent(currentDate, importanceStatement.trim());
        onConfirm(importanceStatement.trim());
      } catch (err) {
        console.error('Failed to save intent:', err);
      } finally {
        saving = false;
      }
    } else {
      // If no intent text, proceed without saving
      onConfirm('');
    }
  }

  function handleCancel() {
    importanceStatement = '';
    onCancel();
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleConfirm();
    }
  }

  // Close modal when clicking outside
  function handleModalClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <!-- Modal backdrop -->
  <div class="modal modal-open" role="dialog" tabindex="-1" on:click={handleModalClick} on:keydown={(e) => e.key === 'Escape' && handleCancel()}>
    <div class="modal-box w-11/12 max-w-2xl">
      <!-- Header -->
      <div class="mb-6">
        <div class="mb-2 flex items-center gap-2">
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
          <h3 class="text-base-content text-xl font-semibold">Set Today's Focus</h3>
        </div>
        <p class="text-base-content/70 text-sm leading-relaxed">
          What's the most important thing you can accomplish today? This will help generate more personalized AI tasks.
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
        <div class="space-y-6">
          <!-- Intent Input -->
          <div class="form-control w-full">
            <textarea
              id="modal-intent-input"
              class="textarea textarea-bordered focus:textarea-primary w-full resize-none text-sm leading-relaxed transition-colors duration-200 sm:text-base"
              class:textarea-error={error}
              placeholder="The most important thing I can accomplish today is..."
              bind:value={importanceStatement}
              on:keypress={handleKeyPress}
              disabled={saving}
              maxlength="300"
              rows="4"
            ></textarea>
            <div class="label">
              <span class="label-text-alt text-base-content/60">
                {importanceStatement.length}/300 characters
              </span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" on:click={handleCancel} disabled={saving}> Skip </button>
            <button type="button" class="btn btn-primary" on:click={handleConfirm} disabled={saving}>
              {#if saving}
                <span class="loading loading-spinner loading-xs"></span>
                Saving...
              {:else}
                Continue & Generate Tasks
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
