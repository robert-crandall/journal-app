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
  <div class="card-body p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <PenIcon size={24} class="text-primary" />
        <div>
          <h2 class="text-xl font-semibold">
            {journal ? 'Continue Writing' : 'Write Journal'}
          </h2>
          <p class="text-sm text-base-content/70">
            Share your thoughts, experiences, and reflections
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        {#if hasUnsavedChanges}
          <span class="text-xs text-warning">Unsaved changes</span>
        {/if}
        {#if saving}
          <span class="loading loading-spinner loading-sm"></span>
        {/if}
      </div>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="alert alert-error mb-4">
        <span>{error}</span>
      </div>
    {/if}

    <!-- Editor -->
    <div class="space-y-4">
      <div class="form-control">
        <textarea
          bind:value={initialMessage}
          on:input={handleInput}
          on:keydown={handleKeydown}
          placeholder="What's on your mind today? Write freely about your thoughts, experiences, feelings, or anything that comes to mind..."
          class="textarea textarea-bordered textarea-lg h-64 w-full resize-none transition-all duration-200 focus:scale-[1.02] text-base leading-relaxed"
          rows="12"
        ></textarea>
        
        <!-- Character/Word Counter -->
        <div class="label">
          <span class="label-text-alt text-xs opacity-60">
            {wordCount} words • {characterCount} characters
          </span>
          <span class="label-text-alt text-xs opacity-60">
            Ctrl/Cmd + S to save
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-4">
        <div class="flex items-center gap-4">
          <button
            on:click={saveJournal}
            disabled={saving || !initialMessage.trim()}
            class="btn btn-outline gap-2"
          >
            {#if saving}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <SaveIcon size={16} />
            {/if}
            Save Draft
          </button>
        </div>

        <button
          on:click={startReflection}
          disabled={startingReflection || !journal || !initialMessage.trim()}
          class="btn btn-primary gap-2"
        >
          {#if startingReflection}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <MessageCircleIcon size={16} />
          {/if}
          Start Reflection
        </button>
      </div>

      <!-- Help Text -->
      <div class="bg-primary/10 rounded-lg p-4 border border-primary/20">
        <h3 class="font-medium text-sm mb-2">💡 Writing Tips</h3>
        <ul class="text-sm text-base-content/80 space-y-1">
          <li>• Write freely without worrying about structure or grammar</li>
          <li>• Include feelings, experiences, thoughts, or observations</li>
          <li>• Your entry will be saved automatically as you type</li>
          <li>• When ready, start reflection to explore your thoughts deeper</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  .textarea:focus {
    outline: none;
    box-shadow: 0 0 0 2px oklch(0.637 0.237 25.331 / 0.2);
  }
</style>
