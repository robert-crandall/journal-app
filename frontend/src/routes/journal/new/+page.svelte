<script lang="ts">
  import { onMount } from 'svelte';
  import { journalApi, type JournalEntryWithDetails } from '$lib/api/journal';
  import { formatDateTime } from '$lib/utils/date';

  let entries: JournalEntryWithDetails[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      entries = await journalApi.getEntries();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load journal entries';
    } finally {
      loading = false;
    }
  });

  function truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }
</script>

<svelte:head>
  <title>Journal | Gamified Life</title>
</svelte:head>

<div class="bg-base-200/30 min-h-screen">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content w-12 rounded-full">📖</div>
        </div>
        <div>
          <h1 class="text-base-content text-3xl font-bold">Journal</h1>
          <p class="text-base-content/70">Reflect and grow with guided conversations</p>
        </div>
      </div>

      <a href="/journal/longform" class="btn btn-primary btn-lg"> ➕ Start Journal </a>
    </div>

    <!-- Content -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    {:else if entries.length === 0}
      <!-- Empty state -->
      <div class="hero bg-base-100 rounded-2xl shadow-sm">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <div class="avatar placeholder mb-4">
              <div class="bg-primary/20 text-primary w-20 rounded-full">📖</div>
            </div>
            <h2 class="mb-4 text-2xl font-bold">Start Your Journal Journey</h2>
            <p class="text-base-content/70 mb-6">
              Begin a conversation with our AI guide to explore your thoughts, feelings, and experiences in a supportive environment.
            </p>
            <a href="/journal/longform" class="btn btn-primary btn-lg"> ➕ Start Your First Entry </a>
          </div>
        </div>
      </div>
    {:else}
      <!-- Journal entries grid -->
      <div class="grid gap-6 md:grid-cols-2">
        {#each entries as entry (entry.id)}
          <div class="card bg-base-100 shadow-sm transition-shadow hover:shadow-md">
            <div class="card-body">
              <!-- Entry header -->
              <div class="mb-3 flex items-start justify-between">
                <h3 class="card-title text-base-content text-lg font-semibold">
                  {entry.title}
                </h3>
                <div class="text-base-content/50 flex items-center gap-1 text-xs">
                  📅 {formatDateTime(entry.createdAt)}
                </div>
              </div>

              <!-- Synopsis -->
              <p class="text-base-content/80 mb-4 text-sm leading-relaxed">
                {truncateText(entry.synopsis || '', 120)}
              </p>

              <!-- Tags -->
              {#if entry.tags.length > 0 || entry.statTags.length > 0}
                <div class="mb-4 flex flex-wrap gap-2">
                  {#each entry.tags.slice(0, 3) as tag}
                    <div class="badge badge-outline badge-sm">
                      🏷️ {tag.name}
                    </div>
                  {/each}
                  {#each entry.statTags.slice(0, 2) as statTag}
                    <div class="badge badge-primary badge-sm">
                      📈 {statTag.name}
                    </div>
                  {/each}
                  {#if entry.tags.length + entry.statTags.length > 5}
                    <div class="badge badge-ghost badge-sm">
                      +{entry.tags.length + entry.statTags.length - 5} more
                    </div>
                  {/if}
                </div>
              {/if}

              <!-- Footer with message count -->
              <div class="card-actions items-center justify-between">
                <div class="text-base-content/50 text-xs">
                  {entry.messages.length} messages
                </div>
                <a href="/journal/{entry.id}" class="btn btn-ghost btn-sm"> Read Entry </a>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
