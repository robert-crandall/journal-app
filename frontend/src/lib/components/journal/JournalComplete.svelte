<script lang="ts">
  import type { JournalResponse } from '$lib/types/journal';
  import { CheckCircleIcon, TagIcon, BookOpenIcon, SparklesIcon, MessageSquareIcon } from 'lucide-svelte';

  export let journal: JournalResponse;

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  function formatTime(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  $: chatSession = journal.chatSession || [];
  $: contentTags = journal.contentTags || [];
  $: toneTags = journal.toneTags || [];
  $: statTags = journal.statTags || [];
</script>

<div class="space-y-6">
  <!-- Header Card -->
  <div class="card from-success/10 to-accent/10 bg-gradient-to-br border-success/20 border">
    <div class="card-body">
      <div class="flex items-center gap-3 mb-4">
        <CheckCircleIcon size={32} class="text-success" />
        <div>
          <h2 class="text-2xl font-bold text-gradient">Journal Complete</h2>
          <p class="text-base-content/70">{formatDate(journal.date)}</p>
        </div>
      </div>

      {#if journal.title}
        <h3 class="text-xl font-semibold mb-2">{journal.title}</h3>
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
        <div class="flex items-center gap-3 mb-4">
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
        <div class="flex items-center gap-3 mb-4">
          <TagIcon size={24} class="text-secondary" />
          <h3 class="text-lg font-semibold">Tags & Themes</h3>
        </div>

        <div class="space-y-4">
          {#if contentTags.length > 0}
            <div>
              <h4 class="font-medium text-sm mb-2 text-base-content/70">Content Tags</h4>
              <div class="flex flex-wrap gap-2">
                {#each contentTags as tag}
                  <span class="badge badge-primary badge-outline">{tag}</span>
                {/each}
              </div>
            </div>
          {/if}

          {#if toneTags.length > 0}
            <div>
              <h4 class="font-medium text-sm mb-2 text-base-content/70">Emotional Tone</h4>
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
        <div class="flex items-center gap-3 mb-4">
          <SparklesIcon size={24} class="text-accent" />
          <h3 class="text-lg font-semibold">Character Growth</h3>
        </div>

        <div class="space-y-2">
          {#each statTags as statTag}
            <div class="flex items-center justify-center p-3 bg-accent/10 rounded-lg border border-accent/20">
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
        <div class="flex items-center gap-3 mb-4">
          <MessageSquareIcon size={24} class="text-info" />
          <h3 class="text-lg font-semibold">Reflection Conversation</h3>
        </div>

        <div class="space-y-4 max-h-96 overflow-y-auto">
          {#each chatSession as message, i}
            <div class="flex items-start gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium {
                  message.role === 'user' ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'
                }">
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
              </div>

              <!-- Message Content -->
              <div class="flex-1 max-w-md {message.role === 'user' ? 'text-right' : ''}">
                <div class="px-4 py-3 rounded-lg {
                  message.role === 'user' 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-base-200'
                }">
                  <p class="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {#if message.timestamp}
                  <p class="text-xs opacity-60 mt-1 {message.role === 'user' ? 'text-right' : ''}">
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
      <h3 class="text-lg font-semibold mb-4">Entry Details</h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-medium text-base-content/70">Created:</span>
          <span class="ml-2">{formatDate(journal.createdAt)}</span>
        </div>
        <div>
          <span class="font-medium text-base-content/70">Completed:</span>
          <span class="ml-2">{formatDate(journal.updatedAt)}</span>
        </div>
        <div>
          <span class="font-medium text-base-content/70">Messages:</span>
          <span class="ml-2">{chatSession.length} in conversation</span>
        </div>
        <div>
          <span class="font-medium text-base-content/70">Status:</span>
          <span class="ml-2 badge badge-success badge-sm">Complete</span>
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
