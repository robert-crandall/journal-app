<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { journalSummariesApi, journalSummariesUtils } from '$lib/api/journal-summaries';
  import type { JournalSummaryResponse } from '$lib/types/journal-summaries';
  import { 
    BookOpenIcon, 
    CalendarIcon, 
    ArrowLeftIcon,
    EditIcon,
    TrashIcon,
    TagIcon,
    ClockIcon
  } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  // State
  let summary: JournalSummaryResponse | null = null;
  let loading = true;
  let error: string | null = null;
  let showDeleteModal = false;
  let deleting = false;

  // Get the summary ID from the URL
  $: summaryId = $page.params.id;

  onMount(async () => {
    if (summaryId) {
      await loadSummary();
    }
  });

  async function loadSummary() {
    try {
      loading = true;
      error = null;
      summary = await journalSummariesApi.getJournalSummary(summaryId);
    } catch (err) {
      console.error('Failed to load journal summary:', err);
      error = err instanceof Error ? err.message : 'Failed to load journal summary';
    } finally {
      loading = false;
    }
  }

  async function deleteSummary() {
    if (!summary) return;
    
    try {
      deleting = true;
      await journalSummariesApi.deleteJournalSummary(summary.id);
      goto('/journal-summaries');
    } catch (err) {
      console.error('Failed to delete summary:', err);
      error = err instanceof Error ? err.message : 'Failed to delete summary';
    } finally {
      deleting = false;
      showDeleteModal = false;
    }
  }

  function editSummary() {
    if (!summary) return;
    goto(`/journal-summaries/${summary.id}/edit`);
  }

  function goBack() {
    goto('/journal-summaries');
  }

  function getStatusBadgeClass(period: 'week' | 'month'): string {
    return period === 'week' ? 'badge-primary' : 'badge-secondary';
  }

  // Convert line breaks to paragraphs for better formatting
  function formatSummaryContent(content: string): string {
    return content
      .split('\n\n')
      .map(paragraph => `<p class="mb-4">${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
</script>

<svelte:head>
  <title>
    {summary ? `${journalSummariesUtils.formatPeriod(summary.period, summary.startDate, summary.endDate)} Summary - Life Quest` : 'Journal Summary - Life Quest'}
  </title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Breadcrumb -->
    <div class="breadcrumbs mb-6 text-sm">
      <ul>
        <li>
          <button on:click={goBack} class="text-primary hover:text-primary-focus">
            Journal Summaries
          </button>
        </li>
        <li class="text-base-content/60">
          {#if summary}
            {journalSummariesUtils.formatPeriod(summary.period, summary.startDate, summary.endDate)}
          {:else}
            Loading...
          {/if}
        </li>
      </ul>
    </div>

    <!-- Loading State -->
    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60 mt-4">Loading summary...</p>
        </div>
      </div>

    <!-- Error State -->
    {:else if error}
      <div class="card bg-error text-error-content shadow-xl">
        <div class="card-body text-center">
          <h2 class="card-title justify-center">
            <BookOpenIcon size={24} />
            Error Loading Summary
          </h2>
          <p>{error}</p>
          <div class="card-actions justify-center">
            <button on:click={loadSummary} class="btn btn-neutral">Try Again</button>
            <button on:click={goBack} class="btn btn-outline">Back to Summaries</button>
          </div>
        </div>
      </div>

    <!-- Summary Content -->
    {:else if summary}
      <div class="space-y-6">
        <!-- Header Card -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <CalendarIcon size={24} class="text-primary" />
                  <h1 class="text-2xl font-bold">
                    {journalSummariesUtils.formatPeriod(summary.period, summary.startDate, summary.endDate)}
                  </h1>
                  <span class="badge {getStatusBadgeClass(summary.period)}">
                    {summary.period}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-sm text-base-content/70">
                  <span>{summary.startDate} to {summary.endDate}</span>
                  <div class="flex items-center gap-1">
                    <ClockIcon size={14} />
                    Created {formatDateTime(summary.createdAt)}
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button on:click={editSummary} class="btn btn-outline btn-sm gap-2">
                  <EditIcon size={16} />
                  Edit
                </button>
                <button on:click={() => (showDeleteModal = true)} class="btn btn-outline btn-error btn-sm gap-2">
                  <TrashIcon size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags -->
        {#if summary.tags && summary.tags.length > 0}
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-lg mb-4">
                <TagIcon size={20} />
                Tags
              </h2>
              <div class="flex flex-wrap gap-2">
                {#each summary.tags as tag}
                  <span class="badge badge-outline">{tag}</span>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Summary Content -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <BookOpenIcon size={20} />
              Summary
            </h2>
            <div class="prose prose-sm max-w-none">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html formatSummaryContent(summary.summary)}
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <div class="text-center">
          <button on:click={goBack} class="btn btn-outline gap-2">
            <ArrowLeftIcon size={16} />
            Back to Summaries
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Delete Summary</h3>
      <p class="mb-6">
        Are you sure you want to delete this journal summary? This action cannot be undone.
      </p>
      <div class="modal-action">
        <button 
          on:click={() => (showDeleteModal = false)} 
          class="btn btn-outline"
          disabled={deleting}
        >
          Cancel
        </button>
        <button 
          on:click={deleteSummary} 
          class="btn btn-error gap-2"
          disabled={deleting}
        >
          {#if deleting}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <TrashIcon size={16} />
          {/if}
          Delete Permanently
        </button>
      </div>
    </div>
    <button 
      class="modal-backdrop" 
      on:click={() => (showDeleteModal = false)} 
      aria-label="Close modal"
    ></button>
  </div>
{/if}
