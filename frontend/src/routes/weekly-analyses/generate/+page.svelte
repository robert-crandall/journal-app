<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { generateWeeklyAnalysis, getCurrentWeekRange, formatWeekRange } from '$lib/api/weekly-analyses';
  import type { GenerateWeeklyAnalysisRequest } from '../../../../../shared/types/weekly-analyses';
  import { ArrowLeft, Brain, TrendingUp, Calendar, Loader2 } from 'lucide-svelte';

  let generating = false;
  let error = '';
  let currentWeek = getCurrentWeekRange();

  // Form state
  let includeJournalSummary = true;
  let includeGoalAlignment = true;
  let includeMetrics = true;
  let customPrompt = '';

  async function handleGenerate() {
    if (!includeJournalSummary && !includeGoalAlignment && !includeMetrics) {
      error = 'Please select at least one analysis type';
      return;
    }

    try {
      generating = true;
      error = '';

      const request: GenerateWeeklyAnalysisRequest = {
        startDate: currentWeek.startDate,
        endDate: currentWeek.endDate,
      };

      const response = await generateWeeklyAnalysis(request);

      // Navigate to the generated analysis
      goto(`/weekly-analyses/${response.id}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to generate weekly analysis';
      console.error('Error generating weekly analysis:', err);
    } finally {
      generating = false;
    }
  }

  function handleBack() {
    goto('/weekly-analyses');
  }

  // Update current week on mount
  onMount(() => {
    currentWeek = getCurrentWeekRange();
  });
</script>

<svelte:head>
  <title>Analyze My Week</title>
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
        Analyze My Week
      </h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">
        {formatWeekRange(currentWeek.startDate, currentWeek.endDate)}
      </p>
    </div>
  </div>

  <!-- Analysis Configuration Form -->
  <div class="card bg-base-100 border-base-300 border shadow-lg">
    <div class="card-body">
      <h2 class="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
        <TrendingUp size={20} class="text-purple-600" />
        What would you like to analyze?
      </h2>

      {#if error}
        <div class="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <!-- Analysis Type Selection -->
      <div class="mb-6 space-y-4">
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
        About Weekly Analysis
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
          Analysis typically takes 30-60 seconds to complete and will combine all selected components into a unified weekly insight.
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Generate Weekly Analysis Page Styles */
</style>
