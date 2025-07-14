<script lang="ts">
  import { onMount } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import { goto } from '$app/navigation';
  import type { ListJournalsResponse, JournalListItem } from '$lib/types/journal';
  import { BookOpenIcon, SearchIcon, CalendarIcon, FilterIcon, PlusIcon, LayoutGridIcon, LayoutListIcon } from 'lucide-svelte';
  import JournalCard from '$lib/components/journal/JournalCard.svelte';
  import JournalFilterBar from '$lib/components/journal/JournalFilterBar.svelte';
  import JournalCalendarHeatmap from '$lib/components/journal/JournalCalendarHeatmap.svelte';

  // State
  let journals: JournalListItem[] = [];
  let totalJournals = 0;
  let hasMore = false;
  let availableTags: Array<{ id: string; name: string }> = [];
  let loading = true;
  let error: string | null = null;
  let searchTerm = '';
  let statusFilter: 'all' | 'draft' | 'in_review' | 'complete' = 'all';
  let selectedTags: string[] = [];
  let dateFrom = '';
  let dateTo = '';
  let viewMode: 'grid' | 'list' = 'grid';

  // Pagination
  const ITEMS_PER_PAGE = 12;
  let currentPage = 0;

  onMount(() => {
    loadJournals();
  });

  async function loadJournals(reset = true) {
    try {
      loading = true;
      error = null;

      const params: any = {
        limit: ITEMS_PER_PAGE,
        offset: reset ? 0 : currentPage * ITEMS_PER_PAGE,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (selectedTags.length > 0) params.tagIds = selectedTags;

      const response: ListJournalsResponse = await JournalService.listJournals(params);

      if (reset) {
        journals = response.journals;
        currentPage = 0;
      } else {
        journals = [...journals, ...response.journals];
      }

      totalJournals = response.total;
      hasMore = response.hasMore;
      availableTags = response.availableTags;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load journals';
    } finally {
      loading = false;
    }
  }

  function handleSearch() {
    loadJournals(true);
  }

  function handleFilterChange() {
    loadJournals(true);
  }

  function handleLoadMore() {
    currentPage++;
    loadJournals(false);
  }

  function handleJournalClick(journal: JournalListItem) {
    goto(`/journal/${journal.date}`);
  }

  function createNewJournal() {
    goto(`/journal/${JournalService.getTodayDate()}`);
  }

  function toggleViewMode() {
    viewMode = viewMode === 'grid' ? 'list' : 'grid';
  }
</script>

<svelte:head>
  <title>Journal Dashboard - Life Quest</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <BookOpenIcon size={32} class="text-primary" />
          <div>
            <h1 class="text-gradient text-3xl font-bold">Journal Dashboard</h1>
            <p class="text-base-content/70">
              {totalJournals}
              {totalJournals === 1 ? 'entry' : 'entries'} found
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button on:click={toggleViewMode} class="btn btn-ghost btn-sm" title="Toggle view mode">
            {#if viewMode === 'grid'}
              <LayoutListIcon size={16} />
            {:else}
              <LayoutGridIcon size={16} />
            {/if}
          </button>

          <button on:click={createNewJournal} class="btn btn-primary gap-2">
            <PlusIcon size={16} />
            New Entry
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="mb-8">
      <JournalFilterBar
        bind:searchTerm
        bind:statusFilter
        bind:selectedTags
        bind:dateFrom
        bind:dateTo
        {availableTags}
        on:search={handleSearch}
        on:filter={handleFilterChange}
      />
    </div>

    <!-- Calendar Heatmap -->
    <div class="mb-8">
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title flex items-center gap-2">
            <CalendarIcon size={20} />
            Activity Overview
          </h2>
          <JournalCalendarHeatmap {journals} />
        </div>
      </div>
    </div>

    <!-- Content -->
    {#if loading && journals.length === 0}
      <div class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    {:else if error}
      <div class="card bg-error/10 border-error/20 border">
        <div class="card-body">
          <h3 class="card-title text-error">Error Loading Journals</h3>
          <p>{error}</p>
          <div class="card-actions">
            <button class="btn btn-outline" on:click={() => loadJournals(true)}> Try Again </button>
          </div>
        </div>
      </div>
    {:else if journals.length === 0}
      <div class="card bg-base-200">
        <div class="card-body text-center">
          <BookOpenIcon size={48} class="text-base-content/30 mx-auto mb-4" />
          <h3 class="card-title mb-2 justify-center">No Journals Found</h3>
          <p class="text-base-content/70 mb-4">
            {#if searchTerm || statusFilter !== 'all' || selectedTags.length > 0 || dateFrom || dateTo}
              Try adjusting your search filters or create a new journal entry.
            {:else}
              Start your journaling journey by creating your first entry.
            {/if}
          </p>
          <div class="card-actions justify-center">
            <button on:click={createNewJournal} class="btn btn-primary gap-2">
              <PlusIcon size={16} />
              Create First Journal
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Journal Grid/List -->
      <div class={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {#each journals as journal (journal.id)}
          <JournalCard {journal} {viewMode} on:click={() => handleJournalClick(journal)} />
        {/each}
      </div>

      <!-- Load More -->
      {#if hasMore}
        <div class="mt-8 flex justify-center">
          <button on:click={handleLoadMore} class="btn btn-outline" disabled={loading}>
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
            {/if}
            Load More
          </button>
        </div>
      {/if}
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
