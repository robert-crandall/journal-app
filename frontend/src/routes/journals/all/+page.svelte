<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { JournalService } from '$lib/api/journal';
  import type { JournalListItem, ListJournalsResponse } from '$lib/types/journal';
  import { formatDate } from '$lib/utils/date';
  import { BookOpenIcon, ChevronLeftIcon, FilterIcon } from 'lucide-svelte';

  let loading = true;
  let error: string | null = null;
  let journalData: ListJournalsResponse | null = null;
  let searchQuery = '';
  let statusFilter = '';

  // Pagination
  let page = 0;
  let pageSize = 20;

  onMount(async () => {
    await loadJournals();
  });

  async function loadJournals() {
    try {
      loading = true;
      error = null;

      const filters: Record<string, any> = {
        offset: page * pageSize,
        limit: pageSize,
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }

      if (statusFilter) {
        filters.status = statusFilter;
      }

      journalData = await JournalService.listJournals(filters);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load journals';
    } finally {
      loading = false;
    }
  }

  function handleStatusChange() {
    page = 0; // Reset to first page
    loadJournals();
  }

  function handleSearch() {
    page = 0; // Reset to first page
    loadJournals();
  }

  function prevPage() {
    if (page > 0) {
      page--;
      loadJournals();
    }
  }

  function nextPage() {
    if (journalData && journalData.hasMore) {
      page++;
      loadJournals();
    }
  }

  function goBackToDashboard() {
    goto('/journals');
  }

  function goToJournal(date: string) {
    goto(`/journal/${date}`);
  }

  function getRatingDisplay(journal: JournalListItem): string {
    if (journal.dayRating !== null) {
      return journal.dayRating.toString();
    } else if (journal.inferredDayRating !== null) {
      return `${journal.inferredDayRating}*`;
    } else {
      return '-';
    }
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'complete':
        return 'badge-success';
      case 'in_review':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in_review':
        return 'In Review';
      default:
        return 'Draft';
    }
  }

  $: journals = journalData?.journals || [];
  $: total = journalData?.total || 0;
  $: hasMore = journalData?.hasMore || false;
  $: start = page * pageSize + 1;
  $: end = Math.min(start + journals.length - 1, total);
  $: showingText = total > 0 ? `Showing ${start}-${end} of ${total}` : 'No journals found';
</script>

<svelte:head>
  <title>All Journal Entries</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-6">
  <!-- Header -->
  <div class="mb-6">
    <div class="flex items-center gap-2">
      <button class="btn btn-ghost btn-sm" on:click={goBackToDashboard}>
        <ChevronLeftIcon size={16} />
        <span>Back</span>
      </button>
    </div>

    <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <BookOpenIcon size={28} class="text-primary" />
        <h1 class="text-gradient text-2xl font-bold sm:text-3xl">All Journal Entries</h1>
      </div>
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex gap-2">
      <div class="form-control w-full max-w-xs">
        <div class="input-group">
          <input
            type="text"
            placeholder="Search entries..."
            class="input input-bordered w-full max-w-xs"
            bind:value={searchQuery}
            on:keyup={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button class="btn btn-square" on:click={handleSearch}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg
            >
          </button>
        </div>
      </div>

      <div class="form-control w-full max-w-xs">
        <select class="select select-bordered" bind:value={statusFilter} on:change={handleStatusChange}>
          <option value="">All Statuses</option>
          <option value="draft">Drafts</option>
          <option value="in_review">In Review</option>
          <option value="complete">Complete</option>
        </select>
      </div>
    </div>

    <div class="text-base-content/70 text-right text-sm">
      {showingText}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error State -->
  {:else if error}
    <div class="alert alert-error">
      <span>{error}</span>
      <button class="btn btn-sm" on:click={loadJournals}>Retry</button>
    </div>

    <!-- Content -->
  {:else if journals.length === 0}
    <div class="alert">
      <span>No journal entries found matching your criteria.</span>
      <button
        class="btn btn-sm"
        on:click={() => {
          searchQuery = '';
          statusFilter = '';
          loadJournals();
        }}
      >
        Clear Filters
      </button>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-lg border">
      <table class="table-zebra table w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Rating</th>
            <th>Status</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {#each journals as journal (journal.id)}
            <tr class="hover cursor-pointer" on:click={() => goToJournal(journal.date)}>
              <td>{formatDate(journal.date)}</td>
              <td class="max-w-xs truncate">
                {journal.title || journal.synopsis?.substring(0, 50) + '...' || 'Untitled'}
              </td>
              <td>
                {#if journal.dayRating !== null}
                  <span class="badge">{journal.dayRating}</span>
                {:else if journal.inferredDayRating !== null}
                  <span class="badge badge-outline">{journal.inferredDayRating}*</span>
                {:else}
                  -
                {/if}
              </td>
              <td>
                <span class="badge {getStatusClass(journal.status)}">
                  {getStatusText(journal.status)}
                </span>
              </td>
              <td class="text-base-content/70 text-sm">
                {formatDate(journal.updatedAt)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-6 flex justify-between">
      <button class="btn btn-ghost btn-sm" disabled={page === 0} on:click={prevPage}> Previous </button>
      <span class="text-sm">
        Page {page + 1}
      </span>
      <button class="btn btn-ghost btn-sm" disabled={!hasMore} on:click={nextPage}> Next </button>
    </div>
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
