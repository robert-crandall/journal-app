<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { journalApi } from '$lib/api/journal';
  import { BookOpen, Plus, Calendar, Edit3, Trash2, Eye, Sparkles, Tag, Heart, Brain } from 'lucide-svelte';

  // Import types from backend
  import type { Journal } from '../../../../backend/src/types/journals';

  // Reactive state for journal data
  let userJournals: Journal[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Load data on component mount
  onMount(async () => {
    await loadJournalData();
  });

  // Separate function to load journal data
  async function loadJournalData() {
    try {
      loading = true;
      error = null;

      const journalData = await journalApi.getUserJournals();
      userJournals = journalData;
    } catch (err) {
      console.error('Failed to load journals:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load journals';
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

  function getJournalPreview(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }

  function getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Navigation functions
  function createJournal() {
    const today = getTodayDateString();
    goto(`/journal/new?date=${today}`);
  }

  function viewJournalDetails(journalId: string) {
    goto(`/journal/${journalId}`);
  }

  function editJournal(journalId: string) {
    goto(`/journal/${journalId}/edit`);
  }

  // Journal actions
  async function deleteJournal(journal: Journal) {
    if (!confirm(`Are you sure you want to delete the journal from ${formatLongDate(journal.journalDate)}? This action cannot be undone.`)) {
      return;
    }

    try {
      await journalApi.deleteJournal(journal.id);
      await loadJournalData(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete journal:', err);
      error = err instanceof Error ? err.message : 'Failed to delete journal';
    }
  }

  // Group journals by month for better organization
  let groupedJournals = $derived(() => {
    const groups: Record<string, Journal[]> = {};

    userJournals.forEach((journal) => {
      const date = new Date(journal.journalDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!groups[monthName]) {
        groups[monthName] = [];
      }
      groups[monthName].push(journal);
    });

    // Sort each group by date descending
    Object.keys(groups).forEach((month) => {
      groups[month].sort((a, b) => new Date(b.journalDate).getTime() - new Date(a.journalDate).getTime());
    });

    return groups;
  });

  // Check if there's a journal for today
  let hasJournalToday = $derived.by(() => {
    const today = getTodayDateString();
    return userJournals.some((journal) => journal.journalDate === today);
  });

  // Find today's journal if it exists
  let todayJournal = $derived.by(() => {
    const today = getTodayDateString();
    return userJournals.find((journal) => journal.journalDate === today);
  });
</script>

<svelte:head>
  <title>Journal - Gamified Life</title>
  <meta name="description" content="Write and reflect on your daily experiences through journaling" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Journal</h1>
          <p class="text-base-content/70 text-lg">Reflect on your daily experiences and track your growth</p>
        </div>
        <div class="flex gap-3">
          {#if hasJournalToday && todayJournal}
            <button onclick={() => editJournal(todayJournal.id)} class="btn btn-outline btn-lg gap-2">
              <Edit3 size={20} />
              Edit Today's Entry
            </button>
          {/if}
          <button onclick={createJournal} class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
            <Plus size={20} />
            {hasJournalToday ? 'New Entry' : "Start Today's Journal"}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 py-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading your journals...</p>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="alert alert-error mx-auto max-w-md">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      </div>
    {:else}
      <!-- Journal Content -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Journal Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          <!-- Today's Journal Highlight -->
          {#if hasJournalToday && todayJournal}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 flex items-center gap-2 border-b pb-2 text-2xl font-semibold">
                <Calendar size={24} />
                Today's Entry
              </h2>
              <div class="card from-primary/5 to-secondary/5 border-primary/30 border-2 bg-gradient-to-br shadow-xl">
                <div class="card-body p-6">
                  <div class="mb-4 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div class="text-2xl">📖</div>
                      <div class="flex-1">
                        <h3 class="text-lg font-bold">{todayJournal.title || 'Untitled Entry'}</h3>
                        <p class="text-base-content/60 text-sm">{formatLongDate(todayJournal.journalDate)}</p>
                      </div>
                    </div>

                    <!-- Status Badge -->
                    <div class="badge {todayJournal.isFinalized ? 'badge-success' : 'badge-warning'}">
                      {todayJournal.isFinalized ? 'Analyzed' : 'Draft'}
                    </div>
                  </div>

                  <p class="text-base-content/80 mb-4 text-sm">
                    {getJournalPreview(todayJournal.synopsis || todayJournal.content, 200)}
                  </p>

                  <!-- Action Buttons -->
                  <div class="flex flex-wrap gap-2">
                    <button class="btn btn-primary btn-sm gap-1" onclick={() => viewJournalDetails(todayJournal.id)}>
                      <Eye size={14} />
                      View Full Entry
                    </button>
                    {#if !todayJournal.isFinalized}
                      <button class="btn btn-ghost btn-sm gap-1" onclick={() => editJournal(todayJournal.id)}>
                        <Edit3 size={14} />
                        Continue Writing
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            </section>
          {/if}

          <!-- Journal Entries by Month -->
          {#if Object.keys(groupedJournals).length > 0}
            {#each Object.entries(groupedJournals) as [month, journals]}
              <section>
                <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">
                  {month}
                </h2>
                <div class="grid gap-6 md:grid-cols-2">
                  {#each journals as journal}
                    <article class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                      <div class="card-body p-6">
                        <div class="mb-4 flex items-start justify-between">
                          <div class="flex items-center gap-3">
                            <div class="text-2xl">
                              {journal.isFinalized ? '✨' : '📝'}
                            </div>
                            <div class="flex-1">
                              <h3 class="text-lg font-bold">
                                {journal.title || `Entry for ${formatDate(journal.journalDate)}`}
                              </h3>
                              <p class="text-base-content/60 text-sm">{formatDate(journal.journalDate)}</p>
                            </div>
                          </div>

                          <!-- Status Badge -->
                          <div class="badge {journal.isFinalized ? 'badge-success' : 'badge-warning'}">
                            {journal.isFinalized ? 'Analyzed' : 'Draft'}
                          </div>
                        </div>

                        {#if journal.synopsis}
                          <p class="text-base-content/80 mb-4 text-sm">{getJournalPreview(journal.synopsis, 120)}</p>
                        {:else}
                          <p class="text-base-content/80 mb-4 text-sm">{getJournalPreview(journal.content, 120)}</p>
                        {/if}

                        <!-- Action Buttons -->
                        <div class="flex flex-wrap gap-2">
                          <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewJournalDetails(journal.id)}>
                            <Eye size={14} />
                            View
                          </button>
                          {#if !journal.isFinalized}
                            <button class="btn btn-ghost btn-sm gap-1" onclick={() => editJournal(journal.id)}>
                              <Edit3 size={14} />
                              Edit
                            </button>
                          {/if}
                          <button class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content gap-1" onclick={() => deleteJournal(journal)}>
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  {/each}
                </div>
              </section>
            {/each}
          {:else}
            <!-- Empty State -->
            <section>
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body py-12 text-center">
                  <div class="avatar placeholder mb-6">
                    <div class="bg-base-300 text-base-content w-20 rounded-full">
                      <BookOpen size={40} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">No Journal Entries Yet</h3>
                  <p class="text-base-content/60 mb-6">Start your journaling journey today. Write about your experiences, thoughts, and reflections.</p>
                  <button onclick={createJournal} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Write Your First Entry
                  </button>
                </div>
              </div>
            </section>
          {/if}
        </div>

        <!-- Sidebar (1/4 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Quick Stats Card -->
            <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
              <div class="card-body p-6">
                <h3 class="text-primary mb-4 font-semibold">Writing Stats</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm">Total Entries:</span>
                    <span class="font-medium">{userJournals.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Analyzed:</span>
                    <span class="font-medium">{userJournals.filter((j) => j.isFinalized).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Drafts:</span>
                    <span class="font-medium">{userJournals.filter((j) => !j.isFinalized).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">This Month:</span>
                    <span class="font-medium">
                      {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return userJournals.filter((j) => {
                          const journalDate = new Date(j.journalDate);
                          return journalDate.getMonth() === currentMonth && journalDate.getFullYear() === currentYear;
                        }).length;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 flex items-center gap-2 font-semibold">
                  <Brain size={18} />
                  Journaling Tips
                </h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">Write freely without worrying about grammar or structure.</p>
                  <p class="text-base-content/70">Include emotions, thoughts, and experiences from your day.</p>
                  <p class="text-base-content/70">Analyze your entries to gain insights and track personal growth.</p>
                  <p class="text-base-content/70">Be consistent - even short entries are valuable.</p>
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Quick Actions</h3>
                <div class="space-y-2">
                  <button onclick={createJournal} class="btn btn-outline btn-sm w-full gap-2">
                    <Plus size={16} />
                    New Entry
                  </button>
                  {#if hasJournalToday && todayJournal && !todayJournal.isFinalized}
                    <button onclick={() => editJournal(todayJournal.id)} class="btn btn-outline btn-sm w-full gap-2">
                      <Edit3 size={16} />
                      Continue Today's Entry
                    </button>
                  {/if}
                  <button onclick={() => goto('/journal/insights')} class="btn btn-outline btn-sm w-full gap-2">
                    <Sparkles size={16} />
                    View Insights
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
