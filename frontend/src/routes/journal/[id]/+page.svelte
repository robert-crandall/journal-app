<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { journalApi } from '$lib/api/journal';
  import { ArrowLeft, Edit3, Trash2, Sparkles, Calendar, Tag, Award, Brain, Heart, TrendingUp } from 'lucide-svelte';

  // Import types from backend
  import type { JournalWithTags } from '../../../../../backend/src/types/journals';

  // Reactive state
  let journal: JournalWithTags | null = $state(null);
  let loading = $state(true);
  let finalizing = $state(false);
  let error = $state<string | null>(null);

  // Get journal ID from URL
  let journalId: string;

  onMount(async () => {
    journalId = $page.params.id;
    await loadJournal();
  });

  async function loadJournal() {
    try {
      loading = true;
      error = null;

      const journalData = await journalApi.getJournal(journalId);
      journal = journalData;
    } catch (err) {
      console.error('Failed to load journal:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load journal';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatLongDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatDateTime(dateString: string | Date): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // Navigation functions
  function goBack() {
    goto('/journal');
  }

  function editJournal() {
    if (!journal) return;
    goto(`/journal/${journal.id}/edit`);
  }

  // Journal actions
  async function deleteJournal() {
    if (!journal) return;

    if (!confirm(`Are you sure you want to delete this journal entry? This action cannot be undone.`)) {
      return;
    }

    try {
      await journalApi.deleteJournal(journal.id);
      goto('/journal');
    } catch (err) {
      console.error('Failed to delete journal:', err);
      error = err instanceof Error ? err.message : 'Failed to delete journal';
    }
  }

  async function finalizeJournal() {
    if (!journal) return;

    try {
      finalizing = true;
      error = null;

      const finalizedJournal = await journalApi.finalizeJournal({ id: journal.id });
      journal = finalizedJournal;
    } catch (err) {
      console.error('Failed to finalize journal:', err);
      error = err instanceof Error ? err.message : 'Failed to analyze journal';
    } finally {
      finalizing = false;
    }
  }

  // Get tag display color
  function getTagColor(type: 'content' | 'tone' | 'stat'): string {
    switch (type) {
      case 'content':
        return 'badge-primary';
      case 'tone':
        return 'badge-secondary';
      case 'stat':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  }
</script>

<svelte:head>
  <title>{journal?.title || 'Journal Entry'} - Gamified Life</title>
  <meta name="description" content="View your journal entry and insights" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  {#if loading}
    <!-- Loading State -->
    <div class="flex min-h-screen items-center justify-center">
      <div class="space-y-4 text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60">Loading journal entry...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="flex min-h-screen items-center justify-center">
      <div class="card bg-base-100 border-base-300 max-w-md border shadow-xl">
        <div class="card-body text-center">
          <div class="alert alert-error">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{error}</span>
          </div>
          <button onclick={goBack} class="btn btn-primary mt-4">
            <ArrowLeft size={18} />
            Back to Journal
          </button>
        </div>
      </div>
    </div>
  {:else if journal}
    <!-- Page Header -->
    <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
      <div class="mx-auto max-w-6xl px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button onclick={goBack} class="btn btn-ghost btn-sm gap-2">
              <ArrowLeft size={18} />
              Back to Journal
            </button>
            <div>
              <h1 class="text-primary text-2xl font-bold">
                {journal.title || `Journal Entry for ${formatDate(journal.journalDate)}`}
              </h1>
              <p class="text-base-content/70 flex items-center gap-2">
                <Calendar size={16} />
                {formatLongDate(journal.journalDate)}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Status Badge -->
            <div class="badge {journal.isFinalized ? 'badge-success' : 'badge-warning'} badge-lg">
              {journal.isFinalized ? 'Analyzed' : 'Draft'}
            </div>

            {#if !journal.isFinalized}
              <button onclick={editJournal} class="btn btn-outline btn-sm gap-2">
                <Edit3 size={16} />
                Edit
              </button>
              <button onclick={finalizeJournal} class="btn btn-primary btn-sm gap-2 {finalizing ? 'loading' : ''}" disabled={finalizing}>
                {#if finalizing}
                  <span class="loading loading-spinner loading-sm"></span>
                  Analyzing...
                {:else}
                  <Sparkles size={16} />
                  Analyze with AI
                {/if}
              </button>
            {:else}
              <button onclick={editJournal} class="btn btn-outline btn-sm gap-2" disabled>
                <Edit3 size={16} />
                Read Only
              </button>
            {/if}

            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm">⋮</div>
              <div class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-[1] w-52 border p-2 shadow">
                <button onclick={deleteJournal} class="menu-item text-error hover:bg-error hover:text-error-content">
                  <Trash2 size={16} />
                  Delete Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Content Area (3/4 width) -->
        <div class="space-y-6 lg:col-span-3">
          <!-- Original Content -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h2 class="mb-4 text-xl font-semibold">Original Entry</h2>
              <div class="prose prose-lg max-w-none">
                <div class="text-base-content/90 leading-relaxed whitespace-pre-wrap">
                  {journal.content}
                </div>
              </div>
            </div>
          </div>

          <!-- AI Analysis Results (if finalized) -->
          {#if journal.isFinalized}
            <!-- Summary -->
            {#if journal.summary}
              <div class="card from-primary/5 to-secondary/5 border-primary/20 border bg-gradient-to-br shadow-xl">
                <div class="card-body p-6">
                  <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Brain size={20} />
                    AI Summary
                  </h2>
                  <div class="prose prose-lg max-w-none">
                    <div class="text-base-content/90 leading-relaxed">
                      {journal.summary}
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Synopsis -->
            {#if journal.synopsis}
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Heart size={20} />
                    Key Takeaway
                  </h2>
                  <blockquote class="text-base-content/80 border-primary border-l-4 pl-4 text-lg italic">
                    "{journal.synopsis}"
                  </blockquote>
                </div>
              </div>
            {/if}

            <!-- Tags and XP Section -->
            <div class="grid gap-6 md:grid-cols-2">
              <!-- Content & Tone Tags -->
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Tag size={18} />
                    Themes & Emotions
                  </h3>

                  <div class="space-y-4">
                    {#if journal.contentTags && journal.contentTags.length > 0}
                      <div>
                        <h4 class="text-base-content/70 mb-2 text-sm font-medium">Content Themes:</h4>
                        <div class="flex flex-wrap gap-2">
                          {#each journal.contentTags as tag}
                            <div class="badge {getTagColor('content')} gap-1">
                              <Tag size={12} />
                              {tag}
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}

                    {#if journal.toneTags && journal.toneTags.length > 0}
                      <div>
                        <h4 class="text-base-content/70 mb-2 text-sm font-medium">Emotional Tone:</h4>
                        <div class="flex flex-wrap gap-2">
                          {#each journal.toneTags as tag}
                            <div class="badge {getTagColor('tone')} gap-1">
                              <Heart size={12} />
                              {tag}
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- XP Gained -->
              {#if journal.statTags && journal.statTags.length > 0}
                <div class="card from-accent/10 to-success/10 border-accent/20 border bg-gradient-to-br shadow-xl">
                  <div class="card-body p-6">
                    <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Award size={18} />
                      Experience Gained
                    </h3>

                    <div class="space-y-3">
                      {#each journal.statTags as statTag}
                        <div class="flex items-center justify-between">
                          <div class="badge {getTagColor('stat')} gap-1">
                            <TrendingUp size={12} />
                            Stat ID: {statTag.statId}
                          </div>
                          <div class="text-success text-lg font-bold">
                            +{statTag.xpAmount} XP
                          </div>
                        </div>
                      {/each}

                      <div class="divider my-2"></div>

                      <div class="flex items-center justify-between font-semibold">
                        <span>Total XP Gained:</span>
                        <span class="text-success text-xl">
                          +{journal.statTags.reduce((total, stat) => total + stat.xpAmount, 0)} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Sidebar (1/4 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Entry Details -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Entry Details</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Date:</span>
                    <span class="font-medium">{formatDate(journal.journalDate)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Created:</span>
                    <span class="font-medium">{formatDateTime(journal.createdAt)}</span>
                  </div>
                  {#if journal.updatedAt && journal.updatedAt !== journal.createdAt}
                    <div class="flex justify-between">
                      <span class="text-base-content/70">Updated:</span>
                      <span class="font-medium">{formatDateTime(journal.updatedAt)}</span>
                    </div>
                  {/if}
                  {#if journal.analyzedAt}
                    <div class="flex justify-between">
                      <span class="text-base-content/70">Analyzed:</span>
                      <span class="font-medium">{formatDateTime(journal.analyzedAt)}</span>
                    </div>
                  {/if}
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Word Count:</span>
                    <span class="font-medium">
                      {journal.content.split(/\s+/).filter((word) => word.length > 0).length}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Characters:</span>
                    <span class="font-medium">{journal.content.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Analysis Status -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Analysis Status</h3>
                {#if journal.isFinalized}
                  <div class="space-y-3">
                    <div class="text-success flex items-center gap-2">
                      <Sparkles size={16} />
                      <span class="font-medium">Analysis Complete</span>
                    </div>
                    <p class="text-base-content/70 text-sm">This entry has been analyzed by AI to extract insights and award experience points.</p>
                  </div>
                {:else}
                  <div class="space-y-3">
                    <div class="text-warning flex items-center gap-2">
                      <Calendar size={16} />
                      <span class="font-medium">Draft Entry</span>
                    </div>
                    <p class="text-base-content/70 text-sm">This entry hasn't been analyzed yet. Click "Analyze with AI" to generate insights and earn XP.</p>
                    <button onclick={finalizeJournal} class="btn btn-primary btn-sm w-full gap-2 {finalizing ? 'loading' : ''}" disabled={finalizing}>
                      {#if finalizing}
                        <span class="loading loading-spinner loading-sm"></span>
                        Analyzing...
                      {:else}
                        <Sparkles size={16} />
                        Analyze Now
                      {/if}
                    </button>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Actions</h3>
                <div class="space-y-2">
                  {#if !journal.isFinalized}
                    <button onclick={editJournal} class="btn btn-outline btn-sm w-full gap-2">
                      <Edit3 size={16} />
                      Edit Entry
                    </button>
                  {/if}
                  <button onclick={() => goto('/journal/new')} class="btn btn-outline btn-sm w-full gap-2">
                    <Calendar size={16} />
                    New Entry
                  </button>
                  <button onclick={goBack} class="btn btn-outline btn-sm w-full gap-2">
                    <ArrowLeft size={16} />
                    Back to Journal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
