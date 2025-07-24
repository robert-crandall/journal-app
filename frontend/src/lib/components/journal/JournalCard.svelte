<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { JournalListItem } from '$lib/types/journal';
  import { formatDate } from '$lib/utils/date';
  import { BookOpenIcon, MessageSquareIcon, CheckCircleIcon, EditIcon, CalendarIcon, FileTextIcon, TrophyIcon } from 'lucide-svelte';
  import ToneTagsDisplay from './ToneTagsDisplay.svelte';

  export let journal: JournalListItem;
  export let viewMode: 'grid' | 'list' = 'grid';

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('click');
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'complete':
        return CheckCircleIcon;
      case 'in_review':
        return MessageSquareIcon;
      default:
        return EditIcon;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'complete':
        return 'success';
      case 'in_review':
        return 'warning';
      default:
        return 'primary';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in_review':
        return 'In Review';
      default:
        return 'Draft';
    }
  }

  function truncateText(text: string | null, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="card bg-base-100 border-base-300 hover:border-primary/50 group cursor-pointer border shadow-sm transition-all hover:shadow-md"
  class:card-side={viewMode === 'list'}
  on:click={handleClick}
>
  <div class="card-body" class:p-4={viewMode === 'grid'} class:py-4={viewMode === 'list'}>
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <CalendarIcon size={16} class="text-base-content/60 flex-shrink-0" />
        <span class="text-sm font-medium">{formatDate(journal.date)}</span>
      </div>

      <div class="badge badge-{getStatusColor(journal.status)} badge-outline badge-sm flex-shrink-0 gap-1">
        <svelte:component this={getStatusIcon(journal.status)} size={12} />
        {getStatusText(journal.status)}
      </div>
    </div>

    <!-- Title -->
    {#if journal.title}
      <h3 class="card-title line-clamp-2 text-base leading-snug">
        {journal.title}
      </h3>
    {:else}
      <h3 class="card-title text-base-content/70 line-clamp-2 text-base leading-snug">Journal Entry</h3>
    {/if}

    <!-- Synopsis or Initial Message -->
    {#if journal.synopsis}
      <p class="text-base-content/70 line-clamp-2 text-sm">
        {truncateText(journal.synopsis, viewMode === 'grid' ? 120 : 200)}
      </p>
    {:else if journal.initialMessage}
      <p class="text-base-content/60 line-clamp-2 text-sm italic">
        {truncateText(journal.initialMessage, viewMode === 'grid' ? 120 : 200)}
      </p>
    {:else}
      <p class="text-base-content/50 text-sm italic">No content yet</p>
    {/if}

    <!-- Content Tags -->
    {#if journal.contentTags && journal.contentTags.length > 0}
      <div class="mt-2 flex flex-wrap gap-1">
        {#each journal.contentTags.slice(0, viewMode === 'grid' ? 3 : 5) as tag (tag.id)}
          <span class="badge badge-ghost badge-xs">{tag.name}</span>
        {/each}
        {#if journal.contentTags.length > (viewMode === 'grid' ? 3 : 5)}
          <span class="badge badge-ghost badge-xs">+{journal.contentTags.length - (viewMode === 'grid' ? 3 : 5)}</span>
        {/if}
      </div>
    {/if}

    <!-- Tone Tags -->
    {#if journal.toneTags && journal.toneTags.length > 0}
      <div class="mt-2">
        <ToneTagsDisplay toneTags={journal.toneTags} size="xs" showLabels={viewMode === 'list'} maxDisplay={viewMode === 'grid' ? 2 : 4} />
      </div>
    {/if}

    <!-- Stats Footer -->
    <div class="text-base-content/60 mt-4 flex items-center justify-between text-xs">
      <div class="flex items-center gap-4">
        {#if journal.characterCount}
          <div class="flex items-center gap-1">
            <FileTextIcon size={12} />
            <span>{journal.characterCount} chars</span>
          </div>
        {/if}

        {#if journal.wordCount}
          <div class="flex items-center gap-1">
            <BookOpenIcon size={12} />
            <span>{journal.wordCount} words</span>
          </div>
        {/if}
      </div>

      {#if journal.xpEarned && journal.xpEarned > 0}
        <div class="text-success flex items-center gap-1">
          <TrophyIcon size={12} />
          <span>+{journal.xpEarned} XP</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
