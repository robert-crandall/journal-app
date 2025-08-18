<script lang="ts">
  import { onMount } from 'svelte';
  import { timeframeExportApi } from '$lib/api/timeframe-export';
  import { formatDateTime } from '$lib/utils/date';
  import Markdown from '$lib/components/common/Markdown.svelte';
  import { CalendarIcon, DownloadIcon, SettingsIcon, EyeIcon } from 'lucide-svelte';
  import type { TimeframeExportOptions, TimeframeExportResponse } from '../../../../shared/types/timeframe-export';

  // Form data
  let formData = {
    startDate: '',
    endDate: '',
    options: {
      includeDailyEntries: true,
      includeWeeklyAnalyses: true,
      includeMonthlyAnalyses: true,
      includeGoals: true,
      includePlans: true,
      includeQuests: true,
      includeExperiments: true,
    } as TimeframeExportOptions,
  };

  // UI state
  let isGenerating = false;
  let exportResult: TimeframeExportResponse | null = null;
  let showPreview = false;
  let error = '';

  // Initialize with default date range (last 30 days)
  onMount(() => {
    setDateRange(30);
  });

  // Date range presets
  function setDateRange(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    formData.endDate = formatDateTime(end, 'yyyy-mm-dd');
    formData.startDate = formatDateTime(start, 'yyyy-mm-dd');
  }

  function setWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Saturday = 0 days back

    const saturday = new Date();
    saturday.setDate(today.getDate() - daysToSubtract);

    const friday = new Date();
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

  // Toggle all options
  function toggleAllOptions(enabled: boolean) {
    formData.options = {
      includeDailyEntries: enabled,
      includeWeeklyAnalyses: enabled,
      includeMonthlyAnalyses: enabled,
      includeGoals: enabled,
      includePlans: enabled,
      includeQuests: enabled,
      includeExperiments: enabled,
    };
  }

  // Generate export
  async function generateExport() {
    if (!formData.startDate || !formData.endDate) {
      error = 'Please select both start and end dates';
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      error = 'Start date must be before end date';
      return;
    }

    try {
      isGenerating = true;
      error = '';
      exportResult = null;

      const result = await timeframeExportApi.generateExport({
        startDate: formData.startDate,
        endDate: formData.endDate,
        options: formData.options,
      });

      exportResult = result;
      showPreview = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to generate export';
    } finally {
      isGenerating = false;
    }
  }

  // Copy to clipboard
  async function copyToClipboard() {
    if (!exportResult) return;

    try {
      await navigator.clipboard.writeText(exportResult.markdownContent);
      // Could add a toast notification here
      alert('Content copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please select and copy manually.');
    }
  }

  // Download as file
  function downloadAsFile() {
    if (!exportResult) return;

    const blob = new Blob([exportResult.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-summary-${exportResult.dateRange.startDate}-to-${exportResult.dateRange.endDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Timeframe Summary Export</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-4">
  <div class="mb-8">
    <h1 class="mb-2 text-3xl font-bold">Timeframe Summary Export</h1>
    <p class="text-base-content/70">
      Generate a comprehensive summary document of your journal entries, analyses, goals, plans, quests, and experiments for any date range. Perfect for feeding
      into external LLMs for insights and recommendations.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
    <!-- Configuration Panel -->
    <div class="card border-base-300 bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <SettingsIcon size={20} />
          Export Configuration
        </h2>

        <!-- Date Range Selection -->
        <div class="mb-6">
          <h3 class="mb-3 text-lg font-semibold">Date Range</h3>

          <!-- Quick Presets -->
          <div class="mb-4">
            <div class="label">
              <span class="label-text font-medium">Quick Presets</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" on:click={() => setDateRange(7)} class="btn btn-outline btn-sm"> Last 7 Days </button>
              <button type="button" on:click={() => setDateRange(14)} class="btn btn-outline btn-sm"> Last 14 Days </button>
              <button type="button" on:click={() => setDateRange(30)} class="btn btn-outline btn-sm"> Last 30 Days </button>
              <button type="button" on:click={() => setDateRange(90)} class="btn btn-outline btn-sm"> Last 90 Days </button>
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
              {#if dates.start <= dates.end}
                <div class="alert alert-info mt-4">
                  <div class="flex items-center gap-2">
                    <CalendarIcon size={16} />
                    <span>
                      Period: {Math.ceil((dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </span>
                  </div>
                </div>
              {:else}
                <div class="alert alert-error mt-4">
                  <span>Start date must be before end date</span>
                </div>
              {/if}
            {/each}
          {/if}
        </div>

        <!-- Content Selection -->
        <div class="mb-6">
          <h3 class="mb-3 text-lg font-semibold">Content to Include</h3>

          <div class="mb-4 flex gap-2">
            <button type="button" on:click={() => toggleAllOptions(true)} class="btn btn-outline btn-sm"> Select All </button>
            <button type="button" on:click={() => toggleAllOptions(false)} class="btn btn-outline btn-sm"> Select None </button>
          </div>

          <div class="space-y-3">
            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" bind:checked={formData.options.includeDailyEntries} class="checkbox" />
              <div>
                <span class="label-text font-medium">Daily Entries</span>
                <div class="text-base-content/70 text-sm">Concatenated journal entries with summaries and ratings</div>
              </div>
            </label>

            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" bind:checked={formData.options.includeWeeklyAnalyses} class="checkbox" />
              <div>
                <span class="label-text font-medium">Weekly Analyses</span>
                <div class="text-base-content/70 text-sm">Generated and manual weekly reflections</div>
              </div>
            </label>

            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" bind:checked={formData.options.includeMonthlyAnalyses} class="checkbox" />
              <div>
                <span class="label-text font-medium">Monthly Analyses</span>
                <div class="text-base-content/70 text-sm">Generated and manual monthly reflections</div>
              </div>
            </label>

            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" bind:checked={formData.options.includeGoals} class="checkbox" />
              <div>
                <span class="label-text font-medium">Goals</span>
                <div class="text-base-content/70 text-sm">Active, completed, and archived goals</div>
              </div>
            </label>

            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" bind:checked={formData.options.includePlans} class="checkbox" />
              <div>
                <span class="label-text font-medium">Plans</span>
                <div class="text-base-content/70 text-sm">Current and past plans with subtasks</div>
              </div>
            </label>

            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" bind:checked={formData.options.includeQuests} class="checkbox" />
              <div>
                <span class="label-text font-medium">Quests</span>
                <div class="text-base-content/70 text-sm">Start/end criteria, progress notes, and linked journal entries</div>
              </div>
            </label>

            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" bind:checked={formData.options.includeExperiments} class="checkbox" />
              <div>
                <span class="label-text font-medium">Experiments</span>
                <div class="text-base-content/70 text-sm">Setup, tasks, reflections, and results</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Generate Button -->
        <div class="card-actions">
          <button type="button" on:click={generateExport} disabled={isGenerating || !formData.startDate || !formData.endDate} class="btn btn-primary w-full">
            {#if isGenerating}
              <span class="loading loading-spinner loading-sm"></span>
              Generating...
            {:else}
              <EyeIcon size={16} />
              Generate Preview
            {/if}
          </button>
        </div>

        <!-- Error Display -->
        {#if error}
          <div class="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Preview Panel -->
    <div class="card border-base-300 bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <EyeIcon size={20} />
          Preview & Export
        </h2>

        {#if exportResult}
          <!-- Export Actions -->
          <div class="mb-4 flex flex-wrap gap-2">
            <button type="button" on:click={copyToClipboard} class="btn btn-outline btn-sm">
              <DownloadIcon size={16} />
              Copy to Clipboard
            </button>
            <button type="button" on:click={downloadAsFile} class="btn btn-outline btn-sm">
              <DownloadIcon size={16} />
              Download as File
            </button>
          </div>

          <!-- Export Info -->
          <div class="text-base-content/70 mb-4 space-y-2 text-sm">
            <div>
              <strong>Generated:</strong>
              {new Date(exportResult.generatedAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Date Range:</strong>
              {exportResult.dateRange.startDate} to {exportResult.dateRange.endDate}
            </div>
            <div>
              <strong>Sections:</strong>
              {exportResult.sectionsIncluded.join(', ')}
            </div>
          </div>

          <!-- Preview Content -->
          <div class="border-base-300 bg-base-50 max-h-96 overflow-y-auto border p-4">
            <Markdown content={exportResult.markdownContent} classes="prose-sm max-w-none" />
          </div>
        {:else}
          <div class="text-base-content/50 flex h-64 flex-col items-center justify-center">
            <EyeIcon size={48} class="mb-4" />
            <p class="text-center">Configure your export settings and click "Generate Preview" to see your summary document.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
