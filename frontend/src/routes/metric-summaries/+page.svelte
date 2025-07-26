<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { metricSummariesApi, metricSummariesUtils } from '$lib/api/metric-summaries';
  import type { MetricSummaryResponse, ListMetricSummariesResponse } from '$lib/types/metric-summaries';
  import {
    BarChart3Icon,
    CalendarIcon,
    PlusIcon,
    FilterIcon,
    RefreshCwIcon,
    ClockIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    StarIcon,
    ZapIcon,
    CheckCircleIcon,
    ActivityIcon,
  } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  // State
  let summaries: MetricSummaryResponse[] = [];
  let totalSummaries = 0;
  let hasMore = false;
  let loading = true;
  let error: string | null = null;

  // Filters
  let typeFilter: 'all' | 'journal' | 'experiment' = 'all';
  let sortByFilter: 'createdAt' | 'totalXp' | 'avgDayRating' | 'daysLogged' = 'createdAt';
  let sortOrderFilter: 'asc' | 'desc' = 'desc';
  let minRatingFilter: number | null = null;

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
        sortBy: sortByFilter,
        sortOrder: sortOrderFilter,
      };

      if (typeFilter !== 'all') params.type = typeFilter;
      if (minRatingFilter) params.minAvgDayRating = minRatingFilter;

      if (reset) currentPage = 0;

      const response = await metricSummariesApi.getMetricSummaries(params);

      if (reset) {
        summaries = response.summaries;
      } else {
        summaries = [...summaries, ...response.summaries];
      }

      totalSummaries = response.total;
      hasMore = response.offset + response.summaries.length < response.total;
    } catch (err) {
      console.error('Failed to load metric summaries:', err);
      error = err instanceof Error ? err.message : 'Failed to load metric summaries';
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

  function createCustomMetrics() {
    goto('/metric-summaries/generate');
  }

  function viewSummary(summary: MetricSummaryResponse) {
    goto(`/metric-summaries/${summary.id}`);
  }

  function getTypeBadgeClass(type: 'journal' | 'experiment' | 'custom'): string {
    switch (type) {
      case 'journal':
        return 'badge-primary';
      case 'experiment':
        return 'badge-secondary';
      case 'custom':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  }

  function getRatingColor(rating: number | null): string {
    if (!rating) return 'text-base-content/60';
    if (rating >= 4.0) return 'text-success';
    if (rating >= 3.0) return 'text-warning';
    return 'text-error';
  }
</script>

<svelte:head>
  <title>Metric Summaries - Life Quest</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <BarChart3Icon size={32} class="text-primary" />
          <div>
            <h1 class="text-gradient text-3xl font-bold">Metric Summaries</h1>
            <p class="text-base-content/70">
              {totalSummaries}
              {totalSummaries === 1 ? 'summary' : 'summaries'} found
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button on:click={createCustomMetrics} class="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Generate Metrics
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

            <!-- Type Filter -->
            <div class="form-control">
              <label for="type-filter" class="label py-0">
                <span class="label-text text-xs">Type</span>
              </label>
              <select id="type-filter" bind:value={typeFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
                <option value="all">All Types</option>
                <option value="journal">Journal</option>
                <option value="experiment">Experiment</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <!-- Sort By Filter -->
            <div class="form-control">
              <label for="sort-by-filter" class="label py-0">
                <span class="label-text text-xs">Sort By</span>
              </label>
              <select id="sort-by-filter" bind:value={sortByFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
                <option value="createdAt">Created Date</option>
                <option value="totalXp">Total XP</option>
                <option value="avgDayRating">Average Rating</option>
                <option value="daysLogged">Days Logged</option>
              </select>
            </div>

            <!-- Sort Order -->
            <div class="form-control">
              <label for="sort-order-filter" class="label py-0">
                <span class="label-text text-xs">Order</span>
              </label>
              <select id="sort-order-filter" bind:value={sortOrderFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <!-- Min Rating Filter -->
            <div class="form-control">
              <label for="min-rating-filter" class="label py-0">
                <span class="label-text text-xs">Min Rating</span>
              </label>
              <select id="min-rating-filter" bind:value={minRatingFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
                <option value={null}>Any Rating</option>
                <option value={4.0}>4.0+</option>
                <option value={3.5}>3.5+</option>
                <option value={3.0}>3.0+</option>
                <option value={2.5}>2.5+</option>
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
          <p class="text-base-content/60 mt-4">Loading metric summaries...</p>
        </div>
      </div>

      <!-- Error State -->
    {:else if error}
      <div class="card bg-error text-error-content shadow-xl">
        <div class="card-body text-center">
          <h2 class="card-title justify-center">
            <BarChart3Icon size={24} />
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
              <BarChart3Icon size={48} />
            </div>
          </div>
          <h2 class="mb-4 text-2xl font-bold">No Metric Summaries Yet</h2>
          <p class="text-base-content/70 mx-auto mb-6 max-w-md">Generate your first metric summary to analyze patterns in your journals and experiments.</p>
          <div class="flex flex-wrap justify-center gap-3">
            <button on:click={createCustomMetrics} class="btn btn-primary gap-2">
              <PlusIcon size={16} />
              Generate Metrics
            </button>
          </div>
        </div>
      </div>

      <!-- Summaries Grid -->
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <span class="text-sm font-medium">
                    {metricSummariesUtils.formatPeriod(summary.startDate, summary.endDate)}
                  </span>
                </div>
                <span class="badge {getTypeBadgeClass(summary.type)} badge-sm">
                  {summary.type}
                </span>
              </div>

              <!-- Key Metrics -->
              <div class="mb-4 grid grid-cols-2 gap-3">
                <!-- Total XP -->
                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-figure text-primary">
                    <ZapIcon size={20} />
                  </div>
                  <div class="stat-title text-xs">Total XP</div>
                  <div class="stat-value text-lg">{metricSummariesUtils.formatXp(summary.totalXp)}</div>
                </div>

                <!-- Average Rating -->
                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-figure text-warning">
                    <StarIcon size={20} />
                  </div>
                  <div class="stat-title text-xs">Avg Rating</div>
                  <div class="stat-value text-lg {getRatingColor(summary.avgDayRating)}">
                    {summary.avgDayRating ? summary.avgDayRating.toFixed(1) : 'N/A'}
                  </div>
                </div>

                <!-- Days Logged -->
                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-figure text-info">
                    <ActivityIcon size={20} />
                  </div>
                  <div class="stat-title text-xs">Days</div>
                  <div class="stat-value text-lg">{summary.daysLogged}</div>
                </div>

                <!-- Tasks Completed -->
                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-figure text-success">
                    <CheckCircleIcon size={20} />
                  </div>
                  <div class="stat-title text-xs">Tasks</div>
                  <div class="stat-value text-lg">{summary.tasksCompleted}</div>
                </div>
              </div>

              <!-- Most Common Tone -->
              {#if summary.mostCommonTone}
                <div class="mb-3">
                  <div class="mb-1 flex items-center gap-2">
                    <span class="text-base-content/60 text-xs">Most Common Tone:</span>
                  </div>
                  <span class="badge badge-outline badge-sm">{summary.mostCommonTone}</span>
                </div>
              {/if}

              <!-- Top XP Stat -->
              {#if summary.xpByStat && Object.keys(summary.xpByStat).length > 0}
                <div class="mb-3">
                  <div class="mb-1 flex items-center gap-2">
                    <span class="text-base-content/60 text-xs">Top XP Stat:</span>
                  </div>
                  {#each metricSummariesUtils.getXpPercentages(summary.xpByStat).slice(0, 1) as stat (stat.statName)}
                    <span class="badge badge-primary badge-sm">{stat.statName}: {stat.xp} XP</span>
                  {/each}
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
</style>
