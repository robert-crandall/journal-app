<script lang="ts">
  import { onMount } from 'svelte';
  import { metricSummariesApi } from '$lib/api/metric-summaries';
  import type { MetricSummaryResponse } from '$lib/types/metric-summaries';
  import { Star, Zap, TrendingUp } from 'lucide-svelte';

  interface Props {
    type: 'journal' | 'experiment';
    sourceId: string;
  }

  let { type, sourceId }: Props = $props();

  let metrics: MetricSummaryResponse | null = $state(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

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

  // Get top stat by XP
  function getTopStat() {
    if (!metrics?.xpByStat) return null;
    
    const entries = Object.entries(metrics.xpByStat);
    if (entries.length === 0) return null;
    
    return entries.reduce((max, [stat, xp]) => 
      xp > max.xp ? { stat, xp } : max, 
      { stat: entries[0][0], xp: entries[0][1] }
    );
  }
</script>

{#if loading}
  <div class="border-base-200 border-t pt-3">
    <div class="flex items-center gap-2 text-xs text-base-content/40">
      <span class="loading loading-spinner loading-xs"></span>
      Loading metrics...
    </div>
  </div>
{:else if error}
  <div class="border-base-200 border-t pt-3">
    <div class="text-xs text-error">
      Failed to load metrics
    </div>
  </div>
{:else if metrics}
  <div class="border-base-200 border-t pt-3">
    <div class="flex items-center justify-between gap-4 text-xs">
      <!-- Average Rating -->
      {#if metrics.avgDayRating !== null}
        <div class="flex items-center gap-1">
          <Star class="h-3 w-3 text-warning" />
          <span class="text-base-content/60">
            {metrics.avgDayRating.toFixed(1)}/5
          </span>
        </div>
      {/if}

      <!-- Total XP -->
      <div class="flex items-center gap-1">
        <Zap class="h-3 w-3 text-accent" />
        <span class="text-base-content/60">
          {metrics.totalXp} XP
        </span>
      </div>

      <!-- Top Stat -->
      {#if getTopStat()}
        <div class="flex items-center gap-1">
          <TrendingUp class="h-3 w-3 text-success" />
          <span class="text-base-content/60">
            {getTopStat()?.stat}: {getTopStat()?.xp}
          </span>
        </div>
      {/if}
    </div>
  </div>
{/if}
