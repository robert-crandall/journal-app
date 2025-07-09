<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { journalApi, type JournalEntry, type JournalFilters, type JournalStats } from '$lib/api/journal';
  import { Plus, BookOpen, Calendar, Zap, Eye, Edit3, Trash2, Filter, RotateCcw, TrendingUp } from 'lucide-svelte';

  // Reactive state for journal data
  let journalEntries: JournalEntry[] = $state([]);
  let journalStats: JournalStats | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let selectedMonth = $state<string>('');
  let limitEntries = $state(10);

  // Load data on component mount
  onMount(async () => {
    await loadJournalData();
    await loadJournalStats();
  });

  // Separate function to load journal data
  async function loadJournalData() {
    try {
      loading = true;
      error = null;

      const filters: JournalFilters = {
        limit: limitEntries
      };

      // Add date filtering if month is selected
      if (selectedMonth) {
        const date = new Date(selectedMonth + '-01');
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        filters.startDate = startDate.toISOString().split('T')[0];
        filters.endDate = endDate.toISOString().split('T')[0];
      }

      const entriesData = await journalApi.getUserJournalEntries(filters);
      journalEntries = entriesData;
    } catch (err) {
      console.error('Failed to load journal entries:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load journal entries';
    } finally {
      loading = false;
    }
  }

  // Load journal statistics
  async function loadJournalStats() {
    try {
      const stats = await journalApi.getJournalStats();
      journalStats = stats;
    } catch (err) {
      console.error('Failed to load journal stats:', err);
    }
  }

  // Helper functions
  function formatDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatTime(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function truncateText(text: string, maxLength: number = 150): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function getXpColor(xpGranted: number): string {
    if (xpGranted >= 50) return 'text-success';
    if (xpGranted >= 20) return 'text-warning';
    return 'text-info';
  }

  // Navigation functions
  function createJournalEntry() {
    goto('/journal/create');
  }

  function editJournalEntry(entryId: string) {
    goto(`/journal/${entryId}/edit`);
  }

  function viewJournalEntry(entryId: string) {
    goto(`/journal/${entryId}`);
  }

  // Journal actions
  async function deleteJournalEntry(entry: JournalEntry) {
    if (!confirm(`Are you sure you want to delete this journal entry from ${formatDate(entry.entryDate)}? This action cannot be undone.`)) {
      return;
    }

    try {
      await journalApi.deleteJournalEntry(entry.id);
      await loadJournalData(); // Refresh the list
      await loadJournalStats(); // Refresh stats
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
      error = err instanceof Error ? err.message : 'Failed to delete journal entry';
    }
  }

  // Filter handlers
  async function handleFilterChange() {
    await loadJournalData();
  }

  // Generate month options for the past year
  function getMonthOptions(): Array<{value: string, label: string}> {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  }

  const monthOptions = getMonthOptions();
</script>

<svelte:head>
  <title>Journal - Gamified Life</title>
  <meta name="description" content="Your personal journal with GPT-assisted reflection and XP tracking" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Personal Journal</h1>
          <p class="text-base-content/70 text-lg">Reflect, learn, and grow with GPT-assisted journaling</p>
        </div>
        <div class="flex gap-3">
          <button onclick={createJournalEntry} class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
            <Plus size={20} />
            New Entry
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters & Stats Section -->
  <div class="mx-auto max-w-7xl px-4 py-6">
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Filters Card -->
      <div class="card bg-base-100 border-base-300 border shadow-xl lg:col-span-2">
        <div class="card-body p-6">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <Filter size={16} />
              <span class="font-medium">Filters:</span>
            </div>
            
            <div class="form-control">
              <label class="label" for="monthFilter">
                <span class="label-text">Month</span>
              </label>
              <select 
                id="monthFilter"
                bind:value={selectedMonth} 
                onchange={handleFilterChange}
                class="select select-bordered select-sm w-44"
              >
                <option value="">All Months</option>
                {#each monthOptions as month}
                  <option value={month.value}>{month.label}</option>
                {/each}
              </select>
            </div>

            <div class="form-control">
              <label class="label" for="limitFilter">
                <span class="label-text">Show</span>
              </label>
              <select 
                id="limitFilter"
                bind:value={limitEntries} 
                onchange={handleFilterChange}
                class="select select-bordered select-sm w-24"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <button onclick={async () => { selectedMonth = ''; limitEntries = 10; await loadJournalData(); }} class="btn btn-ghost btn-sm gap-2">
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Stats Card -->
      {#if journalStats}
        <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
          <div class="card-body p-6">
            <h3 class="text-primary mb-4 font-semibold flex items-center gap-2">
              <TrendingUp size={16} />
              Journal Stats
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Total Entries:</span>
                <span class="font-medium">{journalStats.totalEntries}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Total XP:</span>
                <span class="font-medium text-warning">{journalStats.totalXpGranted}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>This Month:</span>
                <span class="font-medium">{journalStats.entriesThisMonth}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Current Streak:</span>
                <span class="font-medium text-success">{journalStats.currentStreak} days</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 pb-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading your journal entries...</p>
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
      <!-- Journal Entries -->
      {#if journalEntries.length > 0}
        <section>
          <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">
            Recent Journal Entries
          </h2>
          <div class="space-y-6">
            {#each journalEntries as entry}
              <div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                <div class="card-body p-6">
                  <div class="mb-4 flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div class="text-2xl">
                        📔
                      </div>
                      <div class="flex-1">
                        <h3 class="text-lg font-bold">
                          {entry.title || `Entry from ${formatDate(entry.entryDate)}`}
                        </h3>
                        <p class="text-base-content/60 text-sm">
                          {formatDate(entry.entryDate)} at {formatTime(entry.entryDate)}
                        </p>
                      </div>
                    </div>

                    <!-- XP Badge -->
                    {#if entry.totalXpGranted && entry.totalXpGranted > 0}
                      <div class="badge badge-warning gap-1">
                        <Zap size={12} />
                        {entry.totalXpGranted} XP
                      </div>
                    {/if}
                  </div>

                  <!-- Entry Synopsis -->
                  {#if entry.synopsis}
                    <p class="text-base-content/80 mb-4 text-sm italic">
                      "{entry.synopsis}"
                    </p>
                  {/if}

                  <!-- Entry Content Preview -->
                  {#if entry.rawContent}
                    <div class="mb-4 rounded bg-base-200 p-4">
                      <p class="text-sm">
                        {truncateText(entry.rawContent)}
                      </p>
                    </div>
                  {/if}

                  <!-- Tags and Moods -->
                  {#if entry.contentTags || entry.moodTags}
                    <div class="mb-4 flex flex-wrap gap-2">
                      {#if entry.contentTags}
                        {#each entry.contentTags as tag}
                          <span class="badge badge-outline badge-xs">{tag}</span>
                        {/each}
                      {/if}
                      {#if entry.moodTags}
                        {#each entry.moodTags as mood}
                          <span class="badge badge-secondary badge-xs">{mood}</span>
                        {/each}
                      {/if}
                    </div>
                  {/if}

                  <!-- XP Grants -->
                  {#if entry.xpGrants && entry.xpGrants.length > 0}
                    <div class="mb-4">
                      <h4 class="text-xs font-medium text-base-content/60 mb-2">XP Awarded:</h4>
                      <div class="flex flex-wrap gap-2">
                        {#each entry.xpGrants as grant}
                          <span class="badge badge-sm {getXpColor(grant.amount)} gap-1">
                            <Zap size={10} />
                            {grant.statName}: +{grant.amount}
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- Action Buttons -->
                  <div class="flex flex-wrap gap-2">
                    <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewJournalEntry(entry.id)}>
                      <Eye size={14} />
                      Read Full Entry
                    </button>
                    <button class="btn btn-ghost btn-sm gap-1" onclick={() => editJournalEntry(entry.id)}>
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content gap-1" onclick={() => deleteJournalEntry(entry)}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- Load More -->
          {#if journalEntries.length >= limitEntries}
            <div class="mt-8 text-center">
              <button 
                onclick={() => { limitEntries += 10; loadJournalData(); }}
                class="btn btn-outline gap-2"
              >
                Load More Entries
              </button>
            </div>
          {/if}
        </section>
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
              <h3 class="mb-2 text-xl font-semibold">No Journal Entries Found</h3>
              <p class="text-base-content/60 mb-6">
                {selectedMonth 
                  ? 'No entries found for the selected month.' 
                  : 'Start your journaling journey and reflect on your daily experiences.'}
              </p>
              <button onclick={createJournalEntry} class="btn btn-primary btn-lg gap-2">
                <Plus size={20} />
                Write Your First Entry
              </button>
            </div>
          </div>
        </section>
      {/if}
    {/if}
  </div>
</div>
