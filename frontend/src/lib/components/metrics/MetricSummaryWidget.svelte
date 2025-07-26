<script lang="ts">
  import { onMount } from 'svelte';
  import { metricSummariesApi, metricSummariesUtils } from '$lib/api/metric-summaries';
  import type { MetricSummaryResponse } from '$lib/types/metric-summaries';
  import {
    BarChart3Icon,
    ZapIcon,
    StarIcon,
    ActivityIcon,
    CheckCircleIcon,
    TrendingUpIcon,
    TagIcon,
    LoaderIcon,
    AlertCircleIcon,
    RefreshCwIcon,
  } from 'lucide-svelte';

  // Props
  export let type: 'journal' | 'experiment';
  export let sourceId: string;
  export let title: string = 'Metrics Summary';

  // State
  let metrics: MetricSummaryResponse | null = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadMetrics();
  });

  async function loadMetrics() {
    try {
      loading = true;
      error = null;
      metrics = await metricSummariesApi.fetchOrGenerateMetrics(type, sourceId);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      error = err instanceof Error ? err.message : 'Failed to load metrics';
    } finally {
      loading = false;
    }
  }

  function getRatingColor(rating: number | null): string {
    if (!rating) return 'text-base-content/60';
    if (rating >= 4.0) return 'text-success';
    if (rating >= 3.0) return 'text-warning';
    return 'text-error';
  }

  function getTopToneTags(toneTagCounts: Record<string, number>): Array<{ tag: string; count: number }> {
    return Object.entries(toneTagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  function getTopStats(xpByStat: Record<string, number>): Array<{ stat: string; xp: number }> {
    return Object.entries(xpByStat)
      .map(([stat, xp]) => ({ stat, xp }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 3);
  }
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <div class="mb-4 flex items-center gap-3">
      <BarChart3Icon size={24} class="text-primary" />
      <h3 class="text-xl font-bold">{title}</h3>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-8">
        <LoaderIcon size={24} class="text-primary animate-spin" />
        <span class="text-base-content/70 ml-2">Loading metrics...</span>
      </div>
    {:else if error}
      <div class="flex flex-col items-center justify-center py-8">
        <AlertCircleIcon size={24} class="text-error mb-2" />
        <p class="text-error mb-4 text-center">{error}</p>
        <button on:click={loadMetrics} class="btn btn-outline btn-sm">
          <RefreshCwIcon size={16} />
          Retry
        </button>
      </div>
    {:else if metrics}
      <!-- Period Info -->
      <div class="mb-6">
        <p class="text-base-content/70 text-sm">
          {metricSummariesUtils.formatPeriod(metrics.startDate, metrics.endDate)}
        </p>
      </div>

      <!-- Key Metrics Grid -->
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <!-- Total XP -->
        <div class="stat bg-base-200 rounded-lg p-3">
          <div class="stat-figure text-primary">
            <ZapIcon size={20} />
          </div>
          <div class="stat-value text-lg">{metrics.totalXp.toLocaleString()}</div>
          <div class="stat-title text-xs">Total XP</div>
        </div>

        <!-- Average Day Rating -->
        <div class="stat bg-base-200 rounded-lg p-3">
          <div class="stat-figure {getRatingColor(metrics.avgDayRating)}">
            <StarIcon size={20} />
          </div>
          <div class="stat-value text-lg {getRatingColor(metrics.avgDayRating)}">
            {metrics.avgDayRating ? metrics.avgDayRating.toFixed(1) : 'N/A'}
          </div>
          <div class="stat-title text-xs">Avg Rating</div>
        </div>

        <!-- Days Logged -->
        <div class="stat bg-base-200 rounded-lg p-3">
          <div class="stat-figure text-info">
            <ActivityIcon size={20} />
          </div>
          <div class="stat-value text-lg">{metrics.daysLogged}</div>
          <div class="stat-title text-xs">Days Logged</div>
        </div>

        <!-- Tasks Completed -->
        <div class="stat bg-base-200 rounded-lg p-3">
          <div class="stat-figure text-success">
            <CheckCircleIcon size={20} />
          </div>
          <div class="stat-value text-lg">{metrics.tasksCompleted}</div>
          <div class="stat-title text-xs">Tasks Done</div>
        </div>
      </div>

      <!-- Detailed Metrics -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Top Stats by XP -->
        {#if metrics.xpByStat && Object.keys(metrics.xpByStat).length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <TrendingUpIcon size={16} class="text-success" />
              <h4 class="font-semibold">Top Stats</h4>
            </div>
            <div class="space-y-2">
              {#each getTopStats(metrics.xpByStat) as { stat, xp }}
                <div class="bg-base-200 flex items-center justify-between rounded p-2">
                  <span class="text-sm capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div class="flex items-center gap-1">
                    <ZapIcon size={12} class="text-warning" />
                    <span class="text-sm font-medium">{xp}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Top Tone Tags -->
        {#if metrics.toneTagCounts && Object.keys(metrics.toneTagCounts).length > 0}
          <div>
            <div class="mb-3 flex items-center gap-2">
              <TagIcon size={16} class="text-info" />
              <h4 class="font-semibold">Mood Patterns</h4>
            </div>
            <div class="space-y-2">
              {#each getTopToneTags(metrics.toneTagCounts) as { tag, count }}
                <div class="bg-base-200 flex items-center justify-between rounded p-2">
                  <span class="text-sm capitalize">{tag}</span>
                  <span class="badge badge-outline badge-sm">{count}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Additional Stats -->
      {#if metrics.averageTasksPerDay || metrics.logStreak}
        <div class="divider"></div>
        <div class="grid grid-cols-2 gap-4">
          {#if metrics.averageTasksPerDay}
            <div class="text-center">
              <div class="text-primary text-lg font-bold">{metrics.averageTasksPerDay.toFixed(1)}</div>
              <div class="text-base-content/70 text-xs">Tasks/Day</div>
            </div>
          {/if}
          {#if metrics.logStreak}
            <div class="text-center">
              <div class="text-success text-lg font-bold">{metrics.logStreak.current} / {metrics.logStreak.longest}</div>
              <div class="text-base-content/70 text-xs">Log Streak</div>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>
