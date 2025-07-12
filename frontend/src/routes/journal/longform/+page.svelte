<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { journalApi } from '$lib/api/journal';
  import { formatDateTime } from '$lib/utils/date';

  let content = '';
  let isSaving = false;
  let error: string | null = null;
  let entryId: string | null = null;
  
  // Auto-save functionality
  let lastSavedContent = '';
  let autoSaveTimer: NodeJS.Timeout | null = null;
  let lastSavedTime: Date | null = null;
  let isSavingDraft = false;
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  onMount(() => {
    // Set up auto-save timer
    autoSaveTimer = setInterval(autoSaveDraft, AUTO_SAVE_INTERVAL);

    // Clean up timer on component destroy
    return () => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
      }
    };
  });

  async function autoSaveDraft() {
    // Only auto-save if content has changed
    if (content && content !== lastSavedContent && !isSaving && !isSavingDraft) {
      try {
        isSavingDraft = true;
        
        // Save using the simple endpoint that doesn't analyze content
        const result = await journalApi.saveSimpleLongForm(content, entryId || undefined);
        
        // Update entry ID in case this is first save
        if (!entryId) {
          entryId = result.entryId;
        }
        
        lastSavedContent = content;
        lastSavedTime = new Date();
        isSavingDraft = false;
      } catch (err) {
        isSavingDraft = false;
        console.error('Failed to auto-save draft:', err);
      }
    }
  }

  async function saveLongForm(analyzeContent = false) {
    if (!content.trim()) {
      error = 'Please write something before saving';
      return;
    }

    try {
      isSaving = true;
      error = null;
      
      let result;
      if (analyzeContent) {
        // Use the original endpoint that analyzes content
        result = await journalApi.saveLongForm(content);
      } else {
        // Use the new endpoint that doesn't analyze content
        result = await journalApi.saveSimpleLongForm(content, entryId || undefined);
      }
      
      entryId = result.entryId;
      
      // Navigate to the entry view page
      goto(`/journal/${entryId}`);
    } catch (err) {
      isSaving = false;
      error = err instanceof Error ? err.message : 'Failed to save journal entry';
    }
  }

  async function startReflection() {
    if (!entryId) {
      error = 'Please save your entry first';
      return;
    }

    try {
      isSaving = true;
      error = null;
      
      // Start reflection mode with the saved entry
      const result = await journalApi.startReflection(entryId);
      
      // Navigate to the chat session
      goto(`/journal/session?id=${result.sessionId}`);
    } catch (err) {
      isSaving = false;
      error = err instanceof Error ? err.message : 'Failed to start reflection';
    }
  }

  function cancelEntry() {
    // Go back to the journal list
    goto('/journal');
  }
</script>

<svelte:head>
  <title>New Journal Entry | Gamified Life</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <div class="mb-4 flex items-center gap-3">
      <a href="/journal" class="btn btn-ghost btn-sm"> ← Back to Journal </a>
      <div class="divider divider-horizontal"></div>
      <div class="text-base-content/60 flex items-center gap-2 text-sm">
        📅 {formatDateTime(new Date().toISOString())}
      </div>
    </div>
    <h1 class="text-xl font-semibold">New Journal Entry</h1>
    <p class="text-base-content/70 mt-1">Write freely about your thoughts, feelings, or experiences...</p>
  </div>

  {#if error}
    <div in:fade class="alert alert-error mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  <!-- Journal content textarea -->
  <div class="mb-6 bg-base-100 p-1 rounded-lg shadow-sm">
    <textarea
      bind:value={content}
      class="textarea textarea-lg w-full min-h-[50vh] resize-y bg-transparent focus:outline-none"
      placeholder="Write about your day, your thoughts, or anything on your mind…"
      disabled={isSaving}
    ></textarea>
  </div>

  <!-- Auto-save indicator -->
  {#if lastSavedTime}
    <div class="text-xs text-base-content/50 mb-4 italic">
      {isSavingDraft ? 'Saving draft...' : `Draft auto-saved at ${lastSavedTime.toLocaleTimeString()}`}
    </div>
  {/if}

  <!-- Action buttons -->
  <div class="flex flex-wrap justify-between gap-4">
    <div>
      <button class="btn btn-ghost" on:click={cancelEntry} disabled={isSaving}>
        Cancel
      </button>
    </div>
    <div class="flex gap-3">
      {#if entryId}
        <button class="btn btn-primary" on:click={startReflection} disabled={isSaving}>
          {#if isSaving}
            <span class="loading loading-spinner loading-sm"></span>
          {/if}
          Begin Reflection
        </button>
      {:else}
        <button class="btn btn-accent" on:click={() => saveLongForm(false)} disabled={isSaving}>
          {#if isSaving}
            <span class="loading loading-spinner loading-sm"></span>
          {/if}
          Save Only
        </button>
        <button class="btn btn-primary" on:click={() => saveLongForm(true)} disabled={isSaving}>
          {#if isSaving}
            <span class="loading loading-spinner loading-sm"></span>
          {/if}
          Save & Begin Reflection
        </button>
      {/if}
    </div>
  </div>
</div>
