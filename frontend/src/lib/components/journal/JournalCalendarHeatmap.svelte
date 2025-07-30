<script lang="ts">
  import type { JournalListItem } from '$lib/types/journal';
  import { goto } from '$app/navigation';
  import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-svelte';

  export let journals: JournalListItem[] = [];

  // Calendar state
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  interface Day {
    date: Date;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    journalId?: string;
    journalDate?: string;
    rating?: number | null;
    title?: string | null;
    isToday: boolean;
  }

  let calendarDays: Day[] = [];
  let currentMonthName = '';

  // Build calendar when month, year, or journals change
  $: {
    if (currentMonth !== undefined && currentYear !== undefined && journals !== undefined) {
      buildCalendar(currentMonth, currentYear);
    }
  }

  function buildCalendar(month: number, year: number) {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Get the day of the week the month starts on (0 = Sunday, 6 = Saturday)
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // We'll collect all days and arrange them in a grid
    const allDays: Day[] = [];

    // Previous month's days (to fill the calendar grid)
    const daysFromPreviousMonth = startingDayOfWeek;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = daysFromPreviousMonth - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const date = new Date(prevYear, prevMonth, day);
      allDays.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
      });
    }

    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = isSameDay(date, today);
      const dateString = formatDateToYYYYMMDD(date);

      // Find journal for this day if it exists
      const journalForDay = journals.find((j) => j.date === dateString);

      allDays.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        journalId: journalForDay?.id,
        journalDate: journalForDay?.date,
        rating: journalForDay?.dayRating || null,
        title: journalForDay?.title || null,
        isToday,
      });
    }

    // Next month's days to complete the grid (ensuring we have a full 6 rows)
    const totalDaysNeeded = 42; // 6 rows of 7 days
    const daysFromNextMonth = totalDaysNeeded - allDays.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    for (let day = 1; day <= daysFromNextMonth; day++) {
      const date = new Date(nextYear, nextMonth, day);
      allDays.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
      });
    }

    calendarDays = allDays;

    // Set month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthName = `${monthNames[month]} ${year}`;
  }

  function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  }

  function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function handleDayClick(day: Day) {
    if (day.journalDate) {
      goto(`/journal/${day.journalDate}`);
    } else {
      // Create new journal for this date
      const dateString = formatDateToYYYYMMDD(day.date);
      goto(`/journal/${dateString}`);
    }
  }

  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }

  function getCurrentMonth() {
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();
  }

  function getRatingColor(rating: number | null): string {
    if (!rating) return 'bg-base-200 hover:bg-base-300';

    // Color scale from red (1) to green (5)
    switch (rating) {
      case 1:
        return 'bg-error/75 hover:bg-error/90';
      case 2:
        return 'bg-warning/75 hover:bg-warning/90';
      case 3:
        return 'bg-info/75 hover:bg-info/90';
      case 4:
        return 'bg-accent/80 hover:bg-accent/95';
      case 5:
        return 'bg-success hover:bg-success/90';
      default:
        return 'bg-base-200 hover:bg-base-300';
    }
  }
</script>

<div class="heatmap-container">
  <!-- Calendar Header -->
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <!-- Month Navigation -->
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost btn-sm" on:click={previousMonth} aria-label="Previous month">
          <ChevronLeftIcon size={16} />
        </button>

        <button class="btn btn-ghost btn-sm" on:click={getCurrentMonth}> Today </button>

        <button class="btn btn-ghost btn-sm" on:click={nextMonth} aria-label="Next month">
          <ChevronRightIcon size={16} />
        </button>
      </div>

      <!-- Month/Year Display -->
      <div class="text-center">
        <h3 class="text-lg font-medium">{currentMonthName}</h3>
      </div>

      <!-- Spacer -->
      <div class="w-24"></div>
    </div>
  </div>

  <!-- Calendar Grid -->
  <div class="calendar-grid">
    <!-- Day of week headers -->
    <div class="day-headers">
      <div class="day-header">Sun</div>
      <div class="day-header">Mon</div>
      <div class="day-header">Tue</div>
      <div class="day-header">Wed</div>
      <div class="day-header">Thu</div>
      <div class="day-header">Fri</div>
      <div class="day-header">Sat</div>
    </div>

    <!-- Calendar days -->
    <div class="calendar-days">
      {#each calendarDays as day, i (i)}
        <div class="day-cell">
          <button
            class="day-button
              {day.isCurrentMonth
              ? day.rating
                ? getRatingColor(day.rating)
                : 'bg-base-100 hover:bg-base-200'
              : 'bg-base-50 text-base-content/30 hover:bg-base-100'} 
              {day.isToday ? 'ring-primary ring-2' : ''}"
            on:click={() => handleDayClick(day)}
            title={day.journalId ? `${day.title || 'Journal Entry'} - Rating: ${day.rating || 'None'}` : `Create journal for ${formatDateToYYYYMMDD(day.date)}`}
          >
            <span class="day-number {day.rating ? 'text-base-content' : 'text-base-content/70'}">
              {day.dayOfMonth}
            </span>
            {#if day.journalId}
              <div class="journal-indicator"></div>
            {/if}
          </button>
        </div>
      {/each}
    </div>
  </div>

  <!-- Legend -->
  <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="text-base-content/60 text-xs">Poor days</div>

    <div class="flex items-center gap-2">
      <div class="legend-square bg-base-200" title="No entry"></div>
      <div class="legend-square bg-error/75" title="Poor day (1)"></div>
      <div class="legend-square bg-warning/75" title="Below average (2)"></div>
      <div class="legend-square bg-info/75" title="Average (3)"></div>
      <div class="legend-square bg-accent/80" title="Good day (4)"></div>
      <div class="legend-square bg-success" title="Excellent day (5)"></div>
    </div>

    <div class="text-base-content/60 text-xs">Excellent days</div>
  </div>
</div>

<style>
  .heatmap-container {
    max-width: 100%;
    overflow: visible;
  }

  .calendar-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }

  .day-header {
    text-align: center;
    padding: 8px 4px;
    font-size: 12px;
    font-weight: 600;
    color: rgb(107 114 126 / 0.7);
  }

  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .day-cell {
    position: relative;
    aspect-ratio: 1;
    min-height: 48px;
  }

  .day-button {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 2px;
  }

  .day-button:hover {
    transform: scale(1.05);
    border-color: rgb(107 114 126 / 0.3);
    z-index: 10;
  }

  .day-number {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
  }

  .journal-indicator {
    width: 6px;
    height: 6px;
    background-color: currentColor;
    border-radius: 50%;
    opacity: 0.7;
  }

  .legend-square {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgb(107 114 126 / 0.2);
  }

  /* Responsive design for smaller screens */
  @media (max-width: 640px) {
    .day-cell {
      min-height: 40px;
    }

    .day-header {
      padding: 6px 2px;
      font-size: 11px;
    }

    .day-number {
      font-size: 13px;
    }
  }

  /* For very small screens */
  @media (max-width: 400px) {
    .day-cell {
      min-height: 36px;
    }

    .calendar-days {
      gap: 2px;
    }

    .day-headers {
      gap: 2px;
    }

    .day-number {
      font-size: 12px;
    }
  }
</style>
