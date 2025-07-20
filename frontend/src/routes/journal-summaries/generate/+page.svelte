<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { journalSummariesApi, journalSummariesUtils } from '$lib/api/journal-summaries';
  import type { GenerateJournalSummaryFormData } from '$lib/types/journal-summaries';
  import { BookOpenIcon, CalendarIcon, ArrowLeftIcon, SparklesIcon, SaveIcon, ClockIcon } from 'lucide-svelte';

  // State
  let formData: GenerateJournalSummaryFormData = {
    period: 'week',
    startDate: '',
    endDate: '',
  };
  let generating = false;
  let error: string | null = null;

  onMount(() => {
    // Get parameters from URL if present
    const urlParams = $page.url.searchParams;
    const period = urlParams.get('period') as 'week' | 'month' | null;
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');

    if (period && startDate && endDate) {
      formData = { period, startDate, endDate };
    } else {
      // Default to current week
      const boundaries = journalSummariesUtils.getCurrentWeekBoundaries();
      formData = {
        ...formData,
        startDate: boundaries.startDate,
        endDate: boundaries.endDate,
      };
    }
  });

  async function generateSummary() {
    try {
      generating = true;
      error = null;

      const summary = await journalSummariesApi.generateJournalSummary(formData);
      goto(`/journal-summaries/${summary.id}`);
    } catch (err) {
      console.error('Failed to generate summary:', err);
      error = err instanceof Error ? err.message : 'Failed to generate summary';
    } finally {
      generating = false;
    }
  }

  function goBack() {
    goto('/journal-summaries');
  }

  function handlePeriodChange() {
    // Update date boundaries when period changes
    const now = new Date();
    if (formData.period === 'week') {
      const boundaries = journalSummariesUtils.getWeekBoundaries(now);
      formData = {
        ...formData,
        startDate: boundaries.startDate,
        endDate: boundaries.endDate,
      };
    } else {
      const boundaries = journalSummariesUtils.getMonthBoundaries(now);
      formData = {
        ...formData,
        startDate: boundaries.startDate,
        endDate: boundaries.endDate,
      };
    }
  }

  function setCurrentPeriod() {
    handlePeriodChange();
  }

  function setPreviousPeriod() {
    const startDate = new Date(formData.startDate);
    let previousDate: Date;

    if (formData.period === 'week') {
      previousDate = new Date(startDate);
      previousDate.setDate(startDate.getDate() - 7);
      const boundaries = journalSummariesUtils.getWeekBoundaries(previousDate);
      formData = {
        ...formData,
        startDate: boundaries.startDate,
        endDate: boundaries.endDate,
      };
    } else {
      previousDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
      const boundaries = journalSummariesUtils.getMonthBoundaries(previousDate);
      formData = {
        ...formData,
        startDate: boundaries.startDate,
        endDate: boundaries.endDate,
      };
    }
  }

  $: isFormValid = Boolean(formData.startDate && formData.endDate && formData.period) && !generating;

  $: periodLabel = formData.period === 'week' ? 'Weekly' : 'Monthly';
  $: dateRangeLabel =
    formData.startDate && formData.endDate ? journalSummariesUtils.formatPeriod(formData.period, formData.startDate, formData.endDate) : 'Select dates';
</script>

<svelte:head>
  <title>Generate Journal Summary - Life Quest</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-2xl px-4 py-8">
    <!-- Breadcrumb -->
    <div class="breadcrumbs mb-6 text-sm">
      <ul>
        <li>
          <button on:click={goBack} class="text-primary hover:text-primary-focus"> Journal Summaries </button>
        </li>
        <li class="text-base-content/60">Generate New Summary</li>
      </ul>
    </div>

    <!-- Header -->
    <div class="mb-8 text-center">
      <div class="mb-4 flex items-center justify-center gap-3">
        <SparklesIcon size={32} class="text-primary" />
        <h1 class="text-3xl font-bold">Generate Summary</h1>
      </div>
      <p class="text-base-content/70">Create an AI-generated summary of your journal entries for a specific time period</p>
    </div>

    <!-- Form -->
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <form on:submit|preventDefault={generateSummary} class="space-y-6">
          <!-- Period Selection -->
          <div class="form-control">
            <span class="label-text mb-2 block font-medium">Summary Period</span>
            <div class="flex gap-4">
              <label class="label cursor-pointer">
                <input type="radio" bind:group={formData.period} value="week" on:change={handlePeriodChange} class="radio radio-primary" />
                <span class="label-text ml-2">Weekly</span>
              </label>
              <label class="label cursor-pointer">
                <input type="radio" bind:group={formData.period} value="month" on:change={handlePeriodChange} class="radio radio-secondary" />
                <span class="label-text ml-2">Monthly</span>
              </label>
            </div>
          </div>

          <!-- Date Range Preview -->
          <div class="alert alert-info">
            <CalendarIcon size={20} />
            <div>
              <h4 class="font-medium">{periodLabel} Summary</h4>
              <p class="text-sm opacity-75">{dateRangeLabel}</p>
            </div>
          </div>

          <!-- Date Range Inputs -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label for="start-date" class="label">
                <span class="label-text">Start Date</span>
              </label>
              <input id="start-date" type="date" bind:value={formData.startDate} class="input input-bordered" required />
            </div>
            <div class="form-control">
              <label for="end-date" class="label">
                <span class="label-text">End Date</span>
              </label>
              <input id="end-date" type="date" bind:value={formData.endDate} class="input input-bordered" required />
            </div>
          </div>

          <!-- Quick Date Presets -->
          <div class="form-control">
            <span class="label-text mb-2 block">Quick Presets</span>
            <div class="flex flex-wrap gap-2">
              <button type="button" on:click={setCurrentPeriod} class="btn btn-outline btn-sm">
                Current {formData.period === 'week' ? 'Week' : 'Month'}
              </button>
              <button type="button" on:click={setPreviousPeriod} class="btn btn-outline btn-sm">
                Previous {formData.period === 'week' ? 'Week' : 'Month'}
              </button>
            </div>
          </div>

          <!-- Error Message -->
          {#if error}
            <div class="alert alert-error">
              <span>{error}</span>
            </div>
          {/if}

          <!-- Info Box -->
          <div class="alert">
            <BookOpenIcon size={20} />
            <div>
              <h4 class="font-medium">How it works</h4>
              <p class="text-sm opacity-75">
                We'll analyze all your completed journal entries from the selected period and create a cohesive summary highlighting key themes, patterns, and
                insights.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-3 sm:flex-row-reverse">
            <button type="submit" disabled={!isFormValid} class="btn btn-primary flex-1 gap-2 sm:flex-none">
              {#if generating}
                <span class="loading loading-spinner loading-sm"></span>
                Generating...
              {:else}
                <SparklesIcon size={16} />
                Generate Summary
              {/if}
            </button>
            <button type="button" on:click={goBack} class="btn btn-outline flex-1 sm:flex-none" disabled={generating}>
              <ArrowLeftIcon size={16} />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="mt-8 text-center">
      <div class="text-base-content/60 text-sm">
        <ClockIcon size={14} class="mr-1 inline" />
        Summary generation typically takes 10-30 seconds
      </div>
    </div>
  </div>
</div>
