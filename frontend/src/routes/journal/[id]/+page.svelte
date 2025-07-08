<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { journalApi, type JournalEntryWithDetails } from '$lib/api/journal';

  let entry: JournalEntryWithDetails | null = null;
  let loading = true;
  let error = '';
  let entryId = '';

  // Get the entry ID from the URL
  page.subscribe(($page) => {
    entryId = $page.params.id;
  });

  onMount(async () => {
    if (!entryId) {
      goto('/journal');
      return;
    }

    try {
      entry = await journalApi.getEntry(entryId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load journal entry';
    } finally {
      loading = false;
    }
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<svelte:head>
  <title>{entry?.title || 'Journal Entry'} | Gamified Life</title>
</svelte:head>

<div class="bg-base-200/30 min-h-screen">
  <div class="mx-auto max-w-4xl px-4 py-8">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <span class="text-base-content/70 ml-3">Loading journal entry...</span>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
        <div>
          <a href="/journal" class="btn btn-sm">Back to Journal</a>
        </div>
      </div>
    {:else if entry}
      <!-- Header -->
      <div class="mb-8">
        <div class="mb-4 flex items-center gap-3">
          <a href="/journal" class="btn btn-ghost btn-sm"> ← Back to Journal </a>
          <div class="divider divider-horizontal"></div>
          <div class="text-base-content/60 flex items-center gap-2 text-sm">
            📅 {formatDate(entry.createdAt)}
          </div>
        </div>

        <h1 class="text-base-content mb-4 text-4xl font-bold">{entry.title}</h1>

        {#if entry.synopsis}
          <p class="text-base-content/80 mb-6 text-xl leading-relaxed">
            {entry.synopsis}
          </p>
        {/if}

        <!-- Tags -->
        {#if entry.tags.length > 0 || entry.statTags.length > 0}
          <div class="mb-6 flex flex-wrap gap-2">
            {#each entry.tags as tag}
              <div class="badge badge-outline">
                🏷️ {tag.name}
              </div>
            {/each}
            {#each entry.statTags as statTag}
              <div class="badge badge-primary">
                📈 {statTag.name}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Conversation -->
      <div class="bg-base-100 mb-8 rounded-2xl p-6 shadow-sm">
        <h2 class="text-base-content mb-6 text-2xl font-semibold">Conversation</h2>

        <div class="space-y-6">
          {#each entry.messages as message, index (message.id)}
            <div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
              <div class="chat-image avatar">
                <div class="w-10 rounded-full {message.role === 'user' ? 'bg-base-300' : 'bg-primary'}">
                  <div class="flex h-full w-full items-center justify-center text-sm font-bold {message.role === 'user' ? 'text-base-content' : 'text-primary-content'}">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                </div>
              </div>
              <div class="chat-header">
                {message.role === 'user' ? 'You' : 'AI Guide'}
                <time class="ml-1 text-xs opacity-50">{formatTime(message.createdAt)}</time>
              </div>
              <div class="chat-bubble {message.role === 'user' ? 'bg-base-200 text-base-content' : 'bg-primary text-primary-content'} max-w-none whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Summary -->
      {#if entry.summary}
        <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
          <h2 class="text-base-content mb-4 text-2xl font-semibold">Summary</h2>
          <div class="prose max-w-none">
            <p class="text-base-content/80 leading-relaxed whitespace-pre-wrap">
              {entry.summary}
            </p>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="mt-8 flex justify-center">
        <a href="/journal/session" class="btn btn-primary btn-lg"> ➕ Start New Journal Session </a>
      </div>
    {:else}
      <div class="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <span>Journal entry not found</span>
        <div>
          <a href="/journal" class="btn btn-sm">Back to Journal</a>
        </div>
      </div>
    {/if}
  </div>
</div>
