<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import type { JournalResponse } from '$lib/types/journal';
  import { PenIcon, MessageCircleIcon, SaveIcon } from 'lucide-svelte';

  export let journal: JournalResponse | null;
  export let date: string;

  const dispatch = createEventDispatcher<{
    update: JournalResponse;
  }>();

  let initialMessage = journal?.initialMessage || '';
  let saving = false;
  let startingReflection = false;
  let error: string | null = null;

  // Auto-save timeout
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let hasUnsavedChanges = false;

  // Character counter
  $: characterCount = initialMessage.length;
  $: wordCount = initialMessage.trim() ? initialMessage.trim().split(/\s+/).length : 0;

  function handleInput() {
    hasUnsavedChanges = true;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new auto-save timeout (3 seconds after user stops typing)
    saveTimeout = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveJournal();
      }
    }, 3000);
  }

  async function saveJournal() {
    if (!initialMessage.trim()) return;

    try {
      saving = true;
      error = null;

      let updatedJournal: JournalResponse;

      if (journal) {
        // Update existing journal
        updatedJournal = await JournalService.updateJournal(date, {
          initialMessage: initialMessage.trim(),
        });
      } else {
        // Create new journal
        updatedJournal = await JournalService.createJournal({
          date,
          initialMessage: initialMessage.trim(),
        });
      }

      hasUnsavedChanges = false;
      dispatch('update', updatedJournal);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save journal';
    } finally {
      saving = false;
    }
  }

  async function startReflection() {
    if (!journal) {
      // Need to save first
      await saveJournal();
      if (!journal) return; // saveJournal should have updated journal via dispatch
    }

    try {
      startingReflection = true;
      error = null;

      const updatedJournal = await JournalService.startReflection(date);
      dispatch('update', updatedJournal);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start reflection';
    } finally {
      startingReflection = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Save on Ctrl/Cmd + S
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveJournal();
    }
  }
</script>

<div class="card bg-base-100 border-base-300 border shadow-xl">
  <div class="card-body p-4 sm:p-6 md:p-8">
    <!-- Header -->
    <div class="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
      <div class="flex items-center gap-2 sm:gap-3">
        <PenIcon size={20} class="text-primary hidden sm:block" />
        <PenIcon size={16} class="text-primary sm:hidden" />
        <div>
          <h2 class="text-lg sm:text-xl font-semibold">
            {journal ? 'Continue Writing' : 'Write Journal'}
          </h2>
          <p class="text-base-content/70 text-xs sm:text-sm">Share your thoughts, experiences, and reflections</p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-auto">
        {#if hasUnsavedChanges}
          <span class="text-warning text-xs">Unsaved changes</span>
        {/if}
        {#if saving}
          <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
        {/if}
      </div>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="alert alert-error mb-3 sm:mb-4 p-2 sm:p-4 text-xs sm:text-sm">
        <span>{error}</span>
      </div>
    {/if}

    <!-- Editor -->
    <div class="space-y-3 sm:space-y-4">
      <div class="form-control">
        <textarea
          data-test-id="journal-editor-textarea"
          bind:value={initialMessage}
          on:input={handleInput}
          on:keydown={handleKeydown}
          placeholder="What's on your mind today? Write freely about your thoughts, experiences, feelings, or anything that comes to mind..."
          class="textarea textarea-bordered textarea-lg h-48 sm:h-64 w-full resize-none text-sm sm:text-base leading-relaxed transition-all duration-200 focus:scale-[1.01] sm:focus:scale-[1.02]"
          rows="12"
        ></textarea>

        <!-- Character/Word Counter -->
        <div class="label py-1 sm:py-2">
          <span class="label-text-alt text-2xs sm:text-xs opacity-60">
            {wordCount} words • {characterCount} chars
          </span>
          <span class="label-text-alt text-2xs sm:text-xs opacity-60 hidden sm:inline"> Ctrl/Cmd + S to save </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-2 sm:pt-4">
        <div class="flex items-center">
          <button 
            data-test-id="save-draft-button" 
            on:click={saveJournal} 
            disabled={saving || !initialMessage.trim()} 
            class="btn btn-outline btn-sm sm:btn-md gap-1 sm:gap-2 w-full sm:w-auto"
          >
            {#if saving}
              <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
            {:else}
              <SaveIcon size={14} class="sm:hidden" />
              <SaveIcon size={16} class="hidden sm:block" />
            {/if}
            Save Draft
          </button>
        </div>

        <button
          data-test-id="start-reflection-button"
          on:click={startReflection}
          disabled={startingReflection || !journal || !initialMessage.trim()}
          class="btn btn-primary btn-sm sm:btn-md gap-1 sm:gap-2"
        >
          {#if startingReflection}
            <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
          {:else}
            <MessageCircleIcon size={14} class="sm:hidden" />
            <MessageCircleIcon size={16} class="hidden sm:block" />
          {/if}
          Start Reflection
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .textarea:focus {
    outline: none;
    box-shadow: 0 0 0 2px oklch(0.637 0.237 25.331 / 0.2);
  }
  
  /* Custom size for extra small text */
  :global(.text-2xs) {
    font-size: 0.65rem;
  }
</style>
