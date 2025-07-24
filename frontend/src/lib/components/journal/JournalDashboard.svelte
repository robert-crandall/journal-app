<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { JournalService } from '$lib/api/journal';
  import type { JournalListItem, ListJournalsResponse } from '$lib/types/journal';
  import JournalHeatmap from '$lib/components/journal/JournalHeatmap.svelte';
  import ToneTagsDisplay from '$lib/components/journal/ToneTagsDisplay.svelte';
  import { BookOpenIcon, CalendarDaysIcon, ListIcon, PlusIcon, SparklesIcon } from 'lucide-svelte';
  import { getTodayDateString, formatDate } from '$lib/utils/date';

  let loading = true;
  let error: string | null = null;
  let journalData: ListJournalsResponse | null = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  onMount(async () => {
    await loadJournals();
  });

  async function loadJournals() {
    try {
      loading = true;
      error = null;

      // Get journal entries from the last 3 months
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);

      const dateFrom = formatDateToYYYYMMDD(threeMonthsAgo);
      const dateTo = formatDateToYYYYMMDD(today);

      journalData = await JournalService.listJournals({
        dateFrom,
        dateTo,
        limit: 100,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load journals';
    } finally {
      loading = false;
    }
  }

  function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function goToCreateJournal() {
    const today = getTodayDateString();
    goto(`/journal/${today}`);
  }

  function goToJournalsList() {
    goto('/journals');
  }

  function goToSummaries() {
    goto('/journal-summaries');
  }

  $: journals = journalData?.journals || [];
  $: completedJournals = journals.filter((j) => j.status === 'complete');

  // Calculate average rating
  $: journalsWithRatings = completedJournals.filter((j) => j.dayRating !== null || j.inferredDayRating !== null);
  $: averageRating =
    journalsWithRatings.length > 0
      ? journalsWithRatings.reduce((sum, j) => sum + (j.dayRating !== null ? j.dayRating : j.inferredDayRating || 0), 0) / journalsWithRatings.length
      : null;

  // Get the best and worst days
  $: journalsSortedByRating = [...journalsWithRatings].sort((a, b) => {
    const ratingA = a.dayRating !== null ? a.dayRating : a.inferredDayRating || 0;
    const ratingB = b.dayRating !== null ? b.dayRating : b.inferredDayRating || 0;
    return ratingB - ratingA;
  });
  $: bestDay = journalsSortedByRating[0] || null;
  $: worstDay = journalsSortedByRating[journalsSortedByRating.length - 1] || null;

  // Calculate tone tag statistics
  $: toneTagCounts = completedJournals
    .filter((j) => j.toneTags && j.toneTags.length > 0)
    .reduce(
      (acc, journal) => {
        journal.toneTags?.forEach((tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

  $: mostCommonToneTags = Object.entries(toneTagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag: tag as any, count }));

  $: journalsWithToneTags = completedJournals.filter((j) => j.toneTags && j.toneTags.length > 0).length;
</script>

<div class="space-y-6" data-test-id="journal-dashboard">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <BookOpenIcon size={32} class="text-primary" />
      <h1 class="text-gradient text-3xl font-bold">Journal Dashboard</h1>
    </div>

    <div class="flex gap-2">
      <button class="btn btn-ghost btn-sm" on:click={goToSummaries}>
        <SparklesIcon size={16} />
        <span class="hidden sm:inline">Summaries</span>
      </button>
      <button class="btn btn-ghost btn-sm" on:click={goToJournalsList}>
        <ListIcon size={16} />
        <span class="hidden sm:inline">All Entries</span>
      </button>
      <button class="btn btn-primary btn-sm" on:click={goToCreateJournal}>
        <PlusIcon size={16} />
        <span class="hidden sm:inline">New Entry</span>
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error State -->
  {:else if error}
    <div class="alert alert-error">
      <span>{error}</span>
      <button class="btn btn-sm" on:click={loadJournals}>Retry</button>
    </div>

    <!-- Content -->
  {:else}
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <!-- Total Entries -->
      <div class="card bg-base-100 border-base-300 border shadow-sm">
        <div class="card-body p-4">
          <h3 class="text-base-content/70 card-title text-sm">Total Entries</h3>
          <p class="mt-2 text-3xl font-bold">{journals.length}</p>
          <div class="text-base-content/60 mt-1 text-xs">
            {completedJournals.length} completed
          </div>
        </div>
      </div>

      <!-- Average Rating -->
      <div class="card bg-base-100 border-base-300 border shadow-sm">
        <div class="card-body p-4">
          <h3 class="text-base-content/70 card-title text-sm">Average Rating</h3>
          <p class="mt-2 text-3xl font-bold">
            {averageRating !== null ? averageRating.toFixed(1) : '-'}
          </p>
          <div class="text-base-content/60 mt-1 text-xs">
            From {journalsWithRatings.length} rated entries
          </div>
        </div>
      </div>

      <!-- Best Day -->
      <div class="card bg-base-100 border-base-300 border shadow-sm">
        <div class="card-body p-4">
          <h3 class="text-base-content/70 card-title text-sm">Best Day</h3>
          {#if bestDay}
            <p class="mt-2 text-2xl font-bold">
              {formatDate(bestDay.date)}
            </p>
            <div class="text-base-content/60 mt-1 text-xs">
              Rating: {bestDay.dayRating || bestDay.inferredDayRating}
              {bestDay.dayRating ? '' : ' (estimated)'}
            </div>
          {:else}
            <p class="mt-2 text-2xl font-bold">-</p>
            <div class="text-base-content/60 mt-1 text-xs">No rated entries yet</div>
          {/if}
        </div>
      </div>

      <!-- Worst Day -->
      <div class="card bg-base-100 border-base-300 border shadow-sm">
        <div class="card-body p-4">
          <h3 class="text-base-content/70 card-title text-sm">Most Challenging Day</h3>
          {#if worstDay}
            <p class="mt-2 text-2xl font-bold">
              {formatDate(worstDay.date)}
            </p>
            <div class="text-base-content/60 mt-1 text-xs">
              Rating: {worstDay.dayRating || worstDay.inferredDayRating}
              {worstDay.dayRating ? '' : ' (estimated)'}
            </div>
          {:else}
            <p class="mt-2 text-2xl font-bold">-</p>
            <div class="text-base-content/60 mt-1 text-xs">No rated entries yet</div>
          {/if}
        </div>
      </div>

      <!-- Emotional Insights -->
      <div class="card bg-base-100 border-base-300 border shadow-sm">
        <div class="card-body p-4">
          <h3 class="text-base-content/70 card-title text-sm">Emotional Insights</h3>
          {#if mostCommonToneTags.length > 0}
            <div class="mt-2 space-y-1">
              <ToneTagsDisplay toneTags={mostCommonToneTags.map((t) => t.tag)} size="xs" showLabels={false} />
            </div>
            <div class="text-base-content/60 mt-1 text-xs">
              From {journalsWithToneTags} analyzed entries
            </div>
          {:else}
            <p class="mt-2 text-2xl font-bold">-</p>
            <div class="text-base-content/60 mt-1 text-xs">No emotional analysis yet</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <JournalHeatmap {journals} bind:month={currentMonth} bind:year={currentYear} />

    <!-- Recent Entries -->
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CalendarDaysIcon size={24} class="text-secondary" />
          <span>Recent Entries</span>
        </h3>

        {#if journals.length === 0}
          <div class="alert">
            <span>No journal entries found. Start writing today!</span>
            <button class="btn btn-sm btn-primary" on:click={goToCreateJournal}>Create Entry</button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="table-zebra table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Mood</th>
                  <th>Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {#each journals.slice(0, 5) as journal (journal.id)}
                  <tr class="hover cursor-pointer" on:click={() => goto(`/journal/${journal.date}`)}>
                    <td>{formatDate(journal.date)}</td>
                    <td>{journal.title || 'Untitled'}</td>
                    <td>
                      {#if journal.toneTags && journal.toneTags.length > 0}
                        <ToneTagsDisplay toneTags={journal.toneTags} size="xs" showLabels={false} maxDisplay={2} />
                      {:else}
                        <span class="text-base-content/50">-</span>
                      {/if}
                    </td>
                    <td>
                      {#if journal.dayRating !== null}
                        <span class="badge">{journal.dayRating}</span>
                      {:else if journal.inferredDayRating !== null}
                        <span class="badge badge-outline">{journal.inferredDayRating}*</span>
                      {:else}
                        -
                      {/if}
                    </td>
                    <td>
                      <span
                        class="badge
                        {journal.status === 'complete' ? 'badge-success' : journal.status === 'in_review' ? 'badge-warning' : 'badge-ghost'}"
                      >
                        {journal.status === 'complete' ? 'Complete' : journal.status === 'in_review' ? 'In Review' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if journals.length > 5}
            <div class="card-actions mt-4 justify-end">
              <button class="btn btn-ghost btn-sm" on:click={goToJournalsList}> View All Entries </button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .text-gradient {
    background: linear-gradient(to right, oklch(0.637 0.237 25.331), oklch(0.637 0.237 330));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
</style>
