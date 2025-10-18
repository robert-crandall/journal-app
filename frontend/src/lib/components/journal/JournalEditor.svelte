<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import { PhotoService } from '$lib/api/photos';
  import { DailyQuestionsService } from '$lib/api/daily-questions';
  import type { JournalResponse } from '$lib/types/journal';
  import type { PhotoResponse } from '$lib/types/photos';
  import type { DailyQuestionResponse } from '../../../../../backend/src/db/schema';
  import { PenIcon, MessageCircleIcon, SaveIcon, CheckCircleIcon, ImageIcon, XIcon, SparklesIcon } from 'lucide-svelte';
  import JournalFinishDialog from './JournalFinishDialog.svelte';
  import PhotoUpload from '$lib/components/PhotoUpload.svelte';

  export let journal: JournalResponse | null;
  export let date: string;
  export let isEditingComplete: boolean = false; // Track if editing a previously complete journal
  export let originalCompleteJournal: JournalResponse | null = null; // Original complete journal state

  const dispatch = createEventDispatcher<{
    update: JournalResponse;
    cancelEdit: void;
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
  let photos: PhotoResponse[] = [];
  let loadingPhotos = false;

  // Auto-save timeout
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let hasUnsavedChanges = false;
  let needsXpCleanup = isEditingComplete; // Track if we need to clean up XP on first save

  // Daily question state
  let dailyQuestion: DailyQuestionResponse | null = null;
  let loadingQuestion = true;

  // Character counter
  $: characterCount = initialMessage.length;
  $: wordCount = initialMessage.trim() ? initialMessage.trim().split(/\s+/).length : 0;

  // Show daily question if it exists and no initial content yet
  $: showDailyQuestion = dailyQuestion && !initialMessage.trim() && !isEditingComplete;

  onMount(() => {
    loadPhotos();
    loadDailyQuestion();
  });

  async function loadPhotos() {
    if (!journal?.id) return;

    try {
      loadingPhotos = true;
      const response = await PhotoService.listPhotos({
        linkedType: 'journal',
        journalId: journal.id,
      });
      photos = response.photos || [];
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      loadingPhotos = false;
    }
  }

  async function loadDailyQuestion() {
    // Only show daily question for new journals (not when editing existing ones)
    if (isEditingComplete || (journal && journal.initialMessage)) {
      loadingQuestion = false;
      return;
    }

    try {
      const response = await DailyQuestionsService.getTodaysQuestion(date);
      if (response.question) {
        dailyQuestion = response.question;
      }
    } catch (error) {
      console.error('Failed to load daily question:', error);
    } finally {
      loadingQuestion = false;
    }
  }

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
          // If this is the first save of a previously complete journal, clean up XP first
          if (needsXpCleanup) {
            updatedJournal = await JournalService.editJournal(date, {
              initialMessage: initialMessage.trim(),
            });
            needsXpCleanup = false; // XP cleanup done
          } else {
            // Regular update for ongoing edits
            updatedJournal = await JournalService.updateJournal(date, {
              initialMessage: initialMessage.trim(),
            });
          }
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

  function handlePhotoUploaded(event: CustomEvent) {
    // Photo uploaded successfully, reload photos to show the new one
    loadPhotos();
  }

  function handlePhotoDeleted(event: CustomEvent) {
    // Photo deleted successfully, reload photos to reflect the change
    loadPhotos();
  }

  function handleCancelEdit() {
    // Dispatch event to cancel editing and return to complete view
    dispatch('cancelEdit');
  }

  function answerDailyQuestion(questionText: string) {
    if (!dailyQuestion) return;

    // Pre-fill the textarea with the question
    initialMessage = questionText;
    hasUnsavedChanges = true;

    // Focus the textarea for user to continue writing
    if (textareaElement) {
      textareaElement.focus();
      // Position cursor at the end
      textareaElement.setSelectionRange(questionText.length, questionText.length);
    }
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
            {#if isEditingComplete}
              Edit Journal
            {:else if journal}
              Continue Writing
            {:else}
              Write Journal
            {/if}
          </h2>
          <p class="text-base-content/70 text-xs sm:text-sm">
            {#if isEditingComplete}
              {#if needsXpCleanup}
                <span class="text-warning">⚠️ XP will be recalculated when you save changes</span>
              {:else}
                Editing your completed journal entry
              {/if}
            {:else if showDailyQuestion}
              Start with today's question, or write freely about anything on your mind
            {:else}
              Share your thoughts, experiences, and reflections
            {/if}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-auto">
        {#if isEditingComplete}
          <button data-test-id="cancel-edit-button" on:click={handleCancelEdit} class="btn btn-ghost btn-sm gap-1 sm:gap-2">
            <XIcon size={14} class="sm:hidden" />
            <XIcon size={16} class="hidden sm:block" />
            Cancel
          </button>
        {/if}
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

    <!-- Daily Question of the Day -->
    {#if showDailyQuestion}
      <div class="mb-4 sm:mb-6">
        <div class="card border-accent/20 bg-accent/5">
          <div class="card-body p-4 sm:p-6">
            <div class="flex items-start gap-3">
              <!-- Sparkles icon -->
              <div class="flex-shrink-0">
                <div class="bg-accent text-accent-content flex h-8 w-8 items-center justify-center rounded-full">
                  <SparklesIcon size={18} />
                </div>
              </div>
              
              <!-- Question content -->
              <div class="flex-1">
                <div class="text-accent mb-2 flex items-center gap-2 text-sm font-medium">
                  <SparklesIcon size={16} />
                  Question of the Day
                </div>
                <p class="text-base-content mb-4 leading-relaxed">
                  {dailyQuestion!.questionText}
                </p>
              </div>
            </div>
          </div>
        </div>
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
            {showPhotoUpload ? 'Hide Photos' : 'Photos'}
            {photos.length > 0 ? `(${photos.length})` : ''}
          </button>
        </div>

        {#if showPhotoUpload || photos.length > 0}
          <div class="border-base-300 rounded-lg border p-4">
            {#if loadingPhotos}
              <div class="flex items-center justify-center p-4">
                <span class="loading loading-spinner loading-sm"></span>
                <span class="ml-2 text-sm opacity-70">Loading photos...</span>
              </div>
            {:else}
              <PhotoUpload linkedType="journal" linkedId={journal?.id || date} {photos} on:uploaded={handlePhotoUploaded} on:delete={handlePhotoDeleted} />
            {/if}
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
