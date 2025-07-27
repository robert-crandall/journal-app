<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { goalAlignmentSummariesApi, goalAlignmentSummariesUtils } from '$lib/api/goal-alignment-summaries';
  import type { GoalAlignmentSummaryResponse, ListGoalAlignmentSummariesResponse } from '$lib/types/goal-alignment-summaries';
  import { TargetIcon, CalendarIcon, PlusIcon, FilterIcon, RefreshCwIcon, ClockIcon, ChevronRightIcon, TrendingUpIcon } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';
  import Markdown from '$lib/components/common/Markdown.svelte';

  // State
  let summaries: GoalAlignmentSummaryResponse[] = [];
  let totalSummaries = 0;
  let hasMore = false;
  let loading = true;
  let error: string | null = null;

  // Filters
  let yearFilter: number | null = null;

  // Pagination
  const ITEMS_PER_PAGE = 12;
  let currentPage = 0;

  onMount(async () => {
    await loadSummaries();
  });

  async function loadSummaries() {
    try {
      loading = true;
      error = null;
      const response = await goalAlignmentSummariesApi.getSummaries({ limit: 20, offset: 0 });
      summaries = response.summaries;
      totalSummaries = response.total;
      hasMore = response.hasMore;
    } catch (err) {
      console.error('Failed to load goal alignment summaries:', err);
      error = err instanceof Error ? err.message : 'Failed to load goal alignment summaries';
    } finally {
      loading = false;
    }
  }

  async function handleFilterChange() {
    await loadSummaries();
  }

  async function loadMore() {
    if (!hasMore || loading) return;
    currentPage++;
    await loadSummaries();
  }

  function createWeeklySummary() {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    goto(`/goal-alignment-summaries/generate?startDate=${startDate}&endDate=${endDate}`);
  }

  function viewSummary(summary: GoalAlignmentSummaryResponse) {
    goto(`/goal-alignment-summaries/${summary.id}`);
  }

  function getAlignmentScoreClass(score: number | null): string {
    if (score === null) return 'text-base-content/50';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  }

  function getAlignmentScoreText(score: number | null): string {
    if (score === null) return 'No Score';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
  }

  // Get current year and a few previous years for filter
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
</script>

<svelte:head>
  <title>Goal Alignment Summaries - Life Quest</title>
</svelte:head>

<!-- Action Buttons -->
<div class="mb-6 flex justify-end">
  <button on:click={createWeeklySummary} class="btn btn-primary gap-2">
    <PlusIcon size={16} />
    New Analysis
  </button>
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

        <!-- Year Filter -->
        <div class="form-control">
          <label class="label py-0" for="year-filter">
            <span class="label-text text-xs">Year</span>
          </label>
          <select id="year-filter" bind:value={yearFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
            <option value={null}>All Years</option>
            {#each availableYears as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </div>

        <button on:click={() => loadSummaries()} class="btn btn-ghost btn-sm gap-2">
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
      <p class="text-base-content/60 mt-4">Loading goal alignment summaries...</p>
    </div>
  </div>

  <!-- Error State -->
{:else if error}
  <div class="card bg-error text-error-content shadow-xl">
    <div class="card-body text-center">
      <h2 class="card-title justify-center">
        <TargetIcon size={24} />
        Error Loading Summaries
      </h2>
      <p>{error}</p>
      <div class="card-actions justify-center">
        <button on:click={() => loadSummaries()} class="btn btn-neutral">Try Again</button>
      </div>
    </div>
  </div>

  <!-- Empty State -->
{:else if summaries.length === 0}
  <div class="card bg-base-200">
    <div class="card-body py-20 text-center">
      <div class="avatar placeholder mb-6">
        <div class="bg-base-300 text-base-content w-24 rounded-full">
          <TargetIcon size={48} />
        </div>
      </div>
      <h2 class="mb-4 text-2xl font-bold">No Goal Alignment Analysis Yet</h2>
      <p class="text-base-content/70 mx-auto mb-6 max-w-md">
        Create your first goal alignment analysis to understand how well your daily activities align with your goals.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button on:click={createWeeklySummary} class="btn btn-primary gap-2">
          <PlusIcon size={16} />
          Create Analysis
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
                {summary.periodStartDate} to {summary.periodEndDate}
              </span>
            </div>
            {#if summary.alignmentScore !== null}
              <div class="flex items-center gap-2">
                <TrendingUpIcon size={16} class={getAlignmentScoreClass(summary.alignmentScore)} />
                <span class="badge badge-outline badge-sm {getAlignmentScoreClass(summary.alignmentScore)}">
                  {summary.alignmentScore}% - {getAlignmentScoreText(summary.alignmentScore)}
                </span>
              </div>
            {:else}
              <span class="badge badge-ghost badge-sm">No Score</span>
            {/if}
          </div>

          <!-- Summary Preview -->
          <div class="flex-1">
            <Markdown content={summary.summary.slice(0, 200) + (summary.summary.length > 200 ? '...' : '')} classes="text-base-content/80 text-sm" />
          </div>

          <!-- Goals Status -->
          <div class="mt-3 grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-success text-2xl font-bold">{summary.alignedGoals.length}</div>
              <div class="text-base-content/60 text-xs">Aligned Goals</div>
            </div>
            <div class="text-center">
              <div class="text-warning text-2xl font-bold">{summary.neglectedGoals.length}</div>
              <div class="text-base-content/60 text-xs">Neglected Goals</div>
            </div>
          </div>

          <!-- Next Steps Preview -->
          {#if summary.suggestedNextSteps && summary.suggestedNextSteps.length > 0}
            <div class="mt-3">
              <div class="text-base-content/70 mb-1 text-xs font-medium">Next Steps:</div>
              <div class="text-base-content/60 text-xs">
                • {summary.suggestedNextSteps[0]}
                {#if summary.suggestedNextSteps.length > 1}
                  <span class="text-base-content/40"> and {summary.suggestedNextSteps.length - 1} more</span>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Footer -->
          <div class="border-base-300 mt-4 flex items-center justify-between border-t pt-3">
            <div class="text-base-content/60 flex items-center gap-1 text-xs">
              <ClockIcon size={12} />
              {formatDateTime(summary.createdAt)}
            </div>
            <ChevronRightIcon size={16} class="text-base-content/40" />
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

  <!-- Summary Info -->
  {#if totalSummaries > 0}
    <div class="mt-6 text-center">
      <p class="text-base-content/60 text-sm">
        Showing {summaries.length} summaries
      </p>
    </div>
  {/if}
{/if}
