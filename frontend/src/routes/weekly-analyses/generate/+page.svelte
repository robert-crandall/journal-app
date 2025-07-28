<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    generateWeeklyAnalysis,
    getCurrentWeekRange,
    getCurrentMonthRange,
    getCurrentQuarterRange,
    getCustomDateRange,
    formatWeekRange,
    formatAnalysisType,
    getDateRangeForType,
  } from '$lib/api/weekly-analyses';
  import type { GenerateWeeklyAnalysisRequest, AnalysisType } from '../../../../../shared/types/weekly-analyses';
  import { ArrowLeft, Brain, TrendingUp, Calendar, Loader2 } from 'lucide-svelte';

  let generating = false;
  let error = '';

  // Analysis type and date range
  let analysisType: AnalysisType = 'weekly';
  let dateRangeType: 'current' | 'custom' = 'current';
  let customStartDate = '';
  let customEndDate = '';

  // Form state
  let includeJournalSummary = true;
  let includeGoalAlignment = true;
  let includeMetrics = true;
  let customPrompt = '';

  // Get current date range based on analysis type
  $: currentRange = getDateRangeForType(analysisType);
  $: effectiveRange = dateRangeType === 'custom' && customStartDate && customEndDate ? getCustomDateRange(customStartDate, customEndDate) : currentRange;

  async function handleGenerate() {
    if (!includeJournalSummary && !includeGoalAlignment && !includeMetrics) {
      error = 'Please select at least one analysis type';
      return;
    }

    if (dateRangeType === 'custom' && (!customStartDate || !customEndDate)) {
      error = 'Please provide both start and end dates for custom range';
      return;
    }

    if (dateRangeType === 'custom' && customStartDate >= customEndDate) {
      error = 'End date must be after start date';
      return;
    }

    try {
      generating = true;
      error = '';

      const request: GenerateWeeklyAnalysisRequest = {
        analysisType,
        startDate: effectiveRange.startDate,
        endDate: effectiveRange.endDate,
      };

      const response = await generateWeeklyAnalysis(request);

      // Navigate to the generated analysis
      goto(`/weekly-analyses/${response.id}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to generate analysis';
      console.error('Error generating analysis:', err);
    } finally {
      generating = false;
    }
  }

  function handleBack() {
    goto('/weekly-analyses');
  }

  // Update current week on mount
  onMount(() => {
    // Set default custom dates to current week
    const current = getCurrentWeekRange();
    customStartDate = current.startDate;
    customEndDate = current.endDate;
  });
</script>

<svelte:head>
  <title>Generate Analysis</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <button type="button" class="btn btn-ghost btn-sm" on:click={handleBack} disabled={generating}>
      <ArrowLeft size={16} />
      Back
    </button>

    <div>
      <h1 class="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
        <Brain class="text-purple-600" size={32} />
        Generate Analysis
      </h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Create insights from your journal entries and goal progress</p>
    </div>
  </div>

  <!-- Analysis Configuration Form -->
  <div class="card bg-base-100 border-base-300 border shadow-lg">
    <div class="card-body">
      <h2 class="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
        <TrendingUp size={20} class="text-purple-600" />
        Configure Your Analysis
      </h2>

      {#if error}
        <div class="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <!-- Analysis Type and Date Range -->
      <div class="mb-6 space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- Analysis Type -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Analysis Type</span>
            </label>
            <select bind:value={analysisType} class="select select-bordered" disabled={generating}>
              <option value="weekly">Weekly Analysis</option>
              <option value="monthly">Monthly Analysis</option>
              <option value="quarterly">Quarterly Analysis</option>
            </select>
          </div>

          <!-- Date Range Type -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Date Range</span>
            </label>
            <select bind:value={dateRangeType} class="select select-bordered" disabled={generating}>
              <option value="current">Current {formatAnalysisType(analysisType)}</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        <!-- Custom Date Range -->
        {#if dateRangeType === 'custom'}
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Start Date</span>
              </label>
              <input type="date" class="input input-bordered" bind:value={customStartDate} disabled={generating} />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">End Date</span>
              </label>
              <input type="date" class="input input-bordered" bind:value={customEndDate} disabled={generating} />
            </div>
          </div>
        {/if}

        <!-- Date Range Display -->
        <div class="alert alert-info">
          <Calendar size={16} />
          <span>Analyzing: {formatWeekRange(effectiveRange.startDate, effectiveRange.endDate)}</span>
        </div>
      </div>

      <!-- What to Include -->
      <div class="mb-6 space-y-4">
        <h3 class="font-medium text-gray-900 dark:text-white">What would you like to include?</h3>
        <div class="form-control">
          <label class="label cursor-pointer">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-primary" bind:checked={includeJournalSummary} disabled={generating} />
              <div>
                <span class="label-text font-medium">Journal Summary</span>
                <p class="text-sm text-gray-500 dark:text-gray-400">Analyze themes, patterns, and insights from your journal entries this week</p>
              </div>
            </div>
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-primary" bind:checked={includeGoalAlignment} disabled={generating} />
              <div>
                <span class="label-text font-medium">Goal Alignment</span>
                <p class="text-sm text-gray-500 dark:text-gray-400">Review progress toward your goals and identify alignment opportunities</p>
              </div>
            </div>
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="checkbox checkbox-primary" bind:checked={includeMetrics} disabled={generating} />
              <div>
                <span class="label-text font-medium">Weekly Metrics</span>
                <p class="text-sm text-gray-500 dark:text-gray-400">Summarize XP gained, tasks completed, and other measurable progress</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Custom Prompt -->
      <div class="form-control mb-6">
        <label class="label">
          <span class="label-text font-medium">Custom Focus (Optional)</span>
        </label>
        <textarea
          class="textarea textarea-bordered w-full"
          placeholder="Add any specific areas you'd like the analysis to focus on or questions you'd like answered..."
          rows="3"
          bind:value={customPrompt}
          disabled={generating}
        ></textarea>
        <label class="label">
          <span class="label-text-alt text-gray-500"> This will be included in the AI prompt to customize your analysis </span>
        </label>
      </div>

      <!-- Generate Button -->
      <div class="flex justify-end gap-3">
        <button type="button" class="btn btn-ghost" on:click={handleBack} disabled={generating}> Cancel </button>

        <button
          type="button"
          class="btn btn-primary"
          on:click={handleGenerate}
          disabled={generating || (!includeJournalSummary && !includeGoalAlignment && !includeMetrics)}
        >
          {#if generating}
            <Loader2 size={16} class="animate-spin" />
            Analyzing...
          {:else}
            <Brain size={16} />
            Generate Analysis
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Information Card -->
  <div class="card bg-base-200 mt-6">
    <div class="card-body">
      <h3 class="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        <Calendar size={18} class="text-blue-600" />
        About {formatAnalysisType(analysisType)} Analysis
      </h3>
      <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>
          • <strong>Journal Summary:</strong> Uses AI to identify key themes, emotional patterns, and insights from your journal entries
        </p>
        <p>
          • <strong>Goal Alignment:</strong> Analyzes how your activities and focus align with your stated goals
        </p>
        <p>
          • <strong>Metrics:</strong> Provides quantitative summary of your XP, completed tasks, and progress indicators
        </p>
        <p class="mt-3 text-xs opacity-80">
          Analysis typically takes 30-60 seconds to complete and will combine all selected components into a unified insight for the selected period.
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Generate Weekly Analysis Page Styles */
</style>
