<script lang="ts">
  import type { JournalEntry } from '$lib/api/client';
  import { BookOpen, Calendar, MoreHorizontal } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  interface Props {
    entry: JournalEntry;
    compact?: boolean;
    showActions?: boolean;
  }

  let { entry, compact = false, showActions = false }: Props = $props();

  function handleClick() {
    goto(`/journal/${entry.id}`);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  function truncateContent(content: string, maxLength: number = 150) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }
</script>

<div 
  class="card {compact ? 'card-compact' : ''} bg-base-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="View journal entry: {entry.title || 'Untitled'}"
>
  <div class="card-body {compact ? 'p-4' : ''}">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <!-- Title or first line -->
        {#if entry.title}
          <h3 class="font-medium text-base-content {compact ? 'text-sm' : ''} line-clamp-1">
            {entry.title}
          </h3>
          {#if !compact}
            <p class="text-sm text-base-content/70 mt-1 line-clamp-2">
              {truncateContent(entry.content)}
            </p>
          {/if}
        {:else}
          <p class="text-sm text-base-content {compact ? 'line-clamp-2' : 'line-clamp-3'}">
            {truncateContent(entry.content, compact ? 100 : 200)}
          </p>
        {/if}

        <!-- Meta info -->
        <div class="flex items-center gap-2 mt-2 text-xs text-base-content/50">
          <Calendar size={12} />
          <span>{formatDate(entry.createdAt)}</span>
          {#if entry.updatedAt !== entry.createdAt}
            <span class="opacity-50">• edited</span>
          {/if}
        </div>
      </div>

      <!-- Icon -->
      <div class="flex-shrink-0 ml-3">
        <BookOpen size={16} class="text-base-content/30" />
      </div>

      <!-- Actions dropdown -->
      {#if showActions && !compact}
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
            <MoreHorizontal size={16} />
          </div>
          <div class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <ul class="menu">
              <li><button onclick={() => window.location.href = `/journal/${entry.id}/edit`}>Edit</button></li>
              <li><button onclick={() => window.location.href = `/journal/${entry.id}`}>View Full Entry</button></li>
              <li><button class="text-error">Delete</button></li>
            </ul>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
