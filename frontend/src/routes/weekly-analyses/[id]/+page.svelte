<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getWeeklyAnalysis, formatWeekRange } from '$lib/api/weekly-analyses';
  import type { WeeklyAnalysisResponse } from '../../../../../shared/types/weekly-analyses';
  import { ArrowLeft, Calendar, TrendingUp, Target, Brain, BookOpen, BarChart3, Users, ImageIcon, Star } from 'lucide-svelte';
  import { formatDate as formatDateUtil } from '$lib/utils/date';
  import { PhotoService } from '$lib/api/photos';

  let analysis: WeeklyAnalysisResponse | null = null;
  let loading = true;
  let error = '';

  $: analysisId = $page.params.id;

  async function loadAnalysis() {
    if (!analysisId) {
      error = 'Analysis ID is required';
      loading = false;
      return;
    }

    try {
      loading = true;
      error = '';
      analysis = await getWeeklyAnalysis(analysisId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load weekly analysis';
      console.error('Error loading weekly analysis:', err);
    } finally {
      loading = false;
    }
  }

  function handleBack() {
    goto('/weekly-analyses');
  }

  function formatDate(dateString: string): string {
    return formatDateUtil(dateString);
  }

  function formatPercentage(value: number | null): string {
    return value !== null ? `${value}%` : 'N/A';
  }

  onMount(() => {
    loadAnalysis();
  });

  // Reactive update when route params change
  $: {
    if (analysisId) {
      loadAnalysis();
    }
  }
</script>

<svelte:head>
  <title>
    {analysis ? `Weekly Analysis - ${formatWeekRange(analysis.periodStartDate, analysis.periodEndDate)}` : 'Weekly Analysis'}
  </title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <button type="button" class="btn btn-ghost btn-sm" on:click={handleBack}>
      <ArrowLeft size={16} />
      Back to Analyses
    </button>
  </div>

  {#if loading}
    <!-- Loading State -->
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
  {:else if analysis}
    <!-- Analysis Content -->
    <div class="space-y-8">
      <!-- Title & Meta -->
      <div class="text-center">
        <h1 class="mb-2 flex items-center justify-center gap-3 text-4xl font-bold text-gray-900 dark:text-white">
          <Brain class="text-purple-600" size={36} />
          Weekly Analysis
        </h1>
        <p class="mb-2 text-xl text-gray-600 dark:text-gray-400">
          {formatWeekRange(analysis.periodStartDate, analysis.periodEndDate)}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Generated {formatDate(analysis.createdAt)}
        </p>
      </div>

      <!-- Combined Reflection (if available) -->
      {#if analysis.combinedReflection}
        <div
          class="card border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg dark:border-purple-700 dark:from-purple-900/20 dark:to-blue-900/20"
        >
          <div class="card-body">
            <h2 class="mb-4 flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white">
              <Brain class="text-purple-600" size={24} />
              Weekly Insights
            </h2>
            <div class="prose prose-gray dark:prose-invert max-w-none">
              {#each analysis.combinedReflection.split('\n\n') as paragraph}
                <p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
                  {paragraph}
                </p>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Metrics Section -->
      <div class="card bg-base-100 border-base-300 border shadow-lg">
        <div class="card-body">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <BarChart3 class="text-blue-600" size={20} />
            Weekly Metrics
          </h3>

          <div class="space-y-4">
            <!-- Key Metrics -->
            <div class="grid gap-4" class:grid-cols-2={analysis.avgDayRating === null} class:grid-cols-3={analysis.avgDayRating !== null}>
              <div class="stat-item">
                <div class="stat-value text-green-600">{analysis.totalXpGained}</div>
                <div class="stat-label">XP Gained</div>
              </div>
              <div class="stat-item">
                <div class="stat-value text-blue-600">{analysis.tasksCompleted}</div>
                <div class="stat-label">Tasks Done</div>
              </div>
              {#if analysis.avgDayRating !== null}
                <div class="stat-item">
                  <div class="stat-value flex items-center gap-1 text-yellow-600">
                    <Star size={20} />
                    {analysis.avgDayRating}
                  </div>
                  <div class="stat-label">Avg Rating</div>
                </div>
              {/if}
            </div>

            <!-- Additional Metrics -->
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Goal Alignment:</span>
                <span class="font-medium">{formatPercentage(analysis.alignmentScore)}</span>
              </div>
              {#if analysis.toneFrequency && analysis.toneFrequency.length > 0}
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Primary Tone:</span>
                  <span class="font-medium capitalize">{analysis.toneFrequency[0].tone}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Two-Column Layout -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Journal Summary Section -->
        {#if analysis.journalSummary}
          <div class="card bg-base-100 border-base-300 border shadow-lg">
            <div class="card-body">
              <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <BookOpen class="text-green-600" size={20} />
                Journal Summary
              </h3>

              <div class="space-y-4 text-sm">
                <div class="prose prose-sm prose-gray dark:prose-invert">
                  {#each analysis.journalSummary.split('\n\n') as paragraph}
                    <p class="mb-3 text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  {/each}
                </div>

                {#if analysis.journalTags && analysis.journalTags.length > 0}
                  <div>
                    <h4 class="mb-2 font-medium text-gray-900 dark:text-white">Key Themes</h4>
                    <div class="flex flex-wrap gap-2">
                      {#each analysis.journalTags as tag}
                        <span class="badge badge-secondary badge-sm">{tag}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Goal Alignment Section -->
        {#if analysis.goalAlignmentSummary}
          <div class="card bg-base-100 border-base-300 border shadow-lg">
            <div class="card-body">
              <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Target class="text-orange-600" size={20} />
                Goal Alignment
              </h3>

              <div class="space-y-4 text-sm">
                <div class="prose prose-sm prose-gray dark:prose-invert">
                  {#each analysis.goalAlignmentSummary.split('\n\n') as paragraph}
                    <p class="mb-3 text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  {/each}
                </div>

                {#if analysis.alignmentScore !== null}
                  <div class="mt-4">
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Alignment Score</span>
                      <span class="text-sm font-bold text-orange-600">{analysis.alignmentScore}%</span>
                    </div>
                    <div class="h-2 w-full rounded-full bg-gray-200">
                      <div class="h-2 rounded-full bg-orange-600 transition-all duration-300" style="width: {analysis.alignmentScore}%"></div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Action Items (if available) -->
      {#if analysis.suggestedNextSteps && analysis.suggestedNextSteps.length > 0}
        <div class="card border border-yellow-200 bg-yellow-50 shadow-lg dark:border-yellow-700 dark:bg-yellow-900/20">
          <div class="card-body">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <TrendingUp class="text-yellow-600" size={20} />
              Suggested Next Steps
            </h3>
            <ul class="space-y-2">
              {#each analysis.suggestedNextSteps as item}
                <li class="flex items-start gap-3">
                  <div class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-600"></div>
                  <span class="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/if}

      <!-- Photos Section -->
      {#if analysis.photos && analysis.photos.length > 0}
        <div class="card bg-base-100 border-base-300 border shadow-lg">
          <div class="card-body">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <ImageIcon class="text-info" size={20} />
              Photos from this period ({analysis.photos.length})
            </h3>

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {#each analysis.photos as photo}
                <div class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  <img
                    src={PhotoService.getThumbnailUrl(photo.thumbnailPath)}
                    alt={photo.caption || `Photo from ${photo.journalDate}`}
                    class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />

                  <!-- Photo overlay with date -->
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  >
                    <div class="absolute right-2 bottom-2 left-2">
                      <div class="text-xs font-medium text-white">
                        {formatDate(photo.journalDate)}
                      </div>
                      {#if photo.caption}
                        <div class="truncate text-xs text-white/90">
                          {photo.caption}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Click to view full size -->
                  <button
                    class="absolute inset-0 z-10 bg-transparent"
                    on:click={() => window.open(PhotoService.getPhotoUrl(photo.filePath), '_blank')}
                    title={photo.caption || `View photo from ${photo.journalDate}`}
                  >
                    <span class="sr-only">View full size photo</span>
                  </button>
                </div>
              {/each}
            </div>

            <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">These photos were attached to journal entries during this analysis period.</p>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .btn {
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: colors 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-ghost {
    color: #374151;
  }

  .btn-ghost:hover {
    background-color: #f3f4f6;
  }

  .btn-sm {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
  }

  .card {
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .card-body {
    padding: 0;
  }

  .badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 9999px;
    font-weight: 500;
  }

  .badge-secondary {
    background-color: #f3e8ff;
    color: #7c2d12;
  }

  .badge-sm {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .alert {
    padding: 1rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .alert-error {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .prose {
    max-width: none;
  }

  .prose p {
    margin-bottom: 1rem;
    line-height: 1.625;
  }
</style>
