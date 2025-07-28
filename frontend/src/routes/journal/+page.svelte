<script lang="ts">
  import { onMount } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import { goto } from '$app/navigation';
  import type { ListJournalsResponse, JournalListItem, ToneTag } from '$lib/types/journal';
  import { BookOpenIcon, SearchIcon, CalendarIcon, FilterIcon } from 'lucide-svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import { LayoutGridIcon, LayoutListIcon, PlusIcon, SparklesIcon } from 'lucide-svelte';
  import JournalCard from '$lib/components/journal/JournalCard.svelte';
  import JournalFilterBar from '$lib/components/journal/JournalFilterBar.svelte';
  import JournalCalendarHeatmap from '$lib/components/journal/JournalCalendarHeatmap.svelte';
  import { getTodayDateString } from '$lib/utils/date';

  // State
  let journals: JournalListItem[] = [];
  let allFilteredJournals: JournalListItem[] = []; // All journals matching current filters
  let totalJournals = 0;
  let hasMore = false;
  let availableTags: Array<{ id: string; name: string }> = [];
  let loading = true;
  let error: string | null = null;
  let searchTerm = '';
  let statusFilter: 'all' | 'draft' | 'in_review' | 'complete' = 'all';
  let selectedTags: string[] = [];
  let selectedToneTags: ToneTag[] = [];
  let dateFrom = '';
  let dateTo = '';
  let viewMode: 'grid' | 'list' = 'list';

  // Pagination
  const ITEMS_PER_PAGE = 12;
  let currentPage = 0;

  onMount(() => {
    loadJournals();
  });

  function goToSummaries() {
    goto('/journal-summaries');
  }

  async function loadJournals(reset = true) {
    try {
      loading = true;
      error = null;

      // Build filter params
      const filterParams: any = {};
      if (searchTerm.trim()) filterParams.search = searchTerm.trim();
      if (statusFilter !== 'all') filterParams.status = statusFilter;
      if (dateFrom) filterParams.dateFrom = dateFrom;
      if (dateTo) filterParams.dateTo = dateTo;
      if (selectedTags.length > 0) filterParams.tagId = selectedTags[0]; // Only use first tag since backend now supports single tagId
      // Note: Backend doesn't support tone tag filtering yet, but frontend is ready

      // Load all filtered journals for heatmap (limit to reasonable amount)
      const allJournalsParams = {
        ...filterParams,
        limit: 500, // Reasonable limit for heatmap data
        offset: 0,
      };
      const allJournalsResponse: ListJournalsResponse = await JournalService.listJournals(allJournalsParams);
      allFilteredJournals = allJournalsResponse.journals;
      availableTags = allJournalsResponse.availableTags;
      totalJournals = allJournalsResponse.total;

      // For paginated display, slice the journals
      if (reset) {
        currentPage = 0;
        journals = allFilteredJournals.slice(0, ITEMS_PER_PAGE);
      } else {
        const startIndex = currentPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        journals = [...journals, ...allFilteredJournals.slice(startIndex, endIndex)];
      }

      // Update hasMore based on local data
      hasMore = journals.length < allFilteredJournals.length;
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
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    journals = [...journals, ...allFilteredJournals.slice(startIndex, endIndex)];
    hasMore = journals.length < allFilteredJournals.length;
  }

  function handleJournalClick(journal: JournalListItem) {
    goto(`/journal/${journal.date}`);
  }

  function createNewJournal() {
    goto(`/journal/${getTodayDateString()}`);
  }

  function toggleViewMode() {
    viewMode = viewMode === 'grid' ? 'list' : 'grid';
  }

  // Header buttons array for AppHeader
  $: buttons = [
    {
      label: 'Summaries',
      icon: SparklesIcon,
      onClick: goToSummaries,
      class: 'btn btn-ghost btn-sm w-auto',
      showLabel: true,
    },
    {
      label: viewMode === 'grid' ? 'List' : 'Grid',
      icon: viewMode === 'grid' ? LayoutListIcon : LayoutGridIcon,
      onClick: toggleViewMode,
      class: 'btn btn-ghost btn-sm w-auto',
      showLabel: false,
      title: 'Toggle view mode',
    },
    {
      label: 'New Entry',
      icon: PlusIcon,
      onClick: createNewJournal,
      class: 'btn btn-primary gap-2 w-auto',
      showLabel: true,
    },
  ];
</script>

<svelte:head>
  <title>Journal Dashboard - Life Quest</title>
</svelte:head>

<!-- Search and Filters -->
<div class="mb-8">
  <JournalFilterBar
    bind:searchTerm
    bind:statusFilter
    bind:selectedTags
    bind:selectedToneTags
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
      <JournalCalendarHeatmap journals={allFilteredJournals} />
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
        <button on:click={createNewJournal} class="btn btn-primary gap-2"> Create First Journal </button>
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
