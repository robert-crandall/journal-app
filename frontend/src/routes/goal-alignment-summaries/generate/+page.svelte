<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { goalAlignmentSummariesApi } from '$lib/api/goal-alignment-summaries';
  import type { GenerateGoalAlignmentSummaryRequest } from '$lib/types/goal-alignment-summaries';
  import { TargetIcon, CalendarIcon, ArrowLeftIcon, SparklesIcon, AlertCircleIcon, InfoIcon } from 'lucide-svelte';

  // State
  let formData: GenerateGoalAlignmentSummaryRequest = {
    startDate: '',
    endDate: '',
  };
  let generating = false;
  let error: string | null = null;

  onMount(() => {
    // Get parameters from URL if present
    const urlParams = $page.url.searchParams;
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');

    if (startDate && endDate) {
      formData = { startDate, endDate };
    } else {
      // Default to current week
      const now = new Date();
      const endDate = now.toISOString().split('T')[0];
      const startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      formData = { startDate, endDate };
    }
  });

  async function generateSummary() {
    try {
      generating = true;
      error = null;

      const summary = await goalAlignmentSummariesApi.generateSummary(formData);
      goto(`/goal-alignment-summaries/${summary.id}`);
    } catch (err) {
      console.error('Failed to generate goal alignment summary:', err);
      error = err instanceof Error ? err.message : 'Failed to generate goal alignment summary';
    } finally {
      generating = false;
    }
  }

  function goBack() {
    goto('/goal-alignment-summaries');
  }

  function fillCurrentWeek() {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    formData = { startDate, endDate };
  }

  function fillLastWeek() {
    const now = new Date();
    const endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    formData = { startDate, endDate };
  }

  function fillCurrentMonth() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    formData = { startDate, endDate };
  }

  $: isValidDateRange = formData.startDate && formData.endDate && new Date(formData.startDate) <= new Date(formData.endDate);
</script>

<svelte:head>
  <title>Generate Goal Alignment Analysis - Life Quest</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <button on:click={goBack} class="btn btn-ghost btn-sm mb-4 gap-2">
        <ArrowLeftIcon size={16} />
        Back to Summaries
      </button>

      <div class="flex items-center gap-3">
        <TargetIcon size={32} class="text-primary" />
        <div>
          <h1 class="text-gradient text-3xl font-bold">Generate Goal Alignment Analysis</h1>
          <p class="text-base-content/70">Analyze how well your journal entries align with your active goals over a specific period</p>
        </div>
      </div>
    </div>

    <!-- Info Card -->
    <div class="alert alert-info mb-6">
      <InfoIcon size={20} />
      <div>
        <h3 class="text-base font-bold">How Goal Alignment Analysis Works</h3>
        <p class="text-sm">
          This feature analyzes your journal entries against your active goals, providing insights into: • Which goals you're making progress on • Goals that
          need more attention • Specific evidence from your journals • Actionable next steps
        </p>
      </div>
    </div>

    <!-- Form -->
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-6">
          <CalendarIcon size={24} />
          Select Date Range
        </h2>

        <!-- Quick Date Range Buttons -->
        <div class="mb-6">
          <div class="text-base-content/70 mb-2 text-sm font-medium">Quick Select:</div>
          <div class="flex flex-wrap gap-2">
            <button type="button" on:click={fillCurrentWeek} class="btn btn-outline btn-sm"> Current Week </button>
            <button type="button" on:click={fillLastWeek} class="btn btn-outline btn-sm"> Last Week </button>
            <button type="button" on:click={fillCurrentMonth} class="btn btn-outline btn-sm"> Current Month </button>
          </div>
        </div>

        <!-- Date Inputs -->
        <div class="grid gap-4 md:grid-cols-2">
          <div class="form-control">
            <label class="label" for="start-date">
              <span class="label-text">Start Date</span>
            </label>
            <input id="start-date" type="date" bind:value={formData.startDate} class="input input-bordered" required />
          </div>

          <div class="form-control">
            <label class="label" for="end-date">
              <span class="label-text">End Date</span>
            </label>
            <input id="end-date" type="date" bind:value={formData.endDate} class="input input-bordered" required />
          </div>
        </div>

        <!-- Date Range Validation -->
        {#if formData.startDate && formData.endDate && !isValidDateRange}
          <div class="alert alert-warning mt-4">
            <AlertCircleIcon size={20} />
            <span>End date must be after start date</span>
          </div>
        {/if}

        <!-- Requirements Info -->
        <div class="mt-6">
          <div class="alert alert-info">
            <InfoIcon size={20} />
            <div class="text-sm">
              <strong>Requirements:</strong>
              <ul class="mt-1 list-inside list-disc">
                <li>At least one completed journal entry in the selected period</li>
                <li>At least one active goal in your account</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        {#if error}
          <div class="alert alert-error mt-4">
            <AlertCircleIcon size={20} />
            <span>{error}</span>
          </div>
        {/if}

        <!-- Actions -->
        <div class="card-actions mt-6 justify-end">
          <button type="button" on:click={goBack} class="btn btn-ghost"> Cancel </button>
          <button type="button" on:click={generateSummary} disabled={!isValidDateRange || generating} class="btn btn-primary gap-2">
            {#if generating}
              <span class="loading loading-spinner loading-sm"></span>
              Analyzing...
            {:else}
              <SparklesIcon size={16} />
              Generate Analysis
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="mt-6 text-center">
      <p class="text-base-content/60 text-sm">
        Analysis typically takes 10-30 seconds to complete and will include detailed insights about your goal alignment.
      </p>
    </div>
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
