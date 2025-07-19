<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { plansApi, type PlanResponse, type UpdatePlanRequest, type PlanType } from '$lib/api/plans';
  import { getAllFocuses, type Focus, getDayName } from '$lib/api/focus';
  import { ArrowLeft, Save, FolderKanban, Compass, Palette, FileText, Calendar, Link, Target } from 'lucide-svelte';

  // Get plan ID from URL params
  let planId = $derived($page.params.id);

  // Reactive state
  let plan: PlanResponse | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let allFocuses: Focus[] = $state([]);
  let focusesLoading = $state(false);

  // Form data
  let formData: UpdatePlanRequest & { focusId?: string } = $state({
    title: '',
    description: '',
    type: 'project',
    isOrdered: true,
    focusId: undefined,
  });

  // Form state
  let isSubmitting = $state(false);

  // Load data on component mount and when planId changes
  onMount(async () => {
    await loadData();
  });

  $effect(() => {
    if (planId) {
      loadData();
    }
  });

  // Load plan data
  async function loadData() {
    if (!planId) return;

    try {
      loading = true;
      error = null;

      const planData = await plansApi.getPlan(planId);

      plan = planData;

      // Populate form with current plan data
      formData = {
        title: planData.title,
        description: planData.description || '',
        type: planData.type,
        isOrdered: planData.isOrdered,
        focusId: planData.focusId || undefined,
      };

      // Load focuses if we don't have them yet
      if (allFocuses.length === 0) {
        try {
          focusesLoading = true;
          allFocuses = await getAllFocuses();
        } catch (err) {
          console.warn('Failed to load focuses:', err);
          // Don't fail the whole operation if focuses can't be loaded
        } finally {
          focusesLoading = false;
        }
      }
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

  // Plan type options
  const planTypeOptions: { value: PlanType; label: string; icon: any; emoji: string; description: string }[] = [
    {
      value: 'project',
      label: 'Project',
      icon: FolderKanban,
      emoji: '🔧',
      description: 'Structured work with ordered steps that build towards a goal',
    },
    {
      value: 'adventure',
      label: 'Adventure',
      icon: Compass,
      emoji: '🏔️',
      description: 'Flexible goals with unordered objectives to explore and experience',
    },
    {
      value: 'theme',
      label: 'Theme',
      icon: Palette,
      emoji: '🎨',
      description: 'Organized collections of related tasks around a central concept',
    },
    {
      value: 'other',
      label: 'Other',
      icon: FileText,
      emoji: '📄',
      description: 'Everything else that needs organizing and tracking',
    },
  ];

  // Get current plan type details
  let selectedTypeDetails = $derived(planTypeOptions.find((option) => option.value === formData.type) || planTypeOptions[0]);

  // Validation
  let isValidTitle = $derived(formData.title && formData.title.trim().length >= 3);
  let canSubmit = $derived(isValidTitle && !isSubmitting && plan);

  // Form handlers
  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!canSubmit || !plan) return;

    try {
      isSubmitting = true;
      error = null;

      // Prepare the data
      const updateData: UpdatePlanRequest = {
        title: formData.title?.trim() || '',
        description: formData.description?.trim() || undefined,
        type: formData.type,
        isOrdered: formData.isOrdered,
        focusId: formData.focusId || undefined,
      };

      await plansApi.updatePlan(plan.id, updateData);

      // Redirect back to plan details
      goto(`/plans/${plan.id}`);
    } catch (err) {
      console.error('Failed to update plan:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to update plan';
    } finally {
      isSubmitting = false;
    }
  }

  function goBack() {
    if (plan) {
      goto(`/plans/${plan.id}`);
    } else {
      goto('/plans');
    }
  }

  // Auto-update isOrdered based on plan type
  $effect(() => {
    if (formData.type === 'project') {
      formData.isOrdered = true;
    } else if (formData.type === 'adventure') {
      formData.isOrdered = false;
    }
    // For theme and other, keep user's choice
  });
</script>

<svelte:head>
  <title>{plan ? `Edit ${plan.title} - Gamified Life` : 'Edit Plan - Gamified Life'}</title>
  <meta name="description" content="Edit plan details and settings" />
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
          Go Back
        </button>
      </div>
    </div>
  {:else if plan}
    <!-- Page Header -->
    <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
      <div class="mx-auto max-w-4xl px-4 py-6">
        <div class="flex items-center gap-4">
          <button onclick={goBack} class="btn btn-ghost btn-circle">
            <ArrowLeft size={20} />
          </button>
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content w-10 rounded-full">
                <Save size={20} />
              </div>
            </div>
            <div>
              <h1 class="text-primary text-2xl font-bold">Edit Plan</h1>
              <p class="text-base-content/70">Update your plan details and settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      <form onsubmit={handleSubmit} class="space-y-8">
        <!-- Error Display -->
        {#if error}
          <div class="alert alert-error">
            <div class="flex items-center gap-3">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        {/if}

        <div class="grid gap-8 lg:grid-cols-3">
          <!-- Main Form (2/3 width) -->
          <div class="space-y-6 lg:col-span-2">
            <!-- Basic Info Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-lg">Basic Information</h2>

                <!-- Title -->
                <div class="form-control">
                  <label class="label" for="title">
                    <span class="label-text font-medium">Plan Title <span class="text-error">*</span></span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    bind:value={formData.title}
                    class="input input-bordered {!isValidTitle && formData.title && formData.title.length > 0 ? 'input-error' : ''}"
                    placeholder="Enter a descriptive title for your plan..."
                    maxlength="200"
                    required
                  />
                  <div class="label">
                    <span class="label-text-alt {!isValidTitle && formData.title && formData.title.length > 0 ? 'text-error' : 'text-base-content/60'}">
                      {#if !isValidTitle && formData.title && formData.title.length > 0}
                        Title must be at least 3 characters long
                      {:else}
                        {formData.title?.length || 0}/200 characters
                      {/if}
                    </span>
                  </div>
                </div>

                <!-- Description -->
                <div class="form-control">
                  <label class="label" for="description">
                    <span class="label-text font-medium">Description</span>
                  </label>
                  <textarea
                    id="description"
                    bind:value={formData.description}
                    class="textarea textarea-bordered h-24 resize-none"
                    placeholder="Describe your plan and its goals... (Markdown supported)"
                    maxlength="1000"
                  ></textarea>
                  <div class="label">
                    <span class="label-text-alt text-base-content/60">
                      {formData.description?.length || 0}/1000 characters • Markdown supported
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Plan Type Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-lg">Plan Type</h2>
                <p class="text-base-content/70 mb-4 text-sm">Choose the type that best describes your plan</p>

                <div class="grid gap-3 sm:grid-cols-2">
                  {#each planTypeOptions as option (option.value)}
                    <label class="cursor-pointer">
                      <input type="radio" bind:group={formData.type} value={option.value} class="sr-only" />
                      <div
                        class="card border-2 transition-all duration-200 {formData.type === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-base-300 hover:border-base-400'}"
                      >
                        <div class="card-body p-4">
                          <div class="flex items-center gap-3">
                            <div class="text-2xl">{option.emoji}</div>
                            <div class="flex-1">
                              <h3 class="font-semibold">{option.label}</h3>
                              <p class="text-base-content/70 text-xs">{option.description}</p>
                            </div>
                            {#if formData.type === option.value}
                              <div class="badge badge-primary badge-sm">Selected</div>
                            {/if}
                          </div>
                        </div>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Settings Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body">
                <h2 class="card-title text-lg">Settings</h2>

                <!-- Task Ordering -->
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      bind:checked={formData.isOrdered}
                      class="checkbox checkbox-primary"
                      disabled={formData.type === 'project' || formData.type === 'adventure'}
                    />
                    <div class="flex-1">
                      <span class="label-text flex items-center gap-2 font-medium">
                        <Calendar size={16} />
                        Ordered Tasks
                      </span>
                      <span class="label-text-alt block">
                        {#if formData.type === 'project'}
                          Projects always use ordered tasks for structured workflows
                        {:else if formData.type === 'adventure'}
                          Adventures use unordered tasks for flexible exploration
                        {:else}
                          Tasks have a specific order and should be completed sequentially
                        {/if}
                      </span>
                    </div>
                  </label>
                </div>

                <!-- Focus Linking -->
                {#if allFocuses.length > 0}
                  <div class="form-control">
                    <label class="label" for="focusId">
                      <span class="label-text flex items-center gap-2 font-medium">
                        <Target size={16} />
                        Link to Focus (Optional)
                      </span>
                    </label>
                    <select
                      id="focusId"
                      bind:value={formData.focusId}
                      class="select select-bordered w-full"
                    >
                      <option value="">No focus link</option>
                      {#each allFocuses as focus (focus.id)}
                        <option value={focus.id}>
                          {focus.title} ({getDayName(focus.dayOfWeek, 'short')})
                        </option>
                      {/each}
                    </select>
                    <div class="label">
                      <span class="label-text-alt text-base-content/60">
                        Link this plan to a daily focus theme
                      </span>
                    </div>
                  </div>
                {:else if focusesLoading}
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text flex items-center gap-2 font-medium">
                        <Target size={16} />
                        Link to Focus (Optional)
                      </span>
                    </label>
                    <div class="skeleton h-12 w-full"></div>
                  </div>
                {:else}
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text flex items-center gap-2 font-medium">
                        <Target size={16} />
                        Link to Focus (Optional)
                      </span>
                    </label>
                    <div class="alert alert-info">
                      <div class="text-sm">
                        <div>No focuses available</div>
                        <div class="mt-1">
                          <a href="/focus" class="link link-primary">Create some focuses first</a> to link plans to daily themes.
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Sidebar (1/3 width) -->
          <div class="lg:col-span-1">
            <div class="sticky top-8 space-y-6">
              <!-- Selected Type Preview -->
              <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
                <div class="card-body p-6">
                  <h3 class="text-primary mb-3 font-semibold">Selected Type</h3>
                  <div class="mb-3 flex items-center gap-3">
                    <div class="text-3xl">{selectedTypeDetails.emoji}</div>
                    <div>
                      <h4 class="font-semibold">{selectedTypeDetails.label}</h4>
                      <p class="text-base-content/70 text-sm">{selectedTypeDetails.description}</p>
                    </div>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Task Order: {formData.isOrdered ? 'Sequential' : 'Flexible'}</span>
                    </div>
                    {#if formData.focusId}
                      {@const selectedFocus = allFocuses.find(f => f.id === formData.focusId)}
                      {#if selectedFocus}
                        <div class="flex items-center gap-2">
                          <Target size={14} class="text-primary" />
                          <span>Linked to {selectedFocus.title} ({getDayName(selectedFocus.dayOfWeek, 'short')})</span>
                        </div>
                      {/if}
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <div class="space-y-3">
                    <button type="submit" disabled={!canSubmit} class="btn btn-primary w-full gap-2 {isSubmitting ? 'loading' : ''}">
                      {#if isSubmitting}
                        <span class="loading loading-spinner loading-sm"></span>
                        Saving...
                      {:else}
                        <Save size={16} />
                        Save Changes
                      {/if}
                    </button>
                    <button type="button" onclick={goBack} class="btn btn-ghost w-full gap-2" disabled={isSubmitting}>
                      <ArrowLeft size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <!-- Changes Warning -->
              <div class="alert alert-info">
                <div>
                  <div class="font-medium">💡 Type Change Impact</div>
                  <div class="mt-1 text-sm">Changing the plan type will update task ordering behavior but won't affect existing subtasks.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
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
          <p class="text-base-content/60 mb-6">The plan you're trying to edit doesn't exist or you don't have access to it.</p>
          <button onclick={goBack} class="btn btn-primary gap-2">
            <ArrowLeft size={16} />
            Back to Plans
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
