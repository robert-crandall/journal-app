<script lang="ts">
  import type { JournalListItem } from '$lib/types/journal';
  import { goto } from '$app/navigation';

  export let journals: JournalListItem[] = [];

  // Calculate the last 365 days for the heatmap
  function getLast365Days(): Array<{ date: string; dayOfWeek: number; weekOfYear: number }> {
    const days = [];
    const today = new Date();

    for (let i = 364; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const weekOfYear = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

      days.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek,
        weekOfYear,
      });
    }

    return days;
  }

  // Create a map of dates to journal data for quick lookup
  $: journalMap = new Map(journals.map((journal) => [journal.date, journal]));

  // Get the activity level for a given date
  function getActivityLevel(date: string): number {
    const journal = journalMap.get(date);
    if (!journal) return 0;

    // Activity levels: 0 = no journal, 1 = draft, 2 = in_review, 3 = complete
    switch (journal.status) {
      case 'complete':
        return 3;
      case 'in_review':
        return 2;
      case 'draft':
        return 1;
      default:
        return 0;
    }
  }

  // Get the CSS class for activity level
  function getActivityClass(level: number): string {
    switch (level) {
      case 3:
        return 'bg-success opacity-100';
      case 2:
        return 'bg-warning opacity-75';
      case 1:
        return 'bg-primary opacity-50';
      default:
        return 'bg-base-300';
    }
  }

  // Get tooltip text for a date
  function getTooltipText(date: string): string {
    const journal = journalMap.get(date);
    if (!journal) {
      return `${date}: No entry`;
    }

    const statusText = journal.status === 'complete' ? 'Complete' : journal.status === 'in_review' ? 'In Review' : 'Draft';

    return `${date}: ${journal.title || 'Journal Entry'} (${statusText})`;
  }

  // Handle clicking on a date
  function handleDateClick(date: string) {
    goto(`/journal/${date}`);
  }

  // Get month labels for the current view
  function getMonthLabels(): Array<{ month: string; position: number }> {
    const labels = [];
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const weekPosition = Math.floor((today.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));

      if (weekPosition >= 0 && weekPosition <= 52) {
        labels.push({
          month: months[date.getMonth()],
          position: Math.max(0, 52 - weekPosition),
        });
      }
    }

    return labels.slice(-6); // Show last 6 month labels to avoid crowding
  }

  // Since these functions don't depend on reactive variables, we can call them directly
  const days = getLast365Days();
  const monthLabels = getMonthLabels();

  // Group days by week for display
  const weekGroups = days.reduce(
    (weeks, day) => {
      const weekKey = Math.floor((364 - days.findIndex((d) => d.date === day.date)) / 7);
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(day);
      return weeks;
    },
    {} as Record<number, typeof days>,
  );
</script>

<div class="heatmap-container">
  <!-- Month labels -->
  <div class="text-base-content/60 mb-2 flex justify-between text-xs">
    {#each monthLabels as label (label.month)}
      <span>{label.month}</span>
    {/each}
  </div>

  <!-- Heatmap grid -->
  <div class="heatmap-grid">
    <!-- Day of week labels -->
    <div class="day-labels">
      <div class="day-label"></div>
      <div class="day-label text-xs">Mon</div>
      <div class="day-label"></div>
      <div class="day-label text-xs">Wed</div>
      <div class="day-label"></div>
      <div class="day-label text-xs">Fri</div>
      <div class="day-label"></div>
    </div>

    <!-- Activity squares -->
    <div class="activity-grid">
      {#each Object.values(weekGroups) as week (week[0]?.date)}
        <div class="week-column">
          {#each Array(7) as _, dayIndex}
            {@const day = week.find((d) => d.dayOfWeek === dayIndex)}
            {#if day}
              {@const level = getActivityLevel(day.date)}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div class="activity-square {getActivityClass(level)}" title={getTooltipText(day.date)} on:click={() => handleDateClick(day.date)}></div>
            {:else}
              <div class="activity-square bg-transparent"></div>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- Legend -->
  <div class="text-base-content/60 mt-4 flex items-center justify-between text-xs">
    <span>Less</span>
    <div class="flex items-center gap-1">
      <div class="activity-square bg-base-300"></div>
      <div class="activity-square bg-primary opacity-50"></div>
      <div class="activity-square bg-warning opacity-75"></div>
      <div class="activity-square bg-success opacity-100"></div>
    </div>
    <span>More</span>
  </div>
</div>

<style>
  .heatmap-container {
    max-width: 100%;
    overflow-x: auto;
  }

  .heatmap-grid {
    display: flex;
    gap: 3px;
    min-width: 700px;
  }

  .day-labels {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-right: 8px;
  }

  .day-label {
    height: 11px;
    display: flex;
    align-items: center;
    color: rgb(107 114 126 / 0.6);
    font-size: 10px;
  }

  .activity-grid {
    display: flex;
    gap: 2px;
    flex: 1;
  }

  .week-column {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .activity-square {
    width: 11px;
    height: 11px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .activity-square:hover {
    transform: scale(1.2);
    z-index: 10;
    position: relative;
  }
</style>
