<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getWeeklyAnalyses, getCurrentWeekRange, formatWeekRange, formatAnalysisType, type GetWeeklyAnalysesOptions } from '$lib/api/weekly-analyses';
  import type { WeeklyAnalysisResponse, AnalysisType } from '../../../../shared/types/weekly-analyses';
  import { ArrowRight, Calendar, TrendingUp, Target, Brain, Filter, Star } from 'lucide-svelte';
  import { formatDate as formatDateUtil } from '$lib/utils/date';

  let analyses: WeeklyAnalysisResponse[] = [];
  let loading = true;
  let error = '';
  let currentPage = 1;
  let totalItems = 0;
  let hasMore = false;

  // Filter options
  let analysisTypeFilter: AnalysisType | 'all' = 'all';
  let yearFilter: number | 'all' = 'all';

  const ITEMS_PER_PAGE = 10;

  // Get current week for "Analyze My Week" button
  const currentWeek = getCurrentWeekRange();

  async function loadAnalyses(options: GetWeeklyAnalysesOptions = {}) {
    try {
      loading = true;
      error = '';

      const response = await getWeeklyAnalyses({
        ...options,
        limit: ITEMS_PER_PAGE,
        page: currentPage,
        analysisType: analysisTypeFilter !== 'all' ? analysisTypeFilter : undefined,
        year: yearFilter !== 'all' ? yearFilter : undefined,
      });

      analyses = response.analyses || [];
      totalItems = response.total || 0;
      hasMore = response.hasMore || false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load weekly analyses';
      console.error('Error loading weekly analyses:', err);
    } finally {
      loading = false;
    }
  }

  function handleAnalyzeThisWeek() {
    goto('/weekly-analyses/generate');
  }

  function handleViewAnalysis(analysis: WeeklyAnalysisResponse) {
    goto(`/weekly-analyses/${analysis.id}`);
  }

  function handlePreviousPage() {
    if (currentPage > 1) {
      currentPage--;
      loadAnalyses();
    }
  }

  function handleNextPage() {
    if (hasMore) {
      currentPage++;
      loadAnalyses();
    }
  }

  function handleFilterChange() {
    currentPage = 1; // Reset to first page when filters change
    loadAnalyses();
  }

  // Calculate total pages for display
  $: totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Generate year options
  function getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  }

  function formatDate(dateString: string): string {
    return formatDateUtil(dateString);
  }

  function getAnalysisPreview(analysis: WeeklyAnalysisResponse): string {
    if (analysis.combinedReflection) {
      return analysis.combinedReflection.substring(0, 150) + '...';
    }
    return analysis.journalSummary?.substring(0, 150) + '...' || '';
  }

  onMount(() => {
    loadAnalyses();
  });
</script>

<svelte:head>
  <title>Period Analyses</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
        <Brain class="text-purple-600" size={32} />
        Period Analyses
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Combined insights from your journal entries and goal alignment across different time periods</p>
    </div>

    <button type="button" class="btn btn-primary flex items-center gap-2" on:click={handleAnalyzeThisWeek}>
      <TrendingUp size={20} />
      Generate Analysis
    </button>
  </div>

  <!-- Filters -->
  <div class="mb-6">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <Filter size={16} class="text-gray-500" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
      </div>

      <div class="form-control">
        <label class="label py-0">
          <span class="label-text text-xs">Type</span>
        </label>
        <select bind:value={analysisTypeFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
          <option value="all">All Types</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label py-0">
          <span class="label-text text-xs">Year</span>
        </label>
        <select bind:value={yearFilter} on:change={handleFilterChange} class="select select-bordered select-sm">
          <option value="all">All Years</option>
          {#each getYearOptions() as year}
            <option value={year}>{year}</option>
          {/each}
        </select>
      </div>

      {#if analysisTypeFilter !== 'all' || yearFilter !== 'all'}
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          on:click={() => {
            analysisTypeFilter = 'all';
            yearFilter = 'all';
            handleFilterChange();
          }}
        >
          Clear Filters
        </button>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="loading loading-spinner loading-lg text-primary"></div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {:else if analyses.length === 0}
    <!-- Empty State -->
    <div class="py-12 text-center">
      <Brain class="mx-auto mb-4 text-gray-400" size={64} />
      <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">No analyses yet</h3>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Get started by generating your first analysis to see combined insights from your journal entries and goals.
      </p>
      <button type="button" class="btn btn-primary mx-auto flex items-center gap-2" on:click={handleAnalyzeThisWeek}>
        <TrendingUp size={20} />
        Generate Analysis
      </button>
    </div>
  {:else}
    <!-- Analysis List -->
    <div class="space-y-4">
      {#each analyses as analysis}
        <div
          class="card bg-base-100 border-base-300 cursor-pointer border shadow-lg transition-shadow hover:shadow-xl"
          on:click={() => handleViewAnalysis(analysis)}
        >
          <div class="card-body">
            <div class="mb-3 flex items-start justify-between">
              <div>
                <h3 class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <Calendar size={18} class="text-purple-600" />
                  {formatWeekRange(analysis.periodStartDate, analysis.periodEndDate)}
                  <span class="badge badge-outline badge-sm ml-2">{formatAnalysisType(analysis.analysisType)}</span>
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Created {formatDate(analysis.createdAt)}
                </p>
              </div>
              <ArrowRight size={20} class="text-gray-400" />
            </div>

            <!-- Preview -->
            <p class="mb-4 text-gray-700 dark:text-gray-300">
              {getAnalysisPreview(analysis)}
            </p>

            <!-- Metrics Summary -->
            <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <TrendingUp size={16} class="text-green-600" />
                <span>{analysis.totalXpGained} XP gained</span>
              </div>
              <div class="flex items-center gap-1">
                <Target size={16} class="text-blue-600" />
                <span>{analysis.tasksCompleted} tasks completed</span>
              </div>
              {#if analysis.avgDayRating !== null}
                <div class="flex items-center gap-1">
                  <Star size={16} class="text-yellow-600" />
                  <span>{analysis.avgDayRating}/5 avg rating</span>
                </div>
              {/if}
              {#if analysis.alignmentScore !== null}
                <div class="flex items-center gap-1">
                  <Brain size={16} class="text-purple-600" />
                  <span>{analysis.alignmentScore}% goal alignment</span>
                </div>
              {/if}
            </div>

            <!-- Tags -->
            {#if analysis.journalTags && analysis.journalTags.length > 0}
              <div class="mt-3 flex flex-wrap gap-2">
                {#each analysis.journalTags.slice(0, 5) as tag}
                  <span class="badge badge-secondary badge-sm">{tag}</span>
                {/each}
                {#if analysis.journalTags.length > 5}
                  <span class="badge badge-ghost badge-sm">+{analysis.journalTags.length - 5} more</span>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="mt-8 flex items-center justify-center gap-4">
        <button type="button" class="btn btn-outline" class:btn-disabled={currentPage <= 1} on:click={handlePreviousPage}> Previous </button>

        <span class="text-gray-600 dark:text-gray-400">
          Page {currentPage} of {totalPages}
        </span>

        <button type="button" class="btn btn-outline" class:btn-disabled={!hasMore} on:click={handleNextPage}> Next </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  /* Weekly Analyses Page Styles */
</style>
