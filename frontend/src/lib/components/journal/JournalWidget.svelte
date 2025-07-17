<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { JournalService } from '$lib/api/journal';
  import { XpGrantsService, type XpGrantWithDetails } from '$lib/api/xpGrants';
  import { formatDateTime, getTodayDateString, getNowDateTimeString } from '$lib/utils/date';
  import type { TodayJournalResponse } from '$lib/types/journal';
  import { BookOpenIcon, PlusCircleIcon, MessageSquareIcon, CheckCircleIcon, CalendarIcon, TrophyIcon, TagIcon } from 'lucide-svelte';

  let todayJournal: TodayJournalResponse | null = null;
  let xpGrants: XpGrantWithDetails[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      todayJournal = await JournalService.getTodaysJournal();

      // If journal is complete, load XP grants
      if (todayJournal?.journal?.status === 'complete') {
        try {
          xpGrants = await XpGrantsService.getJournalXpGrants(todayJournal.journal.id);
        } catch (err) {
          console.warn('Failed to load XP grants:', err);
          // Don't fail the entire component if XP grants fail
        }
      }

      error = null;
    } catch (err) {
      console.error("Failed to load today's journal:", err);
      error = 'Failed to load journal status';
    } finally {
      loading = false;
    }
  });

  function handleJournalAction() {
    const today = getTodayDateString();
    goto(`/journal/${today}`);
  }

  $: statusColor = todayJournal?.journal?.status === 'complete' ? 'success' : todayJournal?.journal?.status === 'in_review' ? 'warning' : 'primary';

  $: statusIcon =
    todayJournal?.journal?.status === 'complete' ? CheckCircleIcon : todayJournal?.journal?.status === 'in_review' ? MessageSquareIcon : PlusCircleIcon;

  $: actionText =
    todayJournal?.journal?.status === 'complete'
      ? "View Today's Journal"
      : todayJournal?.journal?.status === 'in_review'
        ? 'Continue Reflection'
        : "Start Today's Journal";
</script>

<div class="card bg-base-100 border-base-300 border shadow-xl" data-test-id="journal-widget">
  <div class="card-body">
    <div class="mb-4 flex items-center gap-3">
      <BookOpenIcon size={24} class="text-primary" />
      <h3 class="text-lg font-semibold">Today's Journal</h3>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-8">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <span class="text-sm">{error}</span>
      </div>
    {:else}
      <div class="space-y-4">
        <!-- Date Display -->
        <div class="text-base-content/70 flex items-center gap-2">
          <CalendarIcon size={16} />
          <span class="text-sm">
            {formatDateTime(todayJournal?.journal?.date, 'date-only')}
          </span>
        </div>

        <!-- Status Display -->
        {#if todayJournal?.journal}
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="badge badge-{statusColor} badge-outline gap-2">
                <svelte:component this={statusIcon} size={14} />
                {todayJournal.journal.status === 'complete' ? 'Complete' : todayJournal.journal.status === 'in_review' ? 'In Review' : 'Draft'}
              </div>
            </div>

            {#if todayJournal.journal.title}
              <h4 class="text-base-content/90 font-medium">{todayJournal.journal.title}</h4>
            {/if}

            {#if todayJournal.journal.status === 'complete' && todayJournal.journal.synopsis}
              <p class="text-base-content/70 text-sm italic">{todayJournal.journal.synopsis}</p>
            {/if}

            <!-- Progress info for in-progress journals -->
            {#if todayJournal.journal.status !== 'complete'}
              <div class="text-base-content/60 text-xs">
                {#if todayJournal.journal.initialMessage}
                  {todayJournal.journal.initialMessage.length} characters written
                {:else}
                  Ready to start writing
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <!-- No journal yet -->
          <div class="py-4 text-center">
            <div class="mb-3 opacity-60">
              <BookOpenIcon size={48} class="text-base-content/30 mx-auto" />
            </div>
            <p class="text-base-content/70 mb-2">No journal entry for today</p>
            <p class="text-base-content/50 text-xs">Start your daily reflection</p>
          </div>
        {/if}

        <!-- Action Button -->
        <div class="card-actions justify-center pt-2">
          <button data-test-id="journal-action-button" class="btn btn-{statusColor} btn-wide gap-2" on:click={handleJournalAction}>
            <svelte:component this={statusIcon} size={18} />
            {actionText}
          </button>
        </div>

        <!-- Quick Stats for Completed Journal -->
        {#if todayJournal?.journal?.status === 'complete'}
          <div class="stats stats-horizontal bg-base-200/50 text-xs">
            <div class="stat px-3 py-2">
              <div class="stat-title text-xs">Messages</div>
              <div class="stat-value text-sm">{todayJournal.journal.chatSession?.length || 0}</div>
            </div>
            <div class="stat px-3 py-2">
              <div class="stat-title text-xs">Content Tags</div>
              <div class="stat-value text-sm">{xpGrants.filter((g) => g.entityType === 'content_tag').length}</div>
            </div>
            <div class="stat px-3 py-2">
              <div class="stat-title text-xs">XP Earned</div>
              <div class="stat-value text-sm">{xpGrants.filter((g) => g.entityType !== 'content_tag').reduce((sum, g) => sum + g.xpAmount, 0)}</div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
