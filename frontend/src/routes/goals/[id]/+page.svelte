<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { goalsApi, type GoalWithParsedTags } from '$lib/api/goals';
  import { Target, Edit3, Archive, Trash2, ArrowLeft, Tag, Calendar } from 'lucide-svelte';

  // Get goal ID from route params
  const goalId = $page.params.id;

  // State
  let goal: GoalWithParsedTags | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Load goal data on mount
  onMount(async () => {
    await loadGoal();
  });

  async function loadGoal() {
    try {
      loading = true;
      error = null;
      
      goal = await goalsApi.getGoal(goalId);
    } catch (err) {
      console.error('Failed to load goal:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load goal';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getGoalIcon(tags: string[]) {
    const tagString = tags.join(' ').toLowerCase();
    if (tagString.includes('family')) return '👨‍👩‍👧‍👦';
    if (tagString.includes('health') || tagString.includes('fitness')) return '💪';
    if (tagString.includes('career') || tagString.includes('work')) return '💼';
    if (tagString.includes('spiritual') || tagString.includes('faith')) return '🙏';
    if (tagString.includes('growth') || tagString.includes('learning')) return '🌱';
    if (tagString.includes('creative') || tagString.includes('art')) return '🎨';
    if (tagString.includes('finance') || tagString.includes('money')) return '💰';
    return '🎯'; // Default target icon
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Navigation and actions
  function goBack() {
    goto('/goals');
  }

  function editGoal() {
    goto(`/goals/${goalId}/edit`);
  }

  async function toggleArchive() {
    if (!goal) return;

    try {
      const updatedGoal = await goalsApi.updateGoal(goal.id, {
        isArchived: !goal.isArchived,
        isActive: goal.isArchived // If unarchiving, make it active
      });
      goal = updatedGoal;
    } catch (err) {
      console.error('Failed to toggle archive status:', err);
      error = err instanceof Error ? err.message : 'Failed to update goal';
    }
  }

  async function deleteGoal() {
    if (!goal) return;

    if (!confirm(`Are you sure you want to delete "${goal.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await goalsApi.deleteGoal(goal.id);
      goto('/goals');
    } catch (err) {
      console.error('Failed to delete goal:', err);
      error = err instanceof Error ? err.message : 'Failed to delete goal';
    }
  }
</script>

<svelte:head>
  <title>{goal ? goal.title : 'Goal'} - Gamified Life</title>
  <meta name="description" content={goal ? `View details for goal: ${goal.title}` : 'View goal details'} />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-20">
      <div class="space-y-4 text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60">Loading goal...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="alert alert-error">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div class="font-bold">Error loading goal</div>
            <div class="text-sm">{error}</div>
          </div>
        </div>
      </div>
      <div class="mt-6">
        <button onclick={goBack} class="btn btn-outline gap-2">
          <ArrowLeft size={16} />
          Back to Goals
        </button>
      </div>
    </div>
  {:else if goal}
    <!-- Page Header -->
    <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
      <div class="mx-auto max-w-4xl px-4 py-8">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <button onclick={goBack} class="btn btn-ghost btn-circle">
              <ArrowLeft size={20} />
            </button>
            <div class="text-4xl">
              {getGoalIcon(goal.parsedTags)}
            </div>
            <div>
              <h1 class="text-primary text-3xl font-bold">{goal.title}</h1>
              <div class="flex items-center gap-4 mt-2">
                <div class="badge {goal.isArchived ? 'badge-neutral' : goal.isActive ? 'badge-success' : 'badge-warning'}">
                  {goal.isArchived ? 'Archived' : goal.isActive ? 'Active' : 'Inactive'}
                </div>
                <div class="text-base-content/60 text-sm flex items-center gap-1">
                  <Calendar size={14} />
                  Created {formatDate(goal.createdAt)}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button onclick={editGoal} class="btn btn-primary gap-2">
              <Edit3 size={16} />
              Edit
            </button>
            <button onclick={toggleArchive} class="btn btn-outline gap-2">
              <Archive size={16} />
              {goal.isArchived ? 'Unarchive' : 'Archive'}
            </button>
            <button onclick={deleteGoal} class="btn btn-outline btn-error gap-2">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Main Content (2/3 width) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Description Card -->
          {#if goal.description}
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h2 class="text-xl font-semibold mb-4">Description</h2>
                <p class="text-base-content/80 whitespace-pre-wrap">{goal.description}</p>
              </div>
            </div>
          {/if}

          <!-- Tags Card -->
          {#if goal.parsedTags.length > 0}
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Tag size={20} />
                  Tags
                </h2>
                <div class="flex flex-wrap gap-3">
                  {#each goal.parsedTags as tag}
                    <div class="badge badge-primary badge-lg gap-2">
                      <Tag size={14} />
                      {tag}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Integration Info Card -->
          <div class="card from-accent/10 to-primary/10 border-accent/20 border bg-gradient-to-br">
            <div class="card-body p-6">
              <h2 class="text-xl font-semibold mb-4">⚡ Goal Integration</h2>
              <div class="space-y-3 text-sm">
                <p class="text-base-content/70">
                  This goal influences your AI-generated daily tasks and journal prompts.
                </p>
                <p class="text-base-content/70">
                  When active, it appears in your character profile and helps shape your personalized experience.
                </p>
                {#if goal.isArchived}
                  <p class="text-warning">
                    <strong>Note:</strong> Archived goals don't influence task generation but are kept for reference.
                  </p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Related Features Card -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h2 class="text-xl font-semibold mb-4">🔗 Related Features</h2>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <div class="font-medium">Character Profile</div>
                    <div class="text-sm text-base-content/60">View how this goal appears in your character</div>
                  </div>
                  <button onclick={() => goto('/character')} class="btn btn-outline btn-sm">
                    View
                  </button>
                </div>
                <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <div class="font-medium">Stats Dashboard</div>
                    <div class="text-sm text-base-content/60">Track progress with related stats</div>
                  </div>
                  <button onclick={() => goto('/stats')} class="btn btn-outline btn-sm">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (1/3 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Goal Status Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="font-semibold mb-4">Goal Status</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm">Status:</span>
                    <div class="badge {goal.isArchived ? 'badge-neutral' : goal.isActive ? 'badge-success' : 'badge-warning'}">
                      {goal.isArchived ? 'Archived' : goal.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Created:</span>
                    <span class="font-medium text-sm">{new Date(goal.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Last Updated:</span>
                    <span class="font-medium text-sm">{new Date(goal.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Tags:</span>
                    <span class="font-medium text-sm">{goal.parsedTags.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="font-semibold mb-4">Quick Actions</h3>
                <div class="space-y-2">
                  <button onclick={editGoal} class="btn btn-outline btn-sm w-full gap-2">
                    <Edit3 size={16} />
                    Edit Goal
                  </button>
                  <button onclick={toggleArchive} class="btn btn-outline btn-sm w-full gap-2">
                    <Archive size={16} />
                    {goal.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <div class="divider my-2"></div>
                  <button onclick={() => goto('/goals/create')} class="btn btn-outline btn-sm w-full gap-2">
                    <Target size={16} />
                    Create New Goal
                  </button>
                  <button onclick={goBack} class="btn btn-outline btn-sm w-full gap-2">
                    <ArrowLeft size={16} />
                    Back to Goals
                  </button>
                </div>
              </div>
            </div>

            <!-- Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="font-semibold mb-4">💡 Tips</h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">Archive goals when completed to track your achievements over time.</p>
                  <p class="text-base-content/70">Use the edit function to refine your goal as you progress.</p>
                  <p class="text-base-content/70">Tags help organize goals and influence AI task generation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Goal not found -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="card bg-base-100 border-base-300 border shadow-xl">
        <div class="card-body py-12 text-center">
          <div class="avatar placeholder mb-6">
            <div class="bg-base-300 text-base-content w-20 rounded-full">
              <Target size={40} />
            </div>
          </div>
          <h3 class="mb-2 text-xl font-semibold">Goal Not Found</h3>
          <p class="text-base-content/60 mb-6">The goal you're looking for doesn't exist or has been deleted.</p>
          <button onclick={goBack} class="btn btn-primary gap-2">
            <ArrowLeft size={20} />
            Back to Goals
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
