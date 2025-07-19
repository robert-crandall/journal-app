<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { plansApi, type PlanResponse, type PlanType } from '$lib/api/plans';
  import { Plus, FolderKanban, Compass, Palette, FileText, Edit3, Trash2, Eye, MoreVertical, Calendar } from 'lucide-svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { formatDateTime } from '$lib/utils/date';

  // Reactive state for plans data
  let userPlans: PlanResponse[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let selectedType = $state<PlanType | 'all'>('all');

  // Load data on component mount
  onMount(async () => {
    await loadPlansData();
  });

  // Separate function to load plans data
  async function loadPlansData() {
    try {
      loading = true;
      error = null;

      const plansData = await plansApi.getUserPlans();
      userPlans = plansData;
    } catch (err) {
      console.error('Failed to load plans:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load plans';
    } finally {
      loading = false;
    }
  }

  // Filter plans based on type
  let filteredPlans = $derived(userPlans.filter((plan) => selectedType === 'all' || plan.type === selectedType));

  // Group plans by type for stats
  let planStats = $derived(() => {
    return userPlans.reduce(
      (acc, plan) => {
        acc[plan.type] = (acc[plan.type] || 0) + 1;
        return acc;
      },
      {} as Record<PlanType, number>,
    );
  });

  // Helper functions
  function getPlanIcon(type: PlanType) {
    switch (type) {
      case 'project':
        return FolderKanban;
      case 'adventure':
        return Compass;
      case 'theme':
        return Palette;
      case 'other':
        return FileText;
      default:
        return FolderKanban;
    }
  }

  function getPlanEmoji(type: PlanType) {
    switch (type) {
      case 'project':
        return '🔧';
      case 'adventure':
        return '🏔️';
      case 'theme':
        return '🎨';
      case 'other':
        return '📋';
      default:
        return '📋';
    }
  }

  function getPlanTypeColor(type: PlanType) {
    switch (type) {
      case 'project':
        return 'badge-primary';
      case 'adventure':
        return 'badge-secondary';
      case 'theme':
        return 'badge-accent';
      case 'other':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  }

  function getPlanTypeLabel(type: PlanType) {
    switch (type) {
      case 'project':
        return 'Project';
      case 'adventure':
        return 'Adventure';
      case 'theme':
        return 'Theme';
      case 'other':
        return 'Other';
      default:
        return 'Unknown';
    }
  }

  // Navigation functions
  function createPlan() {
    goto('/plans/create');
  }

  function editPlan(planId: string) {
    goto(`/plans/${planId}/edit`);
  }

  function viewPlanDetails(planId: string) {
    goto(`/plans/${planId}`);
  }

  // Plan actions
  async function deletePlan(plan: PlanResponse) {
    if (!confirm(`Are you sure you want to delete "${plan.title}"? This will also delete all subtasks and cannot be undone.`)) {
      return;
    }

    try {
      await plansApi.deletePlan(plan.id);
      await loadPlansData(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete plan:', err);
      error = err instanceof Error ? err.message : 'Failed to delete plan';
    }
  }

  // Type filter options
  const typeOptions: { value: PlanType | 'all'; label: string; icon: any; emoji: string }[] = [
    { value: 'all', label: 'All Plans', icon: FileText, emoji: '📋' },
    { value: 'project', label: 'Projects', icon: FolderKanban, emoji: '🔧' },
    { value: 'adventure', label: 'Adventures', icon: Compass, emoji: '🏔️' },
    { value: 'theme', label: 'Themes', icon: Palette, emoji: '🎨' },
    { value: 'other', label: 'Other', icon: FileText, emoji: '📄' },
  ];
</script>

<svelte:head>
  <title>Plans - Gamified Life</title>
  <meta name="description" content="Organize your plans, adventures, and themes with structured task management" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center gap-3">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content w-12 rounded-full">
            <FolderKanban size={24} />
          </div>
        </div>
        <div>
          <h1 class="text-primary text-3xl font-bold">Plans</h1>
          <p class="text-base-content/70">Organize plans, adventures, and themes with structured task management</p>
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
          <p class="text-base-content/60">Loading your plans...</p>
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
      <!-- Plans Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Plans Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          <!-- Filter Tabs -->
          <div class="tabs tabs-boxed bg-base-100 p-1">
            {#each typeOptions as option (option.value)}
              <button class="tab {selectedType === option.value ? 'tab-active' : ''}" onclick={() => (selectedType = option.value)}>
                <span class="mr-2">{option.emoji}</span>
                {option.label}
                {#if option.value !== 'all' && planStats()[option.value as PlanType]}
                  <span class="badge badge-sm ml-2">{planStats()[option.value as PlanType]}</span>
                {/if}
              </button>
            {/each}
          </div>

          <!-- Plans Section -->
          {#if filteredPlans.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">
                {selectedType === 'all' ? 'All Plans' : `${getPlanTypeLabel(selectedType as PlanType)}s`}
                <span class="text-base-content/60 text-base font-normal">({filteredPlans.length})</span>
              </h2>
              <div class="grid gap-6 md:grid-cols-2">
                {#each filteredPlans as plan (plan.id)}
                  <div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="text-2xl">
                            {getPlanEmoji(plan.type)}
                          </div>
                          <div class="flex-1">
                            <h3 class="text-lg font-bold">{plan.title}</h3>
                            <p class="text-base-content/60 text-sm">Created {formatDateTime(plan.createdAt, 'date-only')}</p>
                            {#if plan.lastActivityAt}
                              <p class="text-base-content/50 text-xs">Last activity {formatDateTime(plan.lastActivityAt, 'date-only')}</p>
                            {/if}
                          </div>
                        </div>

                        <!-- Type Badge -->
                        <div class="badge {getPlanTypeColor(plan.type)}">
                          {getPlanTypeLabel(plan.type)}
                        </div>
                      </div>

                      {#if plan.description}
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        <p class="text-base-content/80 prose prose-sm mb-4 text-sm">{@html DOMPurify.sanitize(String(marked.parse(plan.description)))}</p>
                      {/if}

                      <!-- Plan Features -->
                      <div class="mb-4 flex flex-wrap gap-2">
                        {#if plan.isOrdered}
                          <div class="badge badge-outline badge-sm gap-1">
                            <Calendar size={12} />
                            Ordered Tasks
                          </div>
                        {/if}
                        {#if plan.focusId}
                          <div class="badge badge-outline badge-sm gap-1">📎 Linked to Focus</div>
                        {/if}
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewPlanDetails(plan.id)}>
                          <Eye size={14} />
                          View
                        </button>
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => editPlan(plan.id)}>
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <div class="dropdown dropdown-end">
                          <button tabindex="0" class="btn btn-ghost btn-sm gap-1">
                            <MoreVertical size={14} />
                          </button>
                          <ul class="dropdown-content menu bg-base-100 border-base-300 rounded-box z-10 w-52 border p-2 shadow">
                            <li>
                              <button class="text-error hover:bg-error hover:text-error-content" onclick={() => deletePlan(plan)}>
                                <Trash2 size={14} />
                                Delete Plan
                              </button>
                            </li>
                          </ul>
                        </div>
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
                      {#if selectedType === 'all'}
                        <FolderKanban size={40} />
                      {:else}
                        {@const IconComponent = getPlanIcon(selectedType as PlanType)}
                        <IconComponent size={40} />
                      {/if}
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">
                    {selectedType === 'all' ? 'No Plans Yet' : `No ${getPlanTypeLabel(selectedType as PlanType)}s`}
                  </h3>
                  <p class="text-base-content/60 mb-6">
                    {selectedType === 'all'
                      ? 'Start organizing your work with structured plans and subtasks.'
                      : `Create your first ${getPlanTypeLabel(selectedType as PlanType).toLowerCase()} to get started.`}
                  </p>
                  <button onclick={createPlan} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Create Your First Plan
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
                    <span class="text-sm">Total Plans:</span>
                    <span class="font-medium">{userPlans.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Projects:</span>
                    <span class="font-medium">{planStats().project || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Adventures:</span>
                    <span class="font-medium">{planStats().adventure || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Themes:</span>
                    <span class="font-medium">{planStats().theme || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Other:</span>
                    <span class="font-medium">{planStats().other || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Plan Types Info Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Plan Types</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🔧</span>
                    <div>
                      <div class="font-medium">Projects</div>
                      <div class="text-base-content/70">Structured work with ordered steps</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🏔️</span>
                    <div>
                      <div class="font-medium">Adventures</div>
                      <div class="text-base-content/70">Flexible goals with unordered objectives</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🎨</span>
                    <div>
                      <div class="font-medium">Themes</div>
                      <div class="text-base-content/70">Organized collections of related tasks</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-lg">📄</span>
                    <div>
                      <div class="font-medium">Other</div>
                      <div class="text-base-content/70">Everything else that needs organizing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Actions</h3>
                <div class="space-y-3">
                  <button onclick={createPlan} class="btn btn-primary w-full gap-2">
                    <Plus size={16} />
                    Create Plan
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
