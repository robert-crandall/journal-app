<script lang="ts">
  import { goto } from '$app/navigation';
  import { goalsApi, type CreateGoal } from '$lib/api/goals';
  import { Target, Plus, X, Save } from 'lucide-svelte';

  // Form state
  let title = $state('');
  let description = $state('');
  let tagInput = $state('');
  let tags = $state<string[]>([]);
  let isActive = $state(true);

  // UI state
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Form validation
  let titleTouched = $state(false);
  let isValid = $derived(title.trim().length > 0 && title.length <= 255);

  // Handle tag input
  function addTag() {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      tags = [...tags, trimmedTag];
      tagInput = '';
    }
  }

  function removeTag(tagToRemove: string) {
    tags = tags.filter(tag => tag !== tagToRemove);
  }

  function handleTagKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }

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

      const goalData: CreateGoal = {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        isActive
      };

      await goalsApi.createGoal(goalData);
      
      // Redirect to goals page on success
      goto('/goals');
    } catch (err) {
      console.error('Failed to create goal:', err);
      error = err instanceof Error ? err.message : 'Failed to create goal';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/goals');
  }
</script>

<svelte:head>
  <title>Create Goal - Gamified Life</title>
  <meta name="description" content="Create a new personal goal to track and achieve" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center gap-4">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content w-16 rounded-full">
            <Target size={32} />
          </div>
        </div>
        <div>
          <h1 class="text-primary text-3xl font-bold">Create New Goal</h1>
          <p class="text-base-content/70">Define a personal objective to work towards</p>
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
                  onblur={() => titleTouched = true}
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
                <div class="flex gap-2">
                  <input
                    id="tag-input"
                    type="text"
                    bind:value={tagInput}
                    onkeydown={handleTagKeydown}
                    class="input input-bordered flex-1"
                    placeholder="e.g., family, health, career"
                  />
                  <button
                    type="button"
                    onclick={addTag}
                    class="btn btn-outline gap-2"
                    disabled={!tagInput.trim()}
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>

                <!-- Current Tags -->
                {#if tags.length > 0}
                  <div class="mt-3 flex flex-wrap gap-2">
                    {#each tags as tag}
                      <div class="badge badge-primary gap-2">
                        {tag}
                        <button
                          type="button"
                          onclick={() => removeTag(tag)}
                          class="btn btn-ghost btn-xs p-0 h-auto min-h-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- Status Field -->
              <div class="form-control">
                <label class="label cursor-pointer justify-start gap-4">
                  <input type="checkbox" bind:checked={isActive} class="checkbox checkbox-primary" />
                  <div>
                    <span class="label-text text-base font-medium">Active Goal</span>
                    <div class="text-sm text-base-content/60">
                      Active goals appear in your main dashboard and can receive XP
                    </div>
                  </div>
                </label>
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
                <button
                  type="submit"
                  class="btn btn-primary btn-lg flex-1 gap-2"
                  disabled={loading || !isValid}
                >
                  {#if loading}
                    <span class="loading loading-spinner loading-sm"></span>
                    Creating...
                  {:else}
                    <Save size={20} />
                    Create Goal
                  {/if}
                </button>
                <button
                  type="button"
                  onclick={handleCancel}
                  class="btn btn-outline btn-lg"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Tips Sidebar (1/3 width) -->
      <div class="lg:col-span-1">
        <div class="sticky top-8 space-y-6">
          <!-- Goal Tips Card -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h3 class="mb-4 font-semibold">🎯 Goal Setting Tips</h3>
              <div class="space-y-4 text-sm">
                <div>
                  <h4 class="font-medium text-primary">Be Specific</h4>
                  <p class="text-base-content/70">Instead of "exercise more," try "go to gym 3 times per week"</p>
                </div>
                <div>
                  <h4 class="font-medium text-primary">Make it Measurable</h4>
                  <p class="text-base-content/70">Define what success looks like so you can track progress</p>
                </div>
                <div>
                  <h4 class="font-medium text-primary">Use Tags</h4>
                  <p class="text-base-content/70">Organize goals by life area: family, health, career, spiritual, growth</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Examples Card -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h3 class="mb-4 font-semibold">💡 Example Goals</h3>
              <div class="space-y-3 text-sm">
                <div class="p-3 bg-base-200 rounded-lg">
                  <div class="font-medium">"Strengthen family relationships"</div>
                  <div class="text-xs text-base-content/60 mt-1">Tags: family, growth</div>
                </div>
                <div class="p-3 bg-base-200 rounded-lg">
                  <div class="font-medium">"Read 12 books this year"</div>
                  <div class="text-xs text-base-content/60 mt-1">Tags: learning, growth</div>
                </div>
                <div class="p-3 bg-base-200 rounded-lg">
                  <div class="font-medium">"Develop stronger prayer life"</div>
                  <div class="text-xs text-base-content/60 mt-1">Tags: spiritual, growth</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Integration Info Card -->
          <div class="card from-accent/10 to-primary/10 border-accent/20 border bg-gradient-to-br">
            <div class="card-body p-6">
              <h3 class="mb-4 font-semibold">⚡ How Goals Work</h3>
              <div class="space-y-3 text-sm">
                <p class="text-base-content/70">Goals influence your AI-generated daily tasks and journal prompts</p>
                <p class="text-base-content/70">Active goals appear in your character profile and dashboard</p>
                <p class="text-base-content/70">Archive goals when completed to track your progress over time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
