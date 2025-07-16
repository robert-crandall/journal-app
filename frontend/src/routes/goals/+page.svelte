<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { goalsApi, type GoalWithParsedTags } from '$lib/api/goals';
  import { Plus, Target, Archive, Tag, Edit3, Trash2, Eye } from 'lucide-svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { formatDateTime } from '$lib/utils/date';

  // Reactive state for goals data
  let userGoals: GoalWithParsedTags[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let showArchived = $state(false);

  // Load data on component mount
  onMount(async () => {
    await loadGoalsData();
  });

  // Separate function to load goals data
  async function loadGoalsData() {
    try {
      loading = true;
      error = null;

      const goalsData = await goalsApi.getUserGoals();
      userGoals = goalsData;
    } catch (err) {
      console.error('Failed to load goals:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load goals';
    } finally {
      loading = false;
    }
  }

  // Filter goals based on archived status
  let filteredGoals = $derived(userGoals.filter((goal) => (showArchived ? goal.isArchived : goal.isActive && !goal.isArchived)));

  // Helper functions
  function getGoalIcon(goal: GoalWithParsedTags) {
    if (!goal.tags || goal.tags.length === 0) return '🎯';
    const tagString = goal.tags.join(' ').toLowerCase();
    if (tagString.includes('family')) return '👨‍👩‍👧‍👦';
    if (tagString.includes('health') || tagString.includes('fitness')) return '💪';
    if (tagString.includes('career') || tagString.includes('work')) return '💼';
    if (tagString.includes('spiritual') || tagString.includes('faith')) return '🙏';
    if (tagString.includes('growth') || tagString.includes('learning')) return '🌱';
    if (tagString.includes('creative') || tagString.includes('art')) return '🎨';
    if (tagString.includes('finance') || tagString.includes('money')) return '💰';
    return '🎯'; // Default target icon
  }

  // Navigation functions
  function createGoal() {
    goto('/goals/create');
  }

  function editGoal(goalId: string) {
    goto(`/goals/${goalId}/edit`);
  }

  function viewGoalDetails(goalId: string) {
    goto(`/goals/${goalId}`);
  }

  // Goal actions
  async function toggleGoalArchive(goal: GoalWithParsedTags) {
    try {
      await goalsApi.updateGoal(goal.id, {
        isArchived: !goal.isArchived,
        isActive: goal.isArchived, // If unarchiving, make it active
      });
      await loadGoalsData(); // Refresh the list
    } catch (err) {
      console.error('Failed to toggle goal archive status:', err);
      error = err instanceof Error ? err.message : 'Failed to update goal';
    }
  }

  async function deleteGoal(goal: GoalWithParsedTags) {
    if (!confirm(`Are you sure you want to delete "${goal.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await goalsApi.deleteGoal(goal.id);
      await loadGoalsData(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete goal:', err);
      error = err instanceof Error ? err.message : 'Failed to delete goal';
    }
  }
</script>

<svelte:head>
  <title>Goals - Gamified Life</title>
  <meta name="description" content="Manage your personal goals and track your progress towards achieving them" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center gap-3">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content w-12 rounded-full">🎯</div>
        </div>
        <div>
          <h1 class="text-primary text-3xl font-bold">Goals</h1>
          <p class="text-base-content/70">Define and track your personal objectives</p>
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
          <p class="text-base-content/60">Loading your goals...</p>
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
      <!-- Goals Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Goals Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          <!-- Current Goals Section -->
          {#if filteredGoals.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">
                {showArchived ? 'Archived Goals' : 'Active Goals'}
              </h2>
              <div class="grid gap-6 md:grid-cols-2">
                {#each filteredGoals as goal}
                  <div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="text-2xl">
                            {getGoalIcon(goal)}
                          </div>
                          <div class="flex-1">
                            <h3 class="text-lg font-bold">{goal.title}</h3>
                            <p class="text-base-content/60 text-sm">Created {formatDateTime(goal.createdAt, 'date-only')}</p>
                          </div>
                        </div>

                        <!-- Status Badge -->
                        <div class="badge {goal.isArchived ? 'badge-neutral' : goal.isActive ? 'badge-success' : 'badge-warning'}">
                          {goal.isArchived ? 'Archived' : goal.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>

                      {#if goal.description}
                        <p class="text-base-content/80 prose prose-sm mb-4 text-sm">{@html DOMPurify.sanitize(String(marked.parse(goal.description)))}</p>
                      {/if}

                      <!-- Tags -->
                      {#if goal.tags && goal.tags.length > 0}
                        <div class="mb-4 flex flex-wrap gap-2">
                          {#each goal.tags as tag}
                            <div class="badge badge-outline badge-sm gap-1">
                              <Tag size={12} />
                              {tag}
                            </div>
                          {/each}
                        </div>
                      {/if}

                      <!-- Action Buttons -->
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewGoalDetails(goal.id)}>
                          <Eye size={14} />
                          View
                        </button>
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => editGoal(goal.id)}>
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => toggleGoalArchive(goal)}>
                          <Archive size={14} />
                          {goal.isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content gap-1" onclick={() => deleteGoal(goal)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
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
                  <h3 class="mb-2 text-xl font-semibold">
                    {showArchived ? 'No Archived Goals' : 'No Active Goals'}
                  </h3>
                  <p class="text-base-content/60 mb-6">
                    {showArchived ? "You haven't archived any goals yet." : 'Start defining your objectives and working towards achieving them.'}
                  </p>
                  {#if !showArchived}
                    <button onclick={createGoal} class="btn btn-primary btn-lg gap-2">
                      <Plus size={20} />
                      Create Your First Goal
                    </button>
                  {/if}
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
                    <span class="text-sm">Active Goals:</span>
                    <span class="font-medium">{userGoals.filter((g) => g.isActive && !g.isArchived).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Total Goals:</span>
                    <span class="font-medium">{userGoals.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Archived:</span>
                    <span class="font-medium">{userGoals.filter((g) => g.isArchived).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Most Used Tag:</span>
                    <span class="font-medium">
                      {(() => {
                        const tagCounts: Record<string, number> = userGoals
                          .flatMap((g) => g.tags)
                          .reduce(
                            (acc, tag) => {
                              acc[tag] = (acc[tag] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>,
                          );
                        const entries = Object.entries(tagCounts);
                        const topTag = entries.sort((a, b) => b[1] - a[1])[0];
                        return topTag ? topTag[0] : 'None';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Tips</h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">Use tags to organize goals by area of life (family, work, health, etc.)</p>
                  <p class="text-base-content/70">Archive completed goals instead of deleting them to track your progress over time.</p>
                  <p class="text-base-content/70">Keep goals specific and actionable for better success rates.</p>
                </div>
              </div>
            </div>

            <!-- Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Actions</h3>
                <div class="space-y-3">
                  <button onclick={createGoal} class="btn btn-primary w-full gap-2">
                    <Plus size={16} />
                    Create Goal
                  </button>
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-2">
                      <input type="checkbox" bind:checked={showArchived} class="checkbox checkbox-primary" />
                      <span class="label-text">Show Archived</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
