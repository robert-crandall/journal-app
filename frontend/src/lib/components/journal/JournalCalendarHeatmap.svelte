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
  function getActivityLevel(date: string, journalMap: Map<string, any>): number {
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

  // Get the rating level for a given date
  function getRatingLevel(date: string, journalMap: Map<string, any>): number {
    const journal = journalMap.get(date);
    if (!journal) return 0;

    // Rating levels: 0 = no journal, 1 = draft, 2 = in_review, 3 = complete
    return journal.dayRating || journal.inferredDayRating || 0;
  }

  function getRatingColor(rating: number | null): string {
    if (!rating) return 'bg-base-200';

    // Color progression from red (bad) to green (excellent)
    switch (rating) {
      case 1:
        return 'bg-error opacity-75'; // Red for poor days
      case 2:
        return 'bg-warning opacity-75'; // Orange/yellow for below average
      case 3:
        return 'bg-info opacity-75'; // Blue for neutral/average
      case 4:
        return 'bg-accent opacity-80'; // Purple/teal for good days
      case 5:
        return 'bg-success opacity-100'; // Green for excellent days
      default:
        return 'bg-base-200';
    }
  }

  // Get tooltip text for a date
  function getTooltipText(date: string, journalMap: Map<string, any>): string {
    const journal = journalMap.get(date);
    if (!journal) {
      return `${date}: No entry`;
    }

    const statusText = journal.status === 'complete' ? 'Complete' : journal.status === 'in_review' ? 'In Review' : 'Draft';
    const rating = journal.dayRating || journal.inferredDayRating;
    const ratingText = rating ? ` - Rating: ${rating}/5` : '';

    return `${date}: ${journal.title || 'Journal Entry'} (${statusText})${ratingText}`;
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

  // Create a proper grid structure for the heatmap
  // We need to pad the beginning and end to align with week boundaries
  function createWeekGrid(days: Array<{ date: string; dayOfWeek: number; weekOfYear: number }>) {
    const grid: Array<Array<{ date: string; dayOfWeek: number; weekOfYear: number } | null>> = [];

    // Find the first Sunday (start of first week)
    const firstDay = days[0];
    const daysToAdd = firstDay.dayOfWeek; // Number of empty days before first day

    // Create the grid week by week
    let currentWeek: Array<{ date: string; dayOfWeek: number; weekOfYear: number } | null> = [];

    // Add empty slots at the beginning if first day is not Sunday
    for (let i = 0; i < daysToAdd; i++) {
      currentWeek.push(null);
    }

    // Add all days
    for (const day of days) {
      currentWeek.push(day);

      // If we've completed a week (7 days), start a new week
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill the last week with nulls if needed
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      grid.push(currentWeek);
    }

    return grid;
  }

  const weekGrid = createWeekGrid(days);
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
      {#each weekGrid as week, weekIndex (weekIndex)}
        <div class="week-column">
          {#each week as day, dayIndex (dayIndex)}
            {#if day}
              {@const level = getRatingLevel(day.date, journalMap)}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="activity-square {getRatingColor(level)}"
                title={getTooltipText(day.date, journalMap)}
                on:click={() => handleDateClick(day.date)}
              ></div>
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
    <span>Poor (1)</span>
    <div class="flex items-center gap-1">
      <div class="activity-square bg-base-200" title="No entry"></div>
      <div class="activity-square bg-error" title="Poor day (1)"></div>
      <div class="activity-square bg-warning" title="Below average (2)"></div>
      <div class="activity-square bg-info" title="Average (3)"></div>
      <div class="activity-square bg-accent" title="Good day (4)"></div>
      <div class="activity-square bg-success" title="Excellent day (5)"></div>
    </div>
    <span>Excellent (5)</span>
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
    width: 12px;
    height: 12px;
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
