<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { JournalService } from '$lib/api/journal';
  import { formatDate as formatDateUtil } from '$lib/utils/date';
  import type { JournalResponse } from '$lib/types/journal';
  import JournalEditor from '$lib/components/journal/JournalEditor.svelte';
  import JournalChat from '$lib/components/journal/JournalChat.svelte';
  import JournalComplete from '$lib/components/journal/JournalComplete.svelte';
  import { BookIcon, CalendarIcon, ArrowLeftIcon } from 'lucide-svelte';
  import { getTodayDateString } from '$lib/utils/date';
  // Get date from URL params
  $: date = $page.params.date;

  let journal: JournalResponse | null = null;
  let loading = true;
  let error: string | null = null;

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
      // If journal doesn't exist for this date, that's ok - we'll show create form
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

  function formatDate(dateStr: string): string {
    try {
      return formatDateUtil(dateStr);
    } catch {
      return dateStr;
    }
  }

  function goToToday() {
    goto('/journal/' + getTodayDateString());
  }

  function goBack() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Journal - {date ? formatDate(date) : 'Loading...'}</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button on:click={goBack} class="btn btn-ghost btn-sm gap-2">
          <ArrowLeftIcon size={16} />
          Back to Home
        </button>

        <div class="flex items-center gap-3">
          <BookIcon size={24} class="text-primary" />
          <div>
            <h1 class="text-gradient text-2xl font-bold">Journal Entry</h1>
            <p class="text-base-content/70 text-sm">
              {date ? formatDate(date) : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
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
      {#if journal.status === 'draft'}
        <JournalEditor {journal} {date} on:update={(e) => handleJournalUpdate(e.detail)} />
      {:else if journal.status === 'in_review'}
        <JournalChat {journal} {date} on:update={(e) => handleJournalUpdate(e.detail)} />
      {:else if journal.status === 'complete'}
        <JournalComplete {journal} />
      {/if}
    {:else}
      <!-- No journal exists for this date - show creation form -->
      <JournalEditor journal={null} {date} on:update={(e) => handleJournalUpdate(e.detail)} />
    {/if}
  </div>
</div>

<style>
  .text-gradient {
    background: linear-gradient(to right, oklch(0.637 0.237 25.331), oklch(0.637 0.237 330));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
</style>
