<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { metricSummariesApi, metricSummariesUtils } from '$lib/api/metric-summaries';
  import type { MetricSummaryResponse } from '$lib/types/metric-summaries';
  import {
    BarChart3Icon,
    CalendarIcon,
    ArrowLeftIcon,
    ZapIcon,
    StarIcon,
    ActivityIcon,
    CheckCircleIcon,
    TrendingUpIcon,
    TagIcon,
    TrashIcon,
    LoaderIcon,
  } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  // State
  let summary: MetricSummaryResponse | null = null;
  let loading = true;
  let error: string | null = null;
  let deleting = false;

  // Get ID from route params
  $: summaryId = $page.params.id;

  onMount(async () => {
    if (summaryId) {
      await loadSummary();
    }
  });

  async function loadSummary() {
    try {
      loading = true;
      error = null;
      summary = await metricSummariesApi.getMetricSummary(summaryId);
    } catch (err) {
      console.error('Failed to load metric summary:', err);
      error = err instanceof Error ? err.message : 'Failed to load metric summary';
    } finally {
      loading = false;
    }
  }

  async function deleteSummary() {
    if (!summary || !confirm('Are you sure you want to delete this metric summary?')) {
      return;
    }

    try {
      deleting = true;
      await metricSummariesApi.deleteMetricSummary(summary.id);
      goto('/metric-summaries');
    } catch (err) {
      console.error('Failed to delete metric summary:', err);
      alert('Failed to delete metric summary');
    } finally {
      deleting = false;
    }
  }

  function goBack() {
    goto('/metric-summaries');
  }

  function getTypeBadgeClass(type: 'journal' | 'experiment'): string {
    return type === 'journal' ? 'badge-primary' : 'badge-secondary';
  }

  function getRatingColor(rating: number | null): string {
    if (!rating) return 'text-base-content/60';
    if (rating >= 4.0) return 'text-success';
    if (rating >= 3.0) return 'text-warning';
    return 'text-error';
  }
</script>

<svelte:head>
  <title>
    {summary ? `Metric Summary - ${metricSummariesUtils.formatPeriod(summary.startDate, summary.endDate)}` : 'Loading...'} - Life Quest
  </title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-6xl px-4 py-8">
    <!-- Navigation -->
    <button on:click={goBack} class="btn btn-ghost btn-sm mb-6 gap-2">
      <ArrowLeftIcon size={16} />
      Back to Summaries
    </button>

    <!-- Loading State -->
    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60 mt-4">Loading metric summary...</p>
        </div>
      </div>

      <!-- Error State -->
    {:else if error}
      <div class="card bg-error text-error-content shadow-xl">
        <div class="card-body text-center">
          <h2 class="card-title justify-center">
            <BarChart3Icon size={24} />
            Error Loading Summary
          </h2>
          <p>{error}</p>
          <div class="card-actions justify-center">
            <button on:click={loadSummary} class="btn btn-neutral">Try Again</button>
          </div>
        </div>
      </div>

      <!-- Summary Content -->
    {:else if summary}
      <div class="space-y-8">
        <!-- Header -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-center gap-3">
                <BarChart3Icon size={32} class="text-primary" />
                <div>
                  <h1 class="text-gradient text-3xl font-bold">
                    {metricSummariesUtils.formatPeriod(summary.startDate, summary.endDate)}
                  </h1>
                  <div class="mt-2 flex items-center gap-2">
                    <span class="badge {getTypeBadgeClass(summary.type)}">
                      {summary.type}
                    </span>
                    <div class="text-base-content/60 flex items-center gap-1 text-sm">
                      <CalendarIcon size={14} />
                      {summary.startDate} to {summary.endDate}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <button on:click={deleteSummary} disabled={deleting} class="btn btn-error btn-sm gap-2">
                  {#if deleting}
                    <LoaderIcon size={16} class="animate-spin" />
                  {:else}
                    <TrashIcon size={16} />
                  {/if}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Metrics Grid -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <!-- Total XP -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base-content/70 text-sm font-medium">Total XP</h3>
                  <p class="text-primary text-3xl font-bold">
                    {metricSummariesUtils.formatXp(summary.totalXp)}
                  </p>
                </div>
                <ZapIcon size={32} class="text-primary" />
              </div>
            </div>
          </div>

          <!-- Average Rating -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base-content/70 text-sm font-medium">Avg Rating</h3>
                  <p class="text-3xl font-bold {getRatingColor(summary.avgDayRating)}">
                    {summary.avgDayRating ? summary.avgDayRating.toFixed(1) : 'N/A'}
                    {#if summary.avgDayRating}
                      <span class="text-lg">{metricSummariesUtils.getRatingEmoji(summary.avgDayRating)}</span>
                    {/if}
                  </p>
                </div>
                <StarIcon size={32} class="text-warning" />
              </div>
            </div>
          </div>

          <!-- Days Logged -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base-content/70 text-sm font-medium">Days Logged</h3>
                  <p class="text-info text-3xl font-bold">{summary.daysLogged}</p>
                </div>
                <ActivityIcon size={32} class="text-info" />
              </div>
            </div>
          </div>

          <!-- Tasks Completed -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base-content/70 text-sm font-medium">Tasks Done</h3>
                  <p class="text-success text-3xl font-bold">{summary.tasksCompleted}</p>
                  <p class="text-base-content/60 text-xs">
                    ~{summary.averageTasksPerDay.toFixed(1)}/day
                  </p>
                </div>
                <CheckCircleIcon size={32} class="text-success" />
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Analytics -->
        <div class="grid gap-8 lg:grid-cols-2">
          <!-- XP by Stat -->
          {#if summary.xpByStat && Object.keys(summary.xpByStat).length > 0}
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">
                  <TrendingUpIcon size={24} />
                  XP by Character Stat
                </h2>
                <div class="space-y-3">
                  {#each metricSummariesUtils.getXpPercentages(summary.xpByStat) as stat (stat.statName)}
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="mb-1 flex items-center justify-between">
                          <span class="font-medium">{stat.statName}</span>
                          <span class="text-base-content/70 text-sm">
                            {stat.xp} XP ({stat.percentage}%)
                          </span>
                        </div>
                        <div class="bg-base-300 h-2 w-full rounded-full">
                          <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: {stat.percentage}%"></div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Tone Tags -->
          {#if summary.toneTagCounts && Object.keys(summary.toneTagCounts).length > 0}
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">
                  <TagIcon size={24} />
                  Tone Analysis
                </h2>

                {#if summary.mostCommonTone}
                  <div class="mb-4">
                    <p class="text-base-content/70 mb-2 text-sm">Most Common Tone:</p>
                    <span class="badge badge-primary badge-lg">{summary.mostCommonTone}</span>
                  </div>
                {/if}

                <div class="space-y-3">
                  {#each metricSummariesUtils.getToneTagPercentages(summary.toneTagCounts) as tone (tone.tag)}
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="mb-1 flex items-center justify-between">
                          <span class="font-medium capitalize">{tone.tag}</span>
                          <span class="text-base-content/70 text-sm">
                            {tone.count} times ({tone.percentage}%)
                          </span>
                        </div>
                        <div class="bg-base-300 h-2 w-full rounded-full">
                          <div class="bg-secondary h-2 rounded-full transition-all duration-300" style="width: {tone.percentage}%"></div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Streaks and Additional Info -->
        <div class="grid gap-8 md:grid-cols-2">
          <!-- Logging Streak -->
          {#if summary.logStreak}
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">
                  <ActivityIcon size={24} />
                  Logging Streaks
                </h2>
                <div class="grid grid-cols-2 gap-4">
                  <div class="stat">
                    <div class="stat-title">Current Streak</div>
                    <div class="stat-value text-info">{summary.logStreak.current}</div>
                    <div class="stat-desc">days</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Longest Streak</div>
                    <div class="stat-value text-success">{summary.logStreak.longest}</div>
                    <div class="stat-desc">days</div>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Summary Info -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                <CalendarIcon size={24} />
                Summary Info
              </h2>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-base-content/70">Created:</span>
                  <span>{formatDateTime(summary.createdAt)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Type:</span>
                  <span class="badge {getTypeBadgeClass(summary.type)} badge-sm">
                    {summary.type}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Period Length:</span>
                  <span>
                    {Math.ceil((new Date(summary.endDate).getTime() - new Date(summary.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Activity Rate:</span>
                  <span>
                    {Math.round(
                      (summary.daysLogged / Math.ceil((new Date(summary.endDate).getTime() - new Date(summary.startDate).getTime()) / (1000 * 60 * 60 * 24))) *
                        100,
                    )}%
                  </span>
                </div>
              </div>
            </div>
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
