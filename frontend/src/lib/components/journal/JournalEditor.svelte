<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import type { JournalResponse } from '$lib/types/journal';
  import { PenIcon, MessageCircleIcon, SaveIcon, CheckCircleIcon, ImageIcon } from 'lucide-svelte';
  import JournalFinishDialog from './JournalFinishDialog.svelte';
  import PhotoUpload from '$lib/components/PhotoUpload.svelte';

  export let journal: JournalResponse | null;
  export let date: string;

  const dispatch = createEventDispatcher<{
    update: JournalResponse;
  }>();

  let initialMessage = journal?.initialMessage || '';
  let saving = false;
  let startingReflection = false;
  let finishing = false;
  let error: string | null = null;
  let textareaElement: HTMLTextAreaElement;
  let showFinishDialog = false;

  // Photo upload state
  let showPhotoUpload = false;

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

    // Set new auto-save timeout (5 seconds after user stops typing)
    saveTimeout = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveJournal(true); // Pass true to preserve focus during auto-save
      }
    }, 5000);
  }

  async function saveJournal(preserveFocus = false) {
    if (!initialMessage.trim()) return;

    // Store cursor position and focus state if we need to preserve focus
    let cursorPosition = 0;
    let wasFocused = false;

    if (preserveFocus && textareaElement) {
      wasFocused = document.activeElement === textareaElement;
      cursorPosition = textareaElement.selectionStart;
    }

    try {
      saving = true;
      error = null;

      const updatedJournal = await ensureJournalSaved();
      if (updatedJournal) {
        dispatch('update', updatedJournal);
      }

      // Restore focus and cursor position if needed
      if (preserveFocus && wasFocused && textareaElement) {
        // Use requestAnimationFrame to ensure the DOM has updated
        requestAnimationFrame(() => {
          textareaElement.focus();
          textareaElement.setSelectionRange(cursorPosition, cursorPosition);
        });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save journal';
    } finally {
      saving = false;
    }
  }

  // Shared helper function to ensure journal exists with current content
  async function ensureJournalSaved(): Promise<JournalResponse | null> {
    if (!initialMessage.trim()) return null;

    try {
      let updatedJournal: JournalResponse | null;
      updatedJournal = null;

      if (journal) {
        // Update existing journal if there are unsaved changes
        if (hasUnsavedChanges) {
          updatedJournal = await JournalService.updateJournal(date, {
            initialMessage: initialMessage.trim(),
          });
          hasUnsavedChanges = false;
        } else {
          // No unsaved changes, just return the existing journal
          updatedJournal = journal;
        }
        return updatedJournal;
      } else {
        // Create new journal
        updatedJournal = await JournalService.createJournal({
          date,
          initialMessage: initialMessage.trim(),
        });
        hasUnsavedChanges = false;
        return updatedJournal;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save journal';
      return null;
    }
  }

  async function startReflection() {
    try {
      startingReflection = true;
      error = null;

      const savedJournal = await ensureJournalSaved();
      if (savedJournal) {
        const updatedJournal = await JournalService.startReflection(date);
        dispatch('update', updatedJournal);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start reflection';
    } finally {
      startingReflection = false;
    }
  }

  function openFinishDialog() {
    showFinishDialog = true;
  }

  async function finishJournal(dayRating: number | null = null) {
    try {
      finishing = true;
      error = null;

      const savedJournal = await ensureJournalSaved();
      if (savedJournal) {
        // Update with day rating if provided
        if (dayRating !== null) {
          await JournalService.updateJournal(date, { dayRating });
        }
        // Then finish the journal
        const completedJournal = await JournalService.finishJournal(date);
        dispatch('update', completedJournal);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to finish journal';
    } finally {
      finishing = false;
    }
  }

  function handleFinish(event: CustomEvent<{ dayRating: number | null }>) {
    finishJournal(event.detail.dayRating);
  }

  function handleKeydown(event: KeyboardEvent) {
    // Save on Ctrl/Cmd + S
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveJournal();
    }
  }

  function togglePhotoUpload() {
    showPhotoUpload = !showPhotoUpload;
  }

  function handlePhotoUploaded() {
    // Photos were uploaded successfully
    // The PhotoUpload component will handle the actual upload
    // We could add any additional logic here if needed
  }
</script>

<div class="card bg-base-100 border-base-300 border shadow-xl">
  <div class="card-body p-4 sm:p-6 md:p-8">
    <!-- Header -->
    <div class="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
      <div class="flex items-center gap-2 sm:gap-3">
        <PenIcon size={20} class="text-primary hidden sm:block" />
        <PenIcon size={16} class="text-primary sm:hidden" />
        <div>
          <h2 class="text-lg font-semibold sm:text-xl">
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
      <div class="alert alert-error mb-3 p-2 text-xs sm:mb-4 sm:p-4 sm:text-sm">
        <span>{error}</span>
      </div>
    {/if}

    <!-- Editor -->
    <div class="space-y-3 sm:space-y-4">
      <div class="form-control">
        <textarea
          bind:this={textareaElement}
          data-test-id="journal-editor-textarea"
          bind:value={initialMessage}
          on:input={handleInput}
          on:keydown={handleKeydown}
          placeholder="What's on your mind today? Write freely about your thoughts, experiences, feelings, or anything that comes to mind..."
          class="textarea textarea-bordered textarea-lg w-full text-sm leading-relaxed transition-all duration-200 focus:scale-[1.01] sm:text-base sm:focus:scale-[1.02]"
          rows="12"
        ></textarea>

        <!-- Character/Word Counter -->
        <div class="label py-1 sm:py-2">
          <span class="label-text-alt text-2xs opacity-60 sm:text-xs">
            {wordCount} words • {characterCount} chars
          </span>
          <span class="label-text-alt text-2xs hidden opacity-60 sm:inline sm:text-xs"> Ctrl/Cmd + S to save </span>
        </div>
      </div>

      <!-- Photo Upload Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <button type="button" on:click={togglePhotoUpload} class="btn btn-ghost btn-sm gap-2" class:btn-active={showPhotoUpload}>
            <ImageIcon size={16} />
            {showPhotoUpload ? 'Hide Photos' : 'Add Photos'}
          </button>
        </div>

        {#if showPhotoUpload}
          <div class="border-base-300 rounded-lg border p-4">
            <PhotoUpload linkedType="journal" linkedId={journal?.id || date} on:uploaded={handlePhotoUploaded} />
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center sm:gap-0 sm:pt-4">
        <div class="flex items-center gap-2">
          <button
            data-test-id="save-draft-button"
            on:click={() => saveJournal()}
            disabled={saving || !initialMessage.trim()}
            class="btn btn-outline btn-sm sm:btn-md gap-1 sm:gap-2"
          >
            {#if saving}
              <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
            {:else}
              <SaveIcon size={14} class="sm:hidden" />
              <SaveIcon size={16} class="hidden sm:block" />
            {/if}
            Save Draft
          </button>

          <button
            data-test-id="finish-journal-button"
            on:click={openFinishDialog}
            disabled={finishing || !initialMessage.trim()}
            class="btn btn-success btn-sm sm:btn-md gap-1 sm:gap-2"
          >
            {#if finishing}
              <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
            {:else}
              <CheckCircleIcon size={14} class="sm:hidden" />
              <CheckCircleIcon size={16} class="hidden sm:block" />
            {/if}
            Complete Journal
          </button>
        </div>

        <button
          data-test-id="start-reflection-button"
          on:click={startReflection}
          disabled={startingReflection || !initialMessage.trim()}
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

      <!-- Finish Dialog -->
      <JournalFinishDialog bind:open={showFinishDialog} on:finish={handleFinish} on:cancel={() => (showFinishDialog = false)} />
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
