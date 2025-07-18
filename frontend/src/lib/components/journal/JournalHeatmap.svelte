<script lang="ts">
  import { CalendarIcon } from 'lucide-svelte';
  import type { JournalListItem } from '$lib/types/journal';
  import { formatDate } from '$lib/utils/date';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let journals: JournalListItem[] = [];
  export let month: number = new Date().getMonth();
  export let year: number = new Date().getFullYear();

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
  let selectedDay: Day | null = null;

  onMount(() => {
    buildCalendar(month, year);
  });

  $: {
    // Rebuild calendar when month, year, or journals change
    if (month !== undefined && year !== undefined) {
      buildCalendar(month, year);
    }
  }

  function buildCalendar(month: number, year: number) {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get the day of the week the month starts on (0 = Sunday, 6 = Saturday)
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days: Day[] = [];
    
    // Get days from previous month to fill the first week
    const daysFromPreviousMonth = startingDayOfWeek;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = daysFromPreviousMonth - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const date = new Date(prevYear, prevMonth, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date())
      });
    }
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = isSameDay(date, today);
      const dateString = formatDateToYYYYMMDD(date);
      
      // Find journal for this day if it exists
      const journalForDay = journals.find(j => j.date === dateString);
      
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        journalId: journalForDay?.id,
        journalDate: journalForDay?.date,
        rating: journalForDay?.dayRating || journalForDay?.inferredDayRating || null,
        title: journalForDay?.title || null,
        isToday
      });
    }
    
    // Next month's days to complete the grid (ensuring we have a full 6 rows)
    const totalDaysNeeded = 42; // 6 rows of 7 days
    const daysFromNextMonth = totalDaysNeeded - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= daysFromNextMonth; day++) {
      const date = new Date(nextYear, nextMonth, day);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isSameDay(date, today)
      });
    }
    
    calendarDays = days;
    
    // Set month name
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    currentMonthName = `${monthNames[month]} ${year}`;
  }

  function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
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
    }
  }

  function showDayTooltip(day: Day) {
    selectedDay = day;
  }

  function hideDayTooltip() {
    selectedDay = null;
  }

  function previousMonth() {
    if (month === 0) {
      month = 11;
      year--;
    } else {
      month--;
    }
  }

  function nextMonth() {
    if (month === 11) {
      month = 0;
      year++;
    } else {
      month++;
    }
  }

  function getCurrentMonth() {
    month = new Date().getMonth();
    year = new Date().getFullYear();
  }

  function getRatingColor(rating: number | null): string {
    if (!rating) return 'bg-base-200';
    
    // Color scale from red (1) to green (5)
    switch(rating) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-400';
      case 3: return 'bg-yellow-300';
      case 4: return 'bg-lime-400';
      case 5: return 'bg-green-500';
      default: return 'bg-base-200';
    }
  }
</script>

<div class="card bg-base-100 border-base-300 border shadow-xl">
  <div class="card-body">
    <div class="flex items-center justify-between">
      <h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
        <CalendarIcon size={24} class="text-primary" />
        <span>Journal Calendar</span>
      </h3>
      
      <div class="flex items-center gap-2">
        <button class="btn btn-sm btn-ghost" on:click={previousMonth} aria-label="Previous month">
          &lt;
        </button>
        <button class="btn btn-sm btn-ghost" on:click={getCurrentMonth}>
          Today
        </button>
        <button class="btn btn-sm btn-ghost" on:click={nextMonth} aria-label="Next month">
          &gt;
        </button>
      </div>
    </div>
    
    <div class="mb-1 text-center text-lg font-medium">{currentMonthName}</div>
    
    <div class="grid grid-cols-7 gap-1 text-center text-xs">
      <div class="font-medium">Sun</div>
      <div class="font-medium">Mon</div>
      <div class="font-medium">Tue</div>
      <div class="font-medium">Wed</div>
      <div class="font-medium">Thu</div>
      <div class="font-medium">Fri</div>
      <div class="font-medium">Sat</div>
    </div>
    
    <div class="grid grid-cols-7 gap-1">
      {#each calendarDays as day, i (i)}
        <div 
          class="relative aspect-square"
          on:mouseenter={() => showDayTooltip(day)}
          on:mouseleave={hideDayTooltip}
        >
          <button
            class="absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-md 
              {day.isCurrentMonth ? 
                day.rating ? getRatingColor(day.rating) + ' hover:opacity-80' : 'bg-base-200 hover:bg-base-300' : 
                'bg-base-100 text-base-content/30'} 
              {day.isToday ? 'ring-2 ring-primary' : ''}"
            on:click={() => handleDayClick(day)}
          >
            <span class="text-xs {day.rating ? 'text-base-content' : 'text-base-content/70'}">{day.dayOfMonth}</span>
            {#if day.journalId}
              <div class="mt-1 h-1 w-1 rounded-full bg-primary"></div>
            {/if}
          </button>
          
          {#if selectedDay === day && (day.journalId || day.rating)}
            <div class="card bg-base-100 absolute left-1/2 top-0 z-10 w-48 -translate-x-1/2 -translate-y-full shadow-xl">
              <div class="card-body p-3">
                <p class="font-medium">{formatDate(day.date.toISOString())}</p>
                {#if day.title}
                  <p class="text-xs">{day.title}</p>
                {/if}
                {#if day.rating}
                  <div class="mt-1 flex items-center gap-1">
                    <span class="text-xs font-medium">Rating:</span>
                    <span class="badge badge-sm {getRatingColor(day.rating)} text-base-content">
                      {day.rating}
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- Legend -->
    <div class="mt-4 flex items-center justify-center gap-3 text-xs" data-test-id="heatmap-legend">
      <div class="flex items-center gap-1">
        <div class="h-3 w-3 rounded bg-red-500"></div>
        <span data-test-id="legend-rating-1">1</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="h-3 w-3 rounded bg-orange-400"></div>
        <span data-test-id="legend-rating-2">2</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="h-3 w-3 rounded bg-yellow-300"></div>
        <span data-test-id="legend-rating-3">3</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="h-3 w-3 rounded bg-lime-400"></div>
        <span data-test-id="legend-rating-4">4</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="h-3 w-3 rounded bg-green-500"></div>
        <span data-test-id="legend-rating-5">5</span>
      </div>
    </div>
  </div>
</div>
