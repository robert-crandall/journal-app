<script lang="ts">
  import type { JournalResponse } from '$lib/types/journal';
  import { formatDate as formatDateUtil, formatDateTime } from '$lib/utils/date';
  import { CheckCircleIcon, TagIcon, BookOpenIcon, SparklesIcon, MessageSquareIcon } from 'lucide-svelte';

  export let journal: JournalResponse;

  function formatDate(dateStr: string): string {
    try {
      return formatDateUtil(dateStr);
    } catch {
      return dateStr;
    }
  }

  function formatTime(timestamp: string): string {
    try {
      return formatDateTime(timestamp, 'time-only');
    } catch {
      return '';
    }
  }

  $: chatSession = journal.chatSession || [];
  $: contentTags = journal.contentTags || [];
  $: toneTags = journal.toneTags || [];
  $: statTags = journal.statTags || [];
</script>

<div class="space-y-6" data-test-id="journal-complete">
  <!-- Header Card -->
  <div class="card from-success/10 to-accent/10 border-success/20 border bg-gradient-to-br">
    <div class="card-body">
      <div class="mb-4 flex items-center gap-3">
        <CheckCircleIcon size={32} class="text-success" />
        <div>
          <h2 class="text-gradient text-2xl font-bold">Journal Complete</h2>
          <p class="text-base-content/70">{formatDate(journal.date)}</p>
        </div>
      </div>

      {#if journal.title}
        <h3 class="mb-2 text-xl font-semibold">{journal.title}</h3>
      {/if}

      {#if journal.synopsis}
        <p class="text-base-content/80 italic">{journal.synopsis}</p>
      {/if}
    </div>
  </div>

  <!-- Summary Card -->
  {#if journal.summary}
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <div class="mb-4 flex items-center gap-3">
          <BookOpenIcon size={24} class="text-primary" />
          <h3 class="text-lg font-semibold">Summary</h3>
        </div>

        <div class="prose prose-sm max-w-none">
          <p class="text-base-content/90 leading-relaxed">{journal.summary}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Tags Section -->
  {#if contentTags.length > 0 || toneTags.length > 0}
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <div class="mb-4 flex items-center gap-3">
          <TagIcon size={24} class="text-secondary" />
          <h3 class="text-lg font-semibold">Tags & Themes</h3>
        </div>

        <div class="space-y-4">
          {#if contentTags.length > 0}
            <div>
              <h4 class="text-base-content/70 mb-2 text-sm font-medium">Content Tags</h4>
              <div class="flex flex-wrap gap-2">
                {#each contentTags as tag}
                  <span class="badge badge-primary badge-outline">{tag}</span>
                {/each}
              </div>
            </div>
          {/if}

          {#if toneTags.length > 0}
            <div>
              <h4 class="text-base-content/70 mb-2 text-sm font-medium">Emotional Tone</h4>
              <div class="flex flex-wrap gap-2">
                {#each toneTags as tag}
                  <span class="badge badge-secondary badge-outline">{tag}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Stats Impact -->
  {#if statTags.length > 0}
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <div class="mb-4 flex items-center gap-3">
          <SparklesIcon size={24} class="text-accent" />
          <h3 class="text-lg font-semibold">Character Growth</h3>
        </div>

        <div class="space-y-2">
          {#each statTags as statTag}
            <div class="bg-accent/10 border-accent/20 flex items-center justify-center rounded-lg border p-3">
              <span class="badge badge-accent">{statTag}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Chat History -->
  {#if chatSession.length > 0}
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <div class="mb-4 flex items-center gap-3">
          <MessageSquareIcon size={24} class="text-info" />
          <h3 class="text-lg font-semibold">Reflection Conversation</h3>
        </div>

        <div class="max-h-96 space-y-4 overflow-y-auto">
          {#each chatSession as message, i}
            <div class="flex items-start gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium {message.role === 'user'
                    ? 'bg-primary text-primary-content'
                    : 'bg-secondary text-secondary-content'}"
                >
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
              </div>

              <!-- Message Content -->
              <div class="max-w-md flex-1 {message.role === 'user' ? 'text-right' : ''}">
                <div class="rounded-lg px-4 py-3 {message.role === 'user' ? 'bg-primary/10 border-primary/20 border' : 'bg-base-200'}">
                  <p class="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {#if message.timestamp}
                  <p class="mt-1 text-xs opacity-60 {message.role === 'user' ? 'text-right' : ''}">
                    {formatTime(message.timestamp)}
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Metadata -->
  <div class="card bg-base-100 border-base-300 border shadow-xl">
    <div class="card-body">
      <h3 class="mb-4 text-lg font-semibold">Entry Details</h3>

      <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <span class="text-base-content/70 font-medium">Created:</span>
          <span class="ml-2">{formatDate(journal.createdAt)}</span>
        </div>
        <div>
          <span class="text-base-content/70 font-medium">Completed:</span>
          <span class="ml-2">{formatDate(journal.updatedAt)}</span>
        </div>
        <div>
          <span class="text-base-content/70 font-medium">Messages:</span>
          <span class="ml-2">{chatSession.length} in conversation</span>
        </div>
        <div>
          <span class="text-base-content/70 font-medium">Status:</span>
          <span class="badge badge-success badge-sm ml-2">Complete</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .text-gradient {
    background: linear-gradient(to right, oklch(0.637 0.237 25.331), oklch(0.637 0.237 330));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
</style>
