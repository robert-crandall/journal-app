<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { JournalService } from '$lib/api/journal';
  import { formatDate } from '$lib/utils/date';
  import type { JournalResponse } from '$lib/types/journal';
  import JournalEditor from '$lib/components/journal/JournalEditor.svelte';
  import JournalChat from '$lib/components/journal/JournalChat.svelte';
  import JournalComplete from '$lib/components/journal/JournalComplete.svelte';
  import { BookIcon, CalendarIcon, ArrowLeftIcon } from 'lucide-svelte';
  import { getTodayDateString } from '$lib/utils/date';
  $: date = $page.params.date;

  let journal: JournalResponse | null = null;
  let loading = true;
  let error: string | null = null;
  let isEditingComplete = false; // Track if we're editing a previously complete journal
  let originalCompleteJournal: JournalResponse | null = null; // Store original complete state

  onMount(async () => {
    if (!date) {
      goto('/journal/' + getTodayDateString());
      return;
    }
    await loadJournal();
  });

  async function loadJournal() {
    if (!date) return;
    try {
      loading = true;
      error = null;
      journal = await JournalService.getJournalByDate(date);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        journal = null;
      } else {
        error = err instanceof Error ? err.message : 'Failed to load journal';
      }
    } finally {
      loading = false;
    }
  }

  function handleJournalUpdate(updatedJournal: JournalResponse) {
    journal = updatedJournal;
  }

  function handleJournalEdited(event: CustomEvent<JournalResponse>) {
    const editedJournal = event.detail;
    // Instead of calling the backend /edit endpoint, just transition to editing mode
    originalCompleteJournal = journal; // Store the original complete state
    journal = editedJournal;
    isEditingComplete = true;
  }

  function handleCancelEdit() {
    // Restore the original complete journal state
    journal = originalCompleteJournal;
    isEditingComplete = false;
    originalCompleteJournal = null;
  }

  function handleJournalDeleted(event: CustomEvent<string>) {
    // Redirect to journal dashboard after deletion
    goto('/journal');
  }

  function goBack() {
    goto('/journal');
  }
</script>

<div class="mb-4">
  <button class="btn btn-ghost gap-2" on:click={goBack}>
    <ArrowLeftIcon size={18} />
    Back to Journal
  </button>
</div>

<svelte:head>
  <title>Journal - {date ? formatDate(date) : 'Loading...'}</title>
</svelte:head>

<div class="flex flex-grow flex-col">
  {#if loading}
    <div class="flex flex-grow items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  {:else if error}
    <div class="card bg-error/10 border-error/20 border">
      <div class="card-body">
        <h3 class="card-title text-error">Error</h3>
        <p>{error}</p>
        <div class="card-actions">
          <button class="btn btn-outline" on:click={loadJournal}> Try Again </button>
        </div>
      </div>
    </div>
  {:else if journal}
    <!-- Existing journal - show appropriate view based on status -->
    <div class="flex flex-grow flex-col">
      {#if journal.status === 'draft' || isEditingComplete}
        <JournalEditor
          {journal}
          {date}
          {isEditingComplete}
          {originalCompleteJournal}
          on:update={(e) => handleJournalUpdate(e.detail)}
          on:cancelEdit={handleCancelEdit}
        />
      {:else if journal.status === 'in_review'}
        <div class="flex flex-grow flex-col">
          <JournalChat {journal} {date} on:update={(e) => handleJournalUpdate(e.detail)} />
        </div>
      {:else if journal.status === 'complete'}
        <JournalComplete {journal} on:journalEdited={handleJournalEdited} on:journalDeleted={handleJournalDeleted} />
      {/if}
    </div>
  {:else}
    <!-- No journal exists for this date - show creation form -->
    <JournalEditor journal={null} {date} isEditingComplete={false} originalCompleteJournal={null} on:update={(e) => handleJournalUpdate(e.detail)} />
  {/if}
</div>

<style>
  .text-gradient {
    background: linear-gradient(to right, oklch(0.637 0.237 25.331), oklch(0.637 0.237 330));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
</style>
