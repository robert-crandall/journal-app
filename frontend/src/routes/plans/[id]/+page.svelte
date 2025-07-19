<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { plansApi, type PlanResponse, type PlanSubtaskResponse, type CreatePlanSubtaskRequest, type UpdatePlanSubtaskRequest } from '$lib/api/plans';
  import {
    ArrowLeft,
    Plus,
    Edit3,
    Trash2,
    MoreVertical,
    Check,
    Circle,
    Calendar,
    Link,
    FolderKanban,
    Compass,
    Palette,
    FileText,
    ArrowUp,
    ArrowDown,
  } from 'lucide-svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { formatDateTime } from '$lib/utils/date';

  // Get plan ID from URL params
  let planId = $derived($page.params.id);

  // Reactive state
  let plan: PlanResponse | null = $state(null);
  let subtasks: PlanSubtaskResponse[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Subtask creation state
  let showCreateSubtask = $state(false);
  let newSubtaskTitle = $state('');
  let newSubtaskDescription = $state('');
  let isCreatingSubtask = $state(false);

  // Editing state
  let editingSubtask: string | null = $state(null);
  let editTitle = $state('');
  let editDescription = $state('');
  let isUpdatingSubtask = $state(false);

  // Load data on component mount and when planId changes
  onMount(async () => {
    await loadPlanData();
  });

  $effect(() => {
    if (planId) {
      loadPlanData();
    }
  });

  // Load plan and subtasks data
  async function loadPlanData() {
    if (!planId) return;

    try {
      loading = true;
      error = null;

      // Load plan with subtasks (API returns plan with subtasks included)
      const planWithSubtasks = await plansApi.getPlan(planId);

      plan = {
        id: planWithSubtasks.id,
        title: planWithSubtasks.title,
        type: planWithSubtasks.type,
        description: planWithSubtasks.description,
        focusId: planWithSubtasks.focusId,
        isOrdered: planWithSubtasks.isOrdered,
        lastActivityAt: planWithSubtasks.lastActivityAt,
        createdAt: planWithSubtasks.createdAt,
        updatedAt: planWithSubtasks.updatedAt,
      };
      subtasks = planWithSubtasks.subtasks;
    } catch (err) {
      console.error('Failed to load plan:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load plan';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getPlanIcon(type: string) {
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

  function getPlanEmoji(type: string) {
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

  function getPlanTypeColor(type: string) {
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

  function getPlanTypeLabel(type: string) {
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

  // Progress calculation
  let completedCount = $derived(subtasks.filter((t) => t.isCompleted).length);
  let totalCount = $derived(subtasks.length);
  let progressPercentage = $derived(totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

  // Navigation functions
  function goBack() {
    goto('/plans');
  }

  function editPlan() {
    if (!plan) return;
    goto(`/plans/${plan.id}/edit`);
  }

  // Subtask actions
  async function createSubtask() {
    if (!plan || !newSubtaskTitle.trim() || isCreatingSubtask) return;

    try {
      isCreatingSubtask = true;

      const subtaskData: CreatePlanSubtaskRequest = {
        title: newSubtaskTitle.trim(),
        description: newSubtaskDescription.trim() || undefined,
      };

      await plansApi.createSubtask(plan.id, subtaskData);

      // Reset form and reload data
      newSubtaskTitle = '';
      newSubtaskDescription = '';
      showCreateSubtask = false;
      await loadPlanData();
    } catch (err) {
      console.error('Failed to create subtask:', err);
      error = err instanceof Error ? err.message : 'Failed to create subtask';
    } finally {
      isCreatingSubtask = false;
    }
  }

  async function toggleSubtaskCompletion(subtask: PlanSubtaskResponse) {
    try {
      await plansApi.completeSubtask(plan!.id, subtask.id, !subtask.isCompleted);
      await loadPlanData(); // Refresh to get updated data
    } catch (err) {
      console.error('Failed to update subtask:', err);
      error = err instanceof Error ? err.message : 'Failed to update subtask';
    }
  }

  function startEditingSubtask(subtask: PlanSubtaskResponse) {
    editingSubtask = subtask.id;
    editTitle = subtask.title;
    editDescription = subtask.description || '';
  }

  function cancelEditingSubtask() {
    editingSubtask = null;
    editTitle = '';
    editDescription = '';
  }

  async function saveSubtaskEdit(subtaskId: string) {
    if (!editTitle.trim() || isUpdatingSubtask || !plan) return;

    try {
      isUpdatingSubtask = true;

      const updateData: UpdatePlanSubtaskRequest = {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      };

      await plansApi.updateSubtask(plan.id, subtaskId, updateData);
      await loadPlanData(); // Refresh data
      cancelEditingSubtask();
    } catch (err) {
      console.error('Failed to update subtask:', err);
      error = err instanceof Error ? err.message : 'Failed to update subtask';
    } finally {
      isUpdatingSubtask = false;
    }
  }

  async function deleteSubtask(subtask: PlanSubtaskResponse) {
    if (!confirm(`Are you sure you want to delete "${subtask.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await plansApi.deleteSubtask(plan!.id, subtask.id);
      await loadPlanData(); // Refresh data
    } catch (err) {
      console.error('Failed to delete subtask:', err);
      error = err instanceof Error ? err.message : 'Failed to delete subtask';
    }
  }

  async function moveSubtaskUp(subtask: PlanSubtaskResponse) {
    if (!plan?.isOrdered) return;

    // Find the current index of the subtask
    const currentIndex = subtasks.findIndex((s) => s.id === subtask.id);
    if (currentIndex <= 0) return; // Already at the top

    // Create new order by swapping with the previous item
    const newOrder = [...subtasks];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    const subtaskIds = newOrder.map((s) => s.id);

    try {
      await plansApi.reorderSubtasks(plan.id, subtaskIds);
      await loadPlanData(); // Refresh data
    } catch (err) {
      console.error('Failed to reorder subtask:', err);
      error = err instanceof Error ? err.message : 'Failed to reorder subtask';
    }
  }

  async function moveSubtaskDown(subtask: PlanSubtaskResponse) {
    if (!plan?.isOrdered) return;

    // Find the current index of the subtask
    const currentIndex = subtasks.findIndex((s) => s.id === subtask.id);
    if (currentIndex >= subtasks.length - 1) return; // Already at the bottom

    // Create new order by swapping with the next item
    const newOrder = [...subtasks];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    const subtaskIds = newOrder.map((s) => s.id);

    try {
      await plansApi.reorderSubtasks(plan.id, subtaskIds);
      await loadPlanData(); // Refresh data
    } catch (err) {
      console.error('Failed to reorder subtask:', err);
      error = err instanceof Error ? err.message : 'Failed to reorder subtask';
    }
  }

  async function deletePlan() {
    if (!plan) return;

    if (!confirm(`Are you sure you want to delete "${plan.title}"? This will also delete all subtasks and cannot be undone.`)) {
      return;
    }

    try {
      await plansApi.deletePlan(plan.id);
      goto('/plans');
    } catch (err) {
      console.error('Failed to delete plan:', err);
      error = err instanceof Error ? err.message : 'Failed to delete plan';
    }
  }

  // Cancel create subtask form
  function cancelCreateSubtask() {
    showCreateSubtask = false;
    newSubtaskTitle = '';
    newSubtaskDescription = '';
  }
</script>

<svelte:head>
  <title>{plan ? `${plan.title} - Gamified Life` : 'Plan Details - Gamified Life'}</title>
  <meta name="description" content={plan ? `Manage ${plan.title} and track progress on its subtasks` : 'View and manage plan details'} />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-20">
      <div class="space-y-4 text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60">Loading plan details...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="mx-auto max-w-md px-4 py-20">
      <div class="alert alert-error">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      </div>
      <div class="mt-4 text-center">
        <button onclick={goBack} class="btn btn-ghost gap-2">
          <ArrowLeft size={16} />
          Back to Plans
        </button>
      </div>
    </div>
  {:else if plan}
    <!-- Page Header -->
    <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
      <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <button onclick={goBack} class="btn btn-ghost btn-circle">
              <ArrowLeft size={20} />
            </button>
            <div class="flex items-center gap-3">
              <div class="text-3xl">{getPlanEmoji(plan.type)}</div>
              <div>
                <div class="mb-1 flex items-center gap-3">
                  <h1 class="text-primary text-2xl font-bold">{plan.title}</h1>
                  <div class="badge {getPlanTypeColor(plan.type)}">
                    {getPlanTypeLabel(plan.type)}
                  </div>
                </div>
                <p class="text-base-content/70">
                  Created {formatDateTime(plan.createdAt, 'date-only')}
                  {#if plan.lastActivityAt}
                    • Last activity {formatDateTime(plan.lastActivityAt, 'date-only')}
                  {/if}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions Dropdown -->
          <div class="dropdown dropdown-end">
            <button tabindex="0" class="btn btn-ghost btn-circle">
              <MoreVertical size={20} />
            </button>
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <ul tabindex="0" class="dropdown-content menu bg-base-100 border-base-300 rounded-box z-10 w-52 border p-2 shadow">
              <li>
                <button onclick={editPlan}>
                  <Edit3 size={16} />
                  Edit Plan
                </button>
              </li>
              <li>
                <button class="text-error hover:bg-error hover:text-error-content" onclick={deletePlan}>
                  <Trash2 size={16} />
                  Delete Plan
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Main Content (2/3 width) -->
        <div class="space-y-8 lg:col-span-2">
          <!-- Plan Description -->
          {#if plan.description}
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-lg">Description</h2>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <div class="prose prose-sm max-w-none">{@html DOMPurify.sanitize(String(marked.parse(plan.description)))}</div>
              </div>
            </div>
          {/if}

          <!-- Subtasks Section -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body">
              <div class="mb-6 flex items-center justify-between">
                <h2 class="card-title text-lg">
                  Subtasks
                  <span class="text-base-content/60 text-base font-normal">({completedCount}/{totalCount})</span>
                </h2>
                <button onclick={() => (showCreateSubtask = true)} class="btn btn-primary btn-sm gap-2">
                  <Plus size={16} />
                  Add Subtask
                </button>
              </div>

              <!-- Progress Bar -->
              {#if totalCount > 0}
                <div class="mb-6">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-sm font-medium">Progress</span>
                    <span class="text-sm">{progressPercentage}%</span>
                  </div>
                  <progress class="progress progress-primary w-full" value={progressPercentage} max="100"></progress>
                </div>
              {/if}

              <!-- Create Subtask Form -->
              {#if showCreateSubtask}
                <div class="card bg-base-200 border-base-300 mb-6 border">
                  <div class="card-body p-4">
                    <h3 class="mb-3 font-semibold">Create New Subtask</h3>
                    <div class="space-y-3">
                      <input type="text" bind:value={newSubtaskTitle} class="input input-bordered w-full" placeholder="Subtask title..." maxlength="200" />
                      <textarea
                        bind:value={newSubtaskDescription}
                        class="textarea textarea-bordered w-full"
                        placeholder="Description (optional)..."
                        rows="2"
                        maxlength="1000"
                      ></textarea>
                      <div class="flex gap-2">
                        <button
                          onclick={createSubtask}
                          disabled={!newSubtaskTitle.trim() || isCreatingSubtask}
                          class="btn btn-primary btn-sm gap-2 {isCreatingSubtask ? 'loading' : ''}"
                        >
                          {#if isCreatingSubtask}
                            <span class="loading loading-spinner loading-sm"></span>
                            Creating...
                          {:else}
                            <Plus size={14} />
                            Create
                          {/if}
                        </button>
                        <button onclick={cancelCreateSubtask} class="btn btn-ghost btn-sm" disabled={isCreatingSubtask}> Cancel </button>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Subtasks List -->
              {#if subtasks.length > 0}
                <div class="space-y-3">
                  {#each subtasks as subtask, index (subtask.id)}
                    <div
                      class="card border-2 transition-all duration-200 {subtask.isCompleted ? 'border-success/30 bg-success/5' : 'border-base-300 bg-base-100'}"
                    >
                      <div class="card-body p-4">
                        {#if editingSubtask === subtask.id}
                          <!-- Edit Mode -->
                          <div class="space-y-3">
                            <input type="text" bind:value={editTitle} class="input input-bordered w-full" placeholder="Subtask title..." maxlength="200" />
                            <textarea
                              bind:value={editDescription}
                              class="textarea textarea-bordered w-full"
                              placeholder="Description (optional)..."
                              rows="2"
                              maxlength="1000"
                            ></textarea>
                            <div class="flex gap-2">
                              <button
                                onclick={() => saveSubtaskEdit(subtask.id)}
                                disabled={!editTitle.trim() || isUpdatingSubtask}
                                class="btn btn-primary btn-sm gap-2 {isUpdatingSubtask ? 'loading' : ''}"
                              >
                                {#if isUpdatingSubtask}
                                  <span class="loading loading-spinner loading-sm"></span>
                                  Saving...
                                {:else}
                                  <Check size={14} />
                                  Save
                                {/if}
                              </button>
                              <button onclick={cancelEditingSubtask} class="btn btn-ghost btn-sm" disabled={isUpdatingSubtask}> Cancel </button>
                            </div>
                          </div>
                        {:else}
                          <!-- View Mode -->
                          <div class="flex items-start gap-3">
                            <!-- Completion Toggle -->
                            <button onclick={() => toggleSubtaskCompletion(subtask)} class="btn btn-ghost btn-sm btn-circle mt-1 p-0">
                              {#if subtask.isCompleted}
                                <Check size={20} class="text-success" />
                              {:else}
                                <Circle size={20} class="text-base-content/50" />
                              {/if}
                            </button>

                            <!-- Content -->
                            <div class="flex-1">
                              <h4 class="font-medium {subtask.isCompleted ? 'text-base-content/60 line-through' : ''}">
                                {subtask.title}
                              </h4>
                              {#if subtask.description}
                                <p class="text-base-content/70 mt-1 text-sm {subtask.isCompleted ? 'line-through' : ''}">
                                  {subtask.description}
                                </p>
                              {/if}
                              {#if subtask.completedAt}
                                <p class="text-success mt-1 text-xs">
                                  Completed {formatDateTime(subtask.completedAt, 'date-only')}
                                </p>
                              {/if}
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex items-center gap-1">
                              {#if plan.isOrdered}
                                <button onclick={() => moveSubtaskUp(subtask)} disabled={index === 0} class="btn btn-ghost btn-xs btn-circle" title="Move up">
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onclick={() => moveSubtaskDown(subtask)}
                                  disabled={index === subtasks.length - 1}
                                  class="btn btn-ghost btn-xs btn-circle"
                                  title="Move down"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              {/if}

                              <div class="dropdown dropdown-end">
                                <button tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                                  <MoreVertical size={14} />
                                </button>
                                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                                <ul tabindex="0" class="dropdown-content menu bg-base-100 border-base-300 rounded-box z-10 w-40 border p-2 shadow">
                                  <li>
                                    <button onclick={() => startEditingSubtask(subtask)}>
                                      <Edit3 size={12} />
                                      Edit
                                    </button>
                                  </li>
                                  <li>
                                    <button class="text-error hover:bg-error hover:text-error-content" onclick={() => deleteSubtask(subtask)}>
                                      <Trash2 size={12} />
                                      Delete
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <!-- Empty Subtasks -->
                <div class="py-12 text-center">
                  <div class="avatar placeholder mb-4">
                    <div class="bg-base-300 text-base-content w-16 rounded-full">
                      <Circle size={32} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-lg font-semibold">No Subtasks Yet</h3>
                  <p class="text-base-content/60 mb-4">Break down your plan into manageable subtasks.</p>
                  <button onclick={() => (showCreateSubtask = true)} class="btn btn-primary gap-2">
                    <Plus size={16} />
                    Add First Subtask
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Sidebar (1/3 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Plan Info Card -->
            <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
              <div class="card-body p-6">
                <h3 class="text-primary mb-4 font-semibold">Plan Info</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm">Type:</span>
                    <span class="font-medium">{getPlanTypeLabel(plan.type)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Task Order:</span>
                    <span class="font-medium">{plan.isOrdered ? 'Sequential' : 'Flexible'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Progress:</span>
                    <span class="font-medium">{progressPercentage}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Total Tasks:</span>
                    <span class="font-medium">{totalCount}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Completed:</span>
                    <span class="text-success font-medium">{completedCount}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Remaining:</span>
                    <span class="font-medium">{totalCount - completedCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Features Info Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Features</h3>
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <Calendar size={16} />
                    <span class="text-sm">
                      {plan.isOrdered ? 'Sequential Tasks' : 'Flexible Tasks'}
                    </span>
                  </div>
                  {#if plan.focusId}
                    <div class="flex items-center gap-2">
                      <Link size={16} />
                      <span class="text-sm">Linked to Focus</span>
                    </div>
                  {/if}
                  <div class="flex items-center gap-2">
                    <Check size={16} />
                    <span class="text-sm">Progress Tracking</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Actions</h3>
                <div class="space-y-3">
                  <button onclick={editPlan} class="btn btn-primary w-full gap-2">
                    <Edit3 size={16} />
                    Edit Plan
                  </button>
                  <button onclick={() => (showCreateSubtask = true)} class="btn btn-ghost w-full gap-2">
                    <Plus size={16} />
                    Add Subtask
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Plan not found -->
    <div class="mx-auto max-w-md px-4 py-20">
      <div class="card bg-base-100 border-base-300 border shadow-xl">
        <div class="card-body py-12 text-center">
          <div class="avatar placeholder mb-6">
            <div class="bg-base-300 text-base-content w-20 rounded-full">
              <FolderKanban size={40} />
            </div>
          </div>
          <h3 class="mb-2 text-xl font-semibold">Plan Not Found</h3>
          <p class="text-base-content/60 mb-6">The plan you're looking for doesn't exist or you don't have access to it.</p>
          <button onclick={goBack} class="btn btn-primary gap-2">
            <ArrowLeft size={16} />
            Back to Plans
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
