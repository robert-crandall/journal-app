<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { journalSummariesApi, journalSummariesUtils } from '$lib/api/journal-summaries';
  import type { JournalSummaryResponse, ListJournalSummariesResponse } from '$lib/types/journal-summaries';
  import { BookOpenIcon, CalendarIcon, PlusIcon, FilterIcon, RefreshCwIcon, ClockIcon, TagIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';
  import CompactMetricsDisplay from '$lib/components/metrics/CompactMetricsDisplay.svelte';
  import Markdown from '$lib/components/common/Markdown.svelte';

  // State
  let summaries: JournalSummaryResponse[] = [];
  let totalSummaries = 0;
  let hasMore = false;
  let loading = true;
  let error: string | null = null;

  // Filters
  let periodFilter: 'all' | 'week' | 'month' = 'all';
  let yearFilter: number | null = null;

  // Pagination
  const ITEMS_PER_PAGE = 12;
  let currentPage = 0;

  onMount(async () => {
    await loadSummaries();
  });

  async function loadSummaries(reset = true) {
    try {
      loading = true;
      error = null;

      const params: any = {
        limit: ITEMS_PER_PAGE,
        offset: reset ? 0 : currentPage * ITEMS_PER_PAGE,
      };

      if (periodFilter !== 'all') params.period = periodFilter;
      if (yearFilter) params.year = yearFilter;

      if (reset) currentPage = 0;

      const response = await journalSummariesApi.getJournalSummaries(params);

      if (reset) {
        summaries = response.summaries;
      } else {
        summaries = [...summaries, ...response.summaries];
      }

      totalSummaries = response.total;
      hasMore = response.hasMore;
    } catch (err) {
      console.error('Failed to load journal summaries:', err);
      error = err instanceof Error ? err.message : 'Failed to load journal summaries';
    } finally {
      loading = false;
    }
  }

  async function handleFilterChange() {
    await loadSummaries(true);
  }

  async function loadMore() {
    if (!hasMore || loading) return;
    currentPage++;
    await loadSummaries(false);
  }

  function createWeeklySummary() {
    const { startDate, endDate } = journalSummariesUtils.getCurrentWeekBoundaries();
    goto(`/journal-summaries/generate?period=week&startDate=${startDate}&endDate=${endDate}`);
  }

  function createMonthlySummary() {
    const { startDate, endDate } = journalSummariesUtils.getCurrentMonthBoundaries();
    goto(`/journal-summaries/generate?period=month&startDate=${startDate}&endDate=${endDate}`);
  }

  function viewSummary(summary: JournalSummaryResponse) {
    goto(`/journal-summaries/${summary.id}`);
  }

  function getStatusBadgeClass(period: 'week' | 'month'): string {
    return period === 'week' ? 'badge-primary' : 'badge-secondary';
  }

  // Get current year and a few previous years for filter
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
</script>

<svelte:head>
  <title>Journal Summaries - Life Quest</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <BookOpenIcon size={32} class="text-primary" />
          <div>
            <h1 class="text-gradient text-3xl font-bold">Journal Summaries</h1>
            <p class="text-base-content/70">
              {totalSummaries}
              {totalSummaries === 1 ? 'summary' : 'summaries'} found
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button on:click={createWeeklySummary} class="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Weekly Summary
          </button>
          <button on:click={createMonthlySummary} class="btn btn-secondary btn-sm gap-2">
            <PlusIcon size={16} />
            Monthly Summary
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6">
      <div class="card bg-base-200">
        <div class="card-body p-4">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <FilterIcon size={16} class="text-base-content/70" />
              <span class="text-sm font-medium">Filters:</span>
            </div>

            <!-- Period Filter -->
            <div class="form-control">
              <label class="label py-0">
                <span class="label-text text-xs">Period</span>
              </label>
              <select bind:value={periodFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
                <option value="all">All Periods</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>

            <!-- Year Filter -->
            <div class="form-control">
              <label class="label py-0">
                <span class="label-text text-xs">Year</span>
              </label>
              <select bind:value={yearFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
                <option value={null}>All Years</option>
                {#each availableYears as year}
                  <option value={year}>{year}</option>
                {/each}
              </select>
            </div>

            <button on:click={() => loadSummaries(true)} class="btn btn-ghost btn-sm gap-2">
              <RefreshCwIcon size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    {#if loading && summaries.length === 0}
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60 mt-4">Loading summaries...</p>
        </div>
      </div>

      <!-- Error State -->
    {:else if error}
      <div class="card bg-error text-error-content shadow-xl">
        <div class="card-body text-center">
          <h2 class="card-title justify-center">
            <BookOpenIcon size={24} />
            Error Loading Summaries
          </h2>
          <p>{error}</p>
          <div class="card-actions justify-center">
            <button on:click={() => loadSummaries(true)} class="btn btn-neutral">Try Again</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
    {:else if summaries.length === 0}
      <div class="card bg-base-200">
        <div class="card-body py-20 text-center">
          <div class="avatar placeholder mb-6">
            <div class="bg-base-300 text-base-content w-24 rounded-full">
              <BookOpenIcon size={48} />
            </div>
          </div>
          <h2 class="mb-4 text-2xl font-bold">No Journal Summaries Yet</h2>
          <p class="text-base-content/70 mx-auto mb-6 max-w-md">Create your first journal summary to see patterns and themes from your journal entries.</p>
          <div class="flex flex-wrap justify-center gap-3">
            <button on:click={createWeeklySummary} class="btn btn-primary gap-2">
              <PlusIcon size={16} />
              Create Weekly Summary
            </button>
            <button on:click={createMonthlySummary} class="btn btn-secondary gap-2">
              <PlusIcon size={16} />
              Create Monthly Summary
            </button>
          </div>
        </div>
      </div>

      <!-- Summaries Grid -->
    {:else}
      <div class="grid gap-6 md:grid-cols-2">
        {#each summaries as summary (summary.id)}
          <div
            class="card bg-base-100 border-base-300 cursor-pointer border shadow-xl transition-all duration-200 hover:shadow-2xl"
            on:click={() => viewSummary(summary)}
            on:keydown={(e) => e.key === 'Enter' && viewSummary(summary)}
            role="button"
            tabindex="0"
          >
            <div class="card-body">
              <!-- Header -->
              <div class="mb-3 flex items-start justify-between">
                <div class="flex items-center gap-2">
                  <CalendarIcon size={18} class="text-base-content/70" />
                  <span class="font-medium">
                    {journalSummariesUtils.formatPeriod(summary.period, summary.startDate, summary.endDate)}
                  </span>
                </div>
                <span class="badge {getStatusBadgeClass(summary.period)} badge-sm">
                  {summary.period}
                </span>
              </div>

              <!-- Summary Preview -->
              <div class="flex-1">
                <Markdown content={summary.summary} classes="text-base-content/80 prose-sm text-sm" />
              </div>

              <!-- Compact Metrics Display -->
              <CompactMetricsDisplay type="journal" sourceId={summary.id} />

              <!-- Tags -->
              {#if summary.tags && summary.tags.length > 0}
                <div class="mt-3 flex flex-wrap gap-1">
                  <TagIcon size={12} class="text-base-content/50 mt-0.5" />
                  {#each summary.tags.slice(0, 3) as tag}
                    <span class="badge badge-outline badge-xs">{tag}</span>
                  {/each}
                  {#if summary.tags.length > 3}
                    <span class="badge badge-ghost badge-xs">+{summary.tags.length - 3}</span>
                  {/if}
                </div>
              {/if}

              <!-- Footer -->
              <div class="border-base-300 mt-4 flex items-center justify-between border-t pt-3">
                <div class="text-base-content/60 flex items-center gap-1 text-xs">
                  <ClockIcon size={12} />
                  {formatDateTime(summary.createdAt)}
                </div>
                <div class="text-base-content/60 text-xs">
                  {summary.startDate} to {summary.endDate}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Load More -->
      {#if hasMore}
        <div class="mt-8 text-center">
          <button on:click={loadMore} disabled={loading} class="btn btn-outline gap-2">
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
            {/if}
            Load More Summaries
          </button>
        </div>
      {/if}

      <!-- Pagination Info -->
      {#if totalSummaries > 0}
        <div class="mt-6 text-center">
          <p class="text-base-content/60 text-sm">
            Showing {summaries.length} of {totalSummaries} summaries
          </p>
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
    -webkit-text-fill-color: transparent;
  }

  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
