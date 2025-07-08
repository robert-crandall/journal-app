<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { goalsApi, type GoalWithParsedTags, type UpdateGoalWithTags } from '$lib/api/goals';
  import tagsApi, { type TagWithCount } from '$lib/api/tags';
  import { Target, Plus, X, Save, ArrowLeft } from 'lucide-svelte';

  // Get goal ID from route params
  const goalId = $page.params.id;

  // Form state
  let title = $state('');
  let description = $state('');
  let tagInput = $state('');
  let tags = $state<string[]>([]);
  let isActive = $state(true);
  let isArchived = $state(false);

  // UI state
  let loading = $state(false);
  let loadingGoal = $state(true);
  let error = $state<string | null>(null);
  let tagSuggestions = $state<TagWithCount[]>([]);
  let filteredSuggestions = $state<TagWithCount[]>([]);
  let showSuggestions = $state(false);

  // Original goal data for comparison
  let originalGoal: GoalWithParsedTags | null = $state(null);

  // Form validation
  let titleTouched = $state(false);
  let isValid = $derived(title.trim().length > 0 && title.length <= 255);

  // Load goal data and tag suggestions on mount
  onMount(async () => {
    await Promise.all([
      loadGoal(),
      loadTagSuggestions()
    ]);
  });

  async function loadTagSuggestions() {
    try {
      tagSuggestions = await tagsApi.getUserTags();
    } catch (err) {
      console.error('Failed to load tag suggestions:', err);
      // Non-critical error, don't show to user
    }
  }

  async function loadGoal() {
    try {
      loadingGoal = true;
      error = null;

      const goal = await goalsApi.getGoal(goalId);
      originalGoal = goal;

      // Populate form with current values
      title = goal.title;
      description = goal.description || '';
      tags = [...goal.tags];
      isActive = goal.isActive;
      isArchived = goal.isArchived;
    } catch (err) {
      console.error('Failed to load goal:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load goal';
    } finally {
      loadingGoal = false;
    }
  }

  // Handle tag input and suggestions
  function updateSuggestions() {
    const input = tagInput.trim().toLowerCase();
    if (!input) {
      filteredSuggestions = [];
      showSuggestions = false;
      return;
    }
    
    filteredSuggestions = tagSuggestions
      .filter(tag => 
        tag.name.toLowerCase().includes(input) && 
        !tags.includes(tag.name.toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    showSuggestions = filteredSuggestions.length > 0;
  }

  function addTag() {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      tags = [...tags, trimmedTag];
      tagInput = '';
      showSuggestions = false;
    }
  }

  function selectSuggestion(tagName: string) {
    if (!tags.includes(tagName)) {
      tags = [...tags, tagName];
    }
    tagInput = '';
    showSuggestions = false;
  }

  function removeTag(tagToRemove: string) {
    tags = tags.filter((tag) => tag !== tagToRemove);
  }

  function handleTagKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    } else {
      updateSuggestions();
    }
  }

  // Check if form has changes
  function checkChanges(): boolean {
    if (!originalGoal) return false;

    return (
      title !== originalGoal.title ||
      description !== (originalGoal.description || '') ||
      JSON.stringify(tags.sort()) !== JSON.stringify(originalGoal.tags.sort()) ||
      isActive !== originalGoal.isActive ||
      isArchived !== originalGoal.isArchived
    );
  }

  let hasChanges = $derived(checkChanges());

  // Form submission
  async function handleSubmit() {
    titleTouched = true;

    if (!isValid) {
      error = 'Please fix the validation errors before submitting.';
      return;
    }

    try {
      loading = true;
      error = null;

      const updates: UpdateGoalWithTags = {};

      // Only include fields that have changed
      if (title !== originalGoal?.title) {
        updates.title = title.trim();
      }
      if (description !== (originalGoal?.description || '')) {
        updates.description = description.trim() || undefined;
      }
      if (JSON.stringify(tags.sort()) !== JSON.stringify(originalGoal?.tags.sort())) {
        updates.tags = tags.length > 0 ? tags : undefined;
      }
      if (isActive !== originalGoal?.isActive) {
        updates.isActive = isActive;
      }
      if (isArchived !== originalGoal?.isArchived) {
        updates.isArchived = isArchived;
      }

      await goalsApi.updateGoal(goalId, updates);

      // Redirect to goal detail page on success
      goto(`/goals/${goalId}`);
    } catch (err) {
      console.error('Failed to update goal:', err);
      error = err instanceof Error ? err.message : 'Failed to update goal';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto(`/goals/${goalId}`);
  }

  function goBack() {
    goto(`/goals/${goalId}`);
  }
</script>

<svelte:head>
  <title>Edit Goal - Gamified Life</title>
  <meta name="description" content="Edit your personal goal" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  {#if loadingGoal}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-20">
      <div class="space-y-4 text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60">Loading goal...</p>
      </div>
    </div>
  {:else if error && !originalGoal}
    <!-- Error loading goal -->
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
        <button onclick={() => goto('/goals')} class="btn btn-outline gap-2">
          <ArrowLeft size={16} />
          Back to Goals
        </button>
      </div>
    </div>
  {:else}
    <!-- Page Header -->
    <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
      <div class="mx-auto max-w-4xl px-4 py-8">
        <div class="flex items-center gap-4">
          <button onclick={goBack} class="btn btn-ghost btn-circle">
            <ArrowLeft size={20} />
          </button>
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content w-16 rounded-full">
              <Target size={32} />
            </div>
          </div>
          <div>
            <h1 class="text-primary text-3xl font-bold">Edit Goal</h1>
            <p class="text-base-content/70">Update your personal objective</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Form Section (2/3 width) -->
        <div class="lg:col-span-2">
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-8">
              <form onsubmit={handleSubmit} class="space-y-6">
                <!-- Title Field -->
                <div class="form-control">
                  <label class="label" for="title">
                    <span class="label-text text-base font-medium">Goal Title *</span>
                    <span class="label-text-alt text-xs {title.length > 255 ? 'text-error' : 'text-base-content/60'}">
                      {title.length}/255
                    </span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    bind:value={title}
                    onblur={() => (titleTouched = true)}
                    class="input input-bordered w-full {titleTouched && !isValid ? 'input-error' : ''}"
                    placeholder="e.g., Improve my relationship with family"
                    maxlength="255"
                    required
                  />
                  {#if titleTouched && title.trim().length === 0}
                    <div class="label">
                      <span class="label-text-alt text-error">Title is required</span>
                    </div>
                  {/if}
                  {#if title.length > 255}
                    <div class="label">
                      <span class="label-text-alt text-error">Title must be 255 characters or less</span>
                    </div>
                  {/if}
                </div>

                <!-- Description Field -->
                <div class="form-control">
                  <label class="label" for="description">
                    <span class="label-text text-base font-medium">Description</span>
                    <span class="label-text-alt text-xs">Optional</span>
                  </label>
                  <textarea
                    id="description"
                    bind:value={description}
                    class="textarea textarea-bordered h-24 resize-none"
                    placeholder="Describe what this goal means to you and how you plan to achieve it..."
                  ></textarea>
                </div>

                <!-- Tags Field -->
                <div class="form-control">
                  <label class="label" for="tag-input">
                    <span class="label-text text-base font-medium">Tags</span>
                    <span class="label-text-alt text-xs">Organize by life area</span>
                  </label>

                  <!-- Tag Input -->
                  <div class="flex gap-2 relative">
                    <input
                      id="tag-input"
                      type="text"
                      bind:value={tagInput}
                      onkeydown={handleTagKeydown}
                      oninput={updateSuggestions}
                      onfocus={updateSuggestions}
                      class="input input-bordered flex-1"
                      placeholder="e.g., family, health, career"
                      autocomplete="off"
                    />
                    <button type="button" onclick={addTag} class="btn btn-outline gap-2" disabled={!tagInput.trim()}>
                      <Plus size={16} />
                      Add
                    </button>
                    
                    <!-- Tag Suggestions Dropdown -->
                    {#if showSuggestions && tagInput.trim()}
                      <div class="absolute top-full left-0 right-0 mt-1 bg-base-200 rounded-md shadow-lg z-10 max-h-52 overflow-y-auto">
                        {#each filteredSuggestions as suggestion}
                          <button
                            type="button"
                            onclick={() => selectSuggestion(suggestion.name)}
                            class="block w-full text-left px-4 py-2 hover:bg-base-300 transition-colors"
                          >
                            <div class="flex justify-between items-center">
                              <span>{suggestion.name}</span>
                              <span class="text-xs text-base-content/60">Used {suggestion.count} {suggestion.count === 1 ? 'time' : 'times'}</span>
                            </div>
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>

                  <!-- Current Tags -->
                  {#if tags.length > 0}
                    <div class="mt-3 flex flex-wrap gap-2">
                      {#each tags as tag}
                        <div class="badge badge-primary gap-2">
                          {tag}
                          <button type="button" onclick={() => removeTag(tag)} class="btn btn-ghost btn-xs h-auto min-h-0 p-0">
                            <X size={12} />
                          </button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <!-- Status Fields -->
                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-4">
                      <input type="checkbox" bind:checked={isActive} class="checkbox checkbox-primary" />
                      <div>
                        <span class="label-text text-base font-medium">Active Goal</span>
                        <div class="text-base-content/60 text-sm">Active goals appear in your main dashboard and can receive XP</div>
                      </div>
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-4">
                      <input type="checkbox" bind:checked={isArchived} class="checkbox checkbox-neutral" />
                      <div>
                        <span class="label-text text-base font-medium">Archived Goal</span>
                        <div class="text-base-content/60 text-sm">Archived goals are preserved for reference but don't influence task generation</div>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Error Display -->
                {#if error}
                  <div class="alert alert-error">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{error}</span>
                  </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-4 pt-4">
                  <button type="submit" class="btn btn-primary btn-lg flex-1 gap-2" disabled={loading || !isValid || !hasChanges}>
                    {#if loading}
                      <span class="loading loading-spinner loading-sm"></span>
                      Saving...
                    {:else}
                      <Save size={20} />
                      Save Changes
                    {/if}
                  </button>
                  <button type="button" onclick={handleCancel} class="btn btn-outline btn-lg" disabled={loading}> Cancel </button>
                </div>

                <!-- Changes indicator -->
                {#if hasChanges}
                  <div class="text-warning text-sm">⚠️ You have unsaved changes</div>
                {:else if originalGoal}
                  <div class="text-success text-sm">✓ All changes saved</div>
                {/if}
              </form>
            </div>
          </div>
        </div>

        <!-- Tips Sidebar (1/3 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Current Status Card -->
            {#if originalGoal}
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h3 class="mb-4 font-semibold">Current Status</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between">
                      <span class="text-sm">Status:</span>
                      <div class="badge {originalGoal.isArchived ? 'badge-neutral' : originalGoal.isActive ? 'badge-success' : 'badge-warning'}">
                        {originalGoal.isArchived ? 'Archived' : originalGoal.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm">Created:</span>
                      <span class="text-sm font-medium">{new Date(originalGoal.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm">Last Updated:</span>
                      <span class="text-sm font-medium">{new Date(originalGoal.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Edit Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">✏️ Editing Tips</h3>
                <div class="space-y-4 text-sm">
                  <div>
                    <h4 class="text-primary font-medium">Refine Over Time</h4>
                    <p class="text-base-content/70">Update your goal description as you learn more about what success looks like</p>
                  </div>
                  <div>
                    <h4 class="text-primary font-medium">Archive vs Delete</h4>
                    <p class="text-base-content/70">Archive completed goals to preserve your history; delete only if truly irrelevant</p>
                  </div>
                  <div>
                    <h4 class="text-primary font-medium">Tag Organization</h4>
                    <p class="text-base-content/70">Use consistent tags across goals to better organize and track progress</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Quick Actions</h3>
                <div class="space-y-2">
                  <button onclick={() => goto(`/goals/${goalId}`)} class="btn btn-outline btn-sm w-full gap-2">
                    <Target size={16} />
                    View Goal
                  </button>
                  <button onclick={() => goto('/goals')} class="btn btn-outline btn-sm w-full gap-2">
                    <ArrowLeft size={16} />
                    Back to Goals
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
