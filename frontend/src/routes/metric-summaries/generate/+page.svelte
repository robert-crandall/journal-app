<script lang="ts">
  import { goto } from '$app/navigation';
  import { metricSummariesApi } from '$lib/api/metric-summaries';
  import type { MetricSummaryFormData } from '$lib/types/metric-summaries';
  import { BarChart3Icon, CalendarIcon, LoaderIcon, CheckIcon, ArrowLeftIcon } from 'lucide-svelte';
  import { formatDateTime, formatDate } from '$lib/utils/date';

  // Form state
  let formData: MetricSummaryFormData = {
    startDate: '',
    endDate: '',
  };

  let loading = false;
  let error: string | null = null;
  let success = false;

  // Set default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  formData.endDate = formatDateTime(today, 'yyyy-mm-dd');
  formData.startDate = formatDateTime(thirtyDaysAgo, 'yyyy-mm-dd');

  async function handleSubmit() {
    if (!formData.startDate || !formData.endDate) {
      error = 'Please select both start and end dates';
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      error = 'Start date must be before end date';
      return;
    }

    try {
      loading = true;
      error = null;

      const result = await metricSummariesApi.generateMetrics({
        startDate: formData.startDate,
        endDate: formData.endDate,
      });

      success = true;

      // Redirect to the generated summary after a brief delay
      setTimeout(() => {
        goto(`/metric-summaries/${result.id}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to generate metrics:', err);
      error = err instanceof Error ? err.message : 'Failed to generate metrics';
    } finally {
      loading = false;
    }
  }

  function goBack() {
    goto('/metric-summaries');
  }

  // Quick date presets
  function setDateRange(days: number) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days);

    formData.endDate = formatDateTime(end, 'yyyy-mm-dd');
    formData.startDate = formatDateTime(start, 'yyyy-mm-dd');
  }

  function setWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Saturday = 0 days back

    const saturday = new Date(today);
    saturday.setDate(today.getDate() - daysToSubtract);

    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);

    formData.startDate = formatDateTime(saturday, 'yyyy-mm-dd');
    formData.endDate = formatDateTime(friday, 'yyyy-mm-dd');
  }

  function setMonthRange() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    formData.startDate = formatDateTime(firstDay, 'yyyy-mm-dd');
    formData.endDate = formatDateTime(lastDay, 'yyyy-mm-dd');
  }
</script>

<svelte:head>
  <title>Generate Metrics - Life Quest</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-2xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <button on:click={goBack} class="btn btn-ghost btn-sm mb-4 gap-2">
        <ArrowLeftIcon size={16} />
        Back to Summaries
      </button>

      <div class="flex items-center gap-3">
        <BarChart3Icon size={32} class="text-primary" />
        <div>
          <h1 class="text-gradient text-3xl font-bold">Generate Metrics</h1>
          <p class="text-base-content/70">Analyze your data for a specific time period</p>
        </div>
      </div>
    </div>

    <!-- Success State -->
    {#if success}
      <div class="card bg-success text-success-content shadow-xl">
        <div class="card-body text-center">
          <div class="avatar placeholder mb-4">
            <div class="bg-success text-success-content w-16 rounded-full">
              <CheckIcon size={32} />
            </div>
          </div>
          <h2 class="card-title justify-center">Metrics Generated Successfully!</h2>
          <p>Your metric summary has been created and you'll be redirected shortly.</p>
        </div>
      </div>
    {:else}
      <!-- Form -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-6">
            <CalendarIcon size={24} />
            Select Date Range
          </h2>

          <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            <!-- Quick Presets -->
            <div>
              <div class="label">
                <span class="label-text font-medium">Quick Presets</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" on:click={() => setDateRange(7)} class="btn btn-outline btn-sm"> Last 7 Days </button>
                <button type="button" on:click={() => setDateRange(14)} class="btn btn-outline btn-sm"> Last 14 Days </button>
                <button type="button" on:click={() => setDateRange(30)} class="btn btn-outline btn-sm"> Last 30 Days </button>
                <button type="button" on:click={setWeekRange} class="btn btn-outline btn-sm"> This Week </button>
                <button type="button" on:click={setMonthRange} class="btn btn-outline btn-sm"> This Month </button>
              </div>
            </div>

            <!-- Date Inputs -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <!-- Period Info -->
            {#if formData.startDate && formData.endDate}
              {#each [{ start: new Date(formData.startDate), end: new Date(formData.endDate) }] as dates (dates.start.getTime())}
                {#if dates.start < dates.end}
                  <div class="alert alert-info">
                    <div class="flex items-center gap-2">
                      <CalendarIcon size={16} />
                      <span>
                        Analyzing {Math.ceil((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24))} days from {dates.start.toLocaleDateString()}
                        to {dates.end.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}

            <!-- Error Display -->
            {#if error}
              <div class="alert alert-error">
                <span>{error}</span>
              </div>
            {/if}

            <!-- Submit Button -->
            <div class="card-actions justify-end">
              <button type="submit" disabled={loading || !formData.startDate || !formData.endDate} class="btn btn-primary gap-2">
                {#if loading}
                  <LoaderIcon size={16} class="animate-spin" />
                  Generating...
                {:else}
                  <BarChart3Icon size={16} />
                  Generate Metrics
                {/if}
              </button>
            </div>
          </form>

          <!-- Info -->
          <div class="bg-base-200 mt-6 rounded-lg p-4">
            <h3 class="mb-2 font-medium">What metrics will be generated?</h3>
            <ul class="text-base-content/70 list-inside list-disc space-y-1 text-sm">
              <li>Total XP earned from all sources</li>
              <li>Average day ratings from journals</li>
              <li>Days logged and activity patterns</li>
              <li>Tasks completed and daily averages</li>
              <li>Tone tag analysis from journals</li>
              <li>XP breakdown by character stats</li>
              <li>Logging streaks and consistency</li>
            </ul>
          </div>
        </div>
      </div>
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
