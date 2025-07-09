<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { questsApi, type QuestWithRelations, type QuestFilters } from '$lib/api/quests';
  import { Plus, Target, Calendar, Clock, CheckCircle, XCircle, Archive, Edit3, Trash2, Eye, Filter, RotateCcw } from 'lucide-svelte';

  // Reactive state for quests data
  let userQuests: QuestWithRelations[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let filterType = $state<string>('');
  let filterStatus = $state<string>('active');

  // Load data on component mount
  onMount(async () => {
    await loadQuestsData();
  });

  // Separate function to load quests data
  async function loadQuestsData() {
    try {
      loading = true;
      error = null;

      const filters: QuestFilters = {};
      if (filterType) filters.type = filterType as 'quest' | 'experiment';
      if (filterStatus) filters.status = filterStatus as 'active' | 'completed' | 'cancelled';

      const questsData = await questsApi.getUserQuests(filters);
      userQuests = questsData;
    } catch (err) {
      console.error('Failed to load quests:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load quests';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getQuestIcon(quest: QuestWithRelations) {
    if (quest.type === 'experiment') return '🧪';
    return '⚔️'; // Quest
  }

  function getStatusColor(status: string | null) {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'cancelled': return 'badge-error';
      case 'active': return 'badge-warning';
      default: return 'badge-ghost';
    }
  }

  function getStatusIcon(status: string | null) {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'active': return Clock;
      default: return Target;
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function calculateDuration(startDate: string | null, endDate: string | null): string {
    if (!startDate || !endDate) return 'Duration not set';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  }

  // Navigation functions
  function createQuest() {
    goto('/quests/create');
  }

  function editQuest(questId: string) {
    goto(`/quests/${questId}/edit`);
  }

  function viewQuestDetails(questId: string) {
    goto(`/quests/${questId}`);
  }

  // Quest actions
  async function completeQuest(quest: QuestWithRelations) {
    const conclusion = prompt(`Add a conclusion note for "${quest.title}" (optional):`);
    
    try {
      await questsApi.completeQuest(quest.id, conclusion || undefined);
      await loadQuestsData(); // Refresh the list
    } catch (err) {
      console.error('Failed to complete quest:', err);
      error = err instanceof Error ? err.message : 'Failed to complete quest';
    }
  }

  async function cancelQuest(quest: QuestWithRelations) {
    const reason = prompt(`Why are you cancelling "${quest.title}"? (optional):`);
    
    if (!confirm(`Are you sure you want to cancel "${quest.title}"?`)) {
      return;
    }

    try {
      await questsApi.cancelQuest(quest.id, reason || undefined);
      await loadQuestsData(); // Refresh the list
    } catch (err) {
      console.error('Failed to cancel quest:', err);
      error = err instanceof Error ? err.message : 'Failed to cancel quest';
    }
  }

  // Filter handlers
  async function handleFilterChange() {
    await loadQuestsData();
  }
</script>

<svelte:head>
  <title>Quests & Experiments - Gamified Life</title>
  <meta name="description" content="Manage your long-term quests and time-boxed experiments" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Quests & Experiments</h1>
          <p class="text-base-content/70 text-lg">Long-term commitments and behavioral trials</p>
        </div>
        <div class="flex gap-3">
          <button onclick={createQuest} class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
            <Plus size={20} />
            Create Quest
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters Section -->
  <div class="mx-auto max-w-7xl px-4 py-6">
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <Filter size={16} />
            <span class="font-medium">Filters:</span>
          </div>
          
          <div class="form-control">
            <label class="label" for="typeFilter">
              <span class="label-text">Type</span>
            </label>
            <select 
              id="typeFilter"
              bind:value={filterType} 
              onchange={handleFilterChange}
              class="select select-bordered select-sm w-36"
            >
              <option value="">All Types</option>
              <option value="quest">Quests</option>
              <option value="experiment">Experiments</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label" for="statusFilter">
              <span class="label-text">Status</span>
            </label>
            <select 
              id="statusFilter"
              bind:value={filterStatus} 
              onchange={handleFilterChange}
              class="select select-bordered select-sm w-36"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button onclick={async () => { filterType = ''; filterStatus = 'active'; await loadQuestsData(); }} class="btn btn-ghost btn-sm gap-2">
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 pb-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading your quests...</p>
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
      <!-- Quests Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Quests Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          {#if userQuests.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">
                Your {filterType ? (filterType === 'quest' ? 'Quests' : 'Experiments') : 'Quests & Experiments'}
              </h2>
              <div class="grid gap-6 md:grid-cols-2">
                {#each userQuests as quest}
                  <div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="text-2xl">
                            {getQuestIcon(quest)}
                          </div>
                          <div class="flex-1">
                            <h3 class="text-lg font-bold">{quest.title}</h3>
                            <p class="text-base-content/60 text-sm capitalize">{quest.type}</p>
                          </div>
                        </div>

                        <!-- Status Badge -->
                        <div class="badge {getStatusColor(quest.status)} gap-1">
                          {#if quest.status === 'completed'}
                            <CheckCircle size={12} />
                          {:else if quest.status === 'cancelled'}
                            <XCircle size={12} />
                          {:else if quest.status === 'active'}
                            <Clock size={12} />
                          {:else}
                            <Target size={12} />
                          {/if}
                          {quest.status || 'Unknown'}
                        </div>
                      </div>

                      {#if quest.description}
                        <p class="text-base-content/80 mb-4 text-sm">{quest.description}</p>
                      {/if}

                      <!-- Quest Details -->
                      <div class="mb-4 space-y-2">
                        <div class="flex items-center gap-2 text-sm">
                          <Calendar size={14} />
                          <span>
                            {formatDate(quest.startDate)} → {formatDate(quest.endDate)}
                          </span>
                        </div>
                        
                        {#if quest.startDate && quest.endDate}
                          <div class="flex items-center gap-2 text-sm">
                            <Clock size={14} />
                            <span>Duration: {calculateDuration(quest.startDate, quest.endDate)}</span>
                          </div>
                        {/if}

                        {#if quest.dailyTaskTitle}
                          <div class="text-sm">
                            <span class="badge badge-outline badge-xs">Daily Task: {quest.dailyTaskTitle}</span>
                          </div>
                        {/if}

                        {#if quest.goal}
                          <div class="text-sm">
                            <span class="badge badge-secondary badge-xs">Goal: {quest.goal.title}</span>
                          </div>
                        {/if}
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewQuestDetails(quest.id)}>
                          <Eye size={14} />
                          View
                        </button>
                        
                        {#if quest.status === 'active'}
                          <button class="btn btn-ghost btn-sm gap-1" onclick={() => editQuest(quest.id)}>
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button class="btn btn-success btn-sm gap-1" onclick={() => completeQuest(quest)}>
                            <CheckCircle size={14} />
                            Complete
                          </button>
                          <button class="btn btn-warning btn-sm gap-1" onclick={() => cancelQuest(quest)}>
                            <XCircle size={14} />
                            Cancel
                          </button>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </section>
          {:else}
            <!-- Empty State -->
            <section>
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body py-12 text-center">
                  <div class="avatar placeholder mb-6">
                    <div class="bg-base-300 text-base-content w-20 rounded-full">
                      <Target size={40} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">No Quests Found</h3>
                  <p class="text-base-content/60 mb-6">
                    {filterType || filterStatus 
                      ? 'No quests match your current filters.' 
                      : 'Start your first quest or experiment to track long-term commitments.'}
                  </p>
                  <button onclick={createQuest} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Create Your First Quest
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
                <h3 class="text-primary mb-4 font-semibold">Quick Stats</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm">Total:</span>
                    <span class="font-medium">{userQuests.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Active:</span>
                    <span class="font-medium">{userQuests.filter(q => q.status === 'active').length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Completed:</span>
                    <span class="font-medium">{userQuests.filter(q => q.status === 'completed').length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Experiments:</span>
                    <span class="font-medium">{userQuests.filter(q => q.type === 'experiment').length}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quest Types Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Quest Types</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex items-start gap-2">
                    <span class="text-lg">⚔️</span>
                    <div>
                      <span class="font-medium">Quests:</span>
                      <p class="text-base-content/70">Long-term personal commitments</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="text-lg">🧪</span>
                    <div>
                      <span class="font-medium">Experiments:</span>
                      <p class="text-base-content/70">Time-boxed behavioral trials</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Quick Actions</h3>
                <div class="space-y-2">
                  <button onclick={createQuest} class="btn btn-outline btn-sm w-full gap-2">
                    <Plus size={16} />
                    Create New Quest
                  </button>
                  <button onclick={() => goto('/tasks')} class="btn btn-outline btn-sm w-full gap-2">
                    <Archive size={16} />
                    View Tasks
                  </button>
                  <button onclick={() => goto('/projects')} class="btn btn-outline btn-sm w-full gap-2">
                    <Archive size={16} />
                    View Projects
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
