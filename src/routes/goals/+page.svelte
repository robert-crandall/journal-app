<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus, Edit, Trash2, Target, Archive, ArchiveRestore, Eye, EyeOff } from 'lucide-svelte';
  import type { PageData, ActionData } from './$types.js';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreateForm = $state(false);
  let editingGoal = $state<string | null>(null);
  let showArchived = $state(false);

  // Form fields
  let editingTitle = $state('');
  let editingDescription = $state('');
  let editingTags = $state('');

  // Watch for form state changes
  $effect(() => {
    if (form?.success) {
      showCreateForm = false;
      editingGoal = null;
      editingTitle = '';
      editingDescription = '';
      editingTags = '';
    }

    // Restore form data on form error (but don't close the form)
    if (form && 'title' in form && !form.success) {
      editingTitle = (form.title as string) || '';
      editingDescription = (form.description as string) || '';
      editingTags = (form.tags as string) || '';
    }
  });

  function startEditingGoal(goal: { id: string; title: string; description?: string | null; tags?: string[] | null }) {
    editingGoal = goal.id;
    editingTitle = goal.title;
    editingDescription = goal.description || '';
    editingTags = goal.tags ? goal.tags.join(', ') : '';
  }

  function cancelEditing() {
    editingGoal = null;
    editingTitle = '';
    editingDescription = '';
    editingTags = '';
  }

  // Computed values
  const activeGoals = $derived(data.goals.filter((goal) => !goal.archived));
  const archivedGoals = $derived(data.goals.filter((goal) => goal.archived));
  const visibleGoals = $derived(showArchived ? archivedGoals : activeGoals);

  function formatDate(date: string | Date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>Goals - Journal App</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="mb-2 text-4xl font-bold">Personal Goals</h1>
        <p class="text-base-content/70">Define and track your high-level personal goals for growth and context</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-outline" onclick={() => (showArchived = !showArchived)} data-testid="toggle-archived-btn">
          {#if showArchived}
            <Eye size={20} />
            Show Active
          {:else}
            <Archive size={20} />
            Show Archived
          {/if}
        </button>
        <button class="btn btn-primary" onclick={() => (showCreateForm = true)} data-testid="create-goal-btn">
          <Plus size={20} />
          Create Goal
        </button>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if form?.success}
      <div class="alert alert-success mb-6">
        <span>Goal action completed successfully!</span>
      </div>
    {:else if form?.error}
      <div class="alert alert-error mb-6">
        <span>{form.error}</span>
      </div>
    {/if}

    <!-- Create Goal Form -->
    {#if showCreateForm}
      <div class="mb-8 grid gap-8 lg:grid-cols-3">
        <!-- Form -->
        <div class="lg:col-span-2">
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h2 class="card-title mb-6 text-2xl">Create New Goal</h2>
              <form method="POST" action="?/create" use:enhance class="space-y-6" data-testid="create-goal-form">
                <div class="form-control">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    class="input input-bordered w-full"
                    placeholder="Goal title (e.g., Live close to nature, Be an engaged father)"
                    value={form?.title || ''}
                    required
                  />
                  <div class="label">
                    <span class="label-text-alt">A clear, meaningful title for your goal</span>
                  </div>
                </div>

                <div class="form-control">
                  <textarea
                    id="description"
                    name="description"
                    class="textarea textarea-bordered h-24 w-full"
                    placeholder="Why does this goal matter to you? How does it connect to your values?"
                    value={form?.description || ''}
                  ></textarea>
                  <div class="label">
                    <span class="label-text-alt">Explain the importance and context of this goal</span>
                  </div>
                </div>

                <div class="form-control">
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    class="input input-bordered w-full"
                    placeholder="family, growth, spirituality, health (comma-separated)"
                    value={form?.tags || ''}
                  />
                  <div class="label">
                    <span class="label-text-alt">Optional tags to categorize this goal</span>
                  </div>
                </div>

                <div class="flex gap-3 pt-4">
                  <button type="submit" class="btn btn-primary flex-1">
                    <Plus size={20} />
                    Create Goal
                  </button>
                  <button type="button" class="btn btn-ghost" onclick={() => (showCreateForm = false)}> Cancel </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Tips Sidebar -->
        <div class="space-y-4">
          <div class="card bg-base-200">
            <div class="card-body">
              <h3 class="card-title text-lg">
                <Target size={20} />
                Goal Tips
              </h3>
              <ul class="space-y-2 text-sm">
                <li>• Focus on high-level aspirations, not specific tasks</li>
                <li>• Connect goals to your deeper values and motivations</li>
                <li>• Use goals as context for AI task generation</li>
                <li>• Keep descriptions meaningful but concise</li>
                <li>• Archive completed or outdated goals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Goals Grid -->
    {#if visibleGoals.length === 0}
      <div class="py-12 text-center">
        <Target size={48} class="text-base-content/50 mx-auto mb-4" />
        <h3 class="text-base-content/70 mb-2 text-xl font-semibold">
          {showArchived ? 'No archived goals' : 'No goals yet'}
        </h3>
        <p class="text-base-content/50 mb-4">
          {showArchived ? "You haven't archived any goals yet" : 'Create your first goal to provide context for your journey'}
        </p>
        {#if !showArchived}
          <button class="btn btn-primary" onclick={() => (showCreateForm = true)} data-testid="create-first-goal-btn">
            <Plus size={20} />
            Create Your First Goal
          </button>
        {/if}
      </div>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {#each visibleGoals as goal (goal.id)}
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <div class="mb-4 flex items-start justify-between">
                <div class="flex-1">
                  <div class="mb-2 flex items-center gap-2">
                    <h3 class="card-title text-xl">{goal.title}</h3>
                    <div class="flex gap-1">
                      {#if !goal.active}
                        <div class="badge badge-outline badge-sm">Inactive</div>
                      {/if}
                      {#if goal.archived}
                        <div class="badge badge-secondary badge-sm">Archived</div>
                      {/if}
                    </div>
                  </div>
                  {#if goal.description}
                    <p class="text-base-content/70 mt-2 text-sm">{goal.description}</p>
                  {/if}
                </div>
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-ghost btn-sm" data-testid="goal-menu-{goal.id}">⋮</div>
                  <ul class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                    <li>
                      <button onclick={() => startEditingGoal(goal)} data-testid="edit-goal-{goal.id}">
                        <Edit size={16} />
                        Edit
                      </button>
                    </li>
                    <li>
                      <form method="POST" action="?/toggleActive" use:enhance>
                        <input type="hidden" name="goalId" value={goal.id} />
                        <button type="submit" class="w-full justify-start" data-testid="toggle-active-{goal.id}">
                          {#if goal.active}
                            <EyeOff size={16} />
                            Deactivate
                          {:else}
                            <Eye size={16} />
                            Activate
                          {/if}
                        </button>
                      </form>
                    </li>
                    <li>
                      {#if goal.archived}
                        <form method="POST" action="?/unarchive" use:enhance>
                          <input type="hidden" name="goalId" value={goal.id} />
                          <button type="submit" class="w-full justify-start" data-testid="unarchive-goal-{goal.id}">
                            <ArchiveRestore size={16} />
                            Unarchive
                          </button>
                        </form>
                      {:else}
                        <form method="POST" action="?/archive" use:enhance>
                          <input type="hidden" name="goalId" value={goal.id} />
                          <button type="submit" class="w-full justify-start" data-testid="archive-goal-{goal.id}">
                            <Archive size={16} />
                            Archive
                          </button>
                        </form>
                      {/if}
                    </li>
                    <li>
                      <form method="POST" action="?/delete" use:enhance>
                        <input type="hidden" name="goalId" value={goal.id} />
                        <button type="submit" class="text-error w-full justify-start" data-testid="delete-goal-{goal.id}">
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </form>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Tags -->
              {#if goal.tags && goal.tags.length > 0}
                <div class="mb-4">
                  <div class="flex flex-wrap gap-1">
                    {#each goal.tags as tag (tag)}
                      <span class="badge badge-outline badge-sm">{tag}</span>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Meta Info -->
              <div class="text-base-content/50 mt-4 border-t pt-4 text-xs">
                Created {formatDate(goal.createdAt)}
                {#if goal.updatedAt !== goal.createdAt}
                  • Updated {formatDate(goal.updatedAt)}
                {/if}
              </div>

              <!-- Edit Form -->
              {#if editingGoal === goal.id}
                <div class="mt-4 border-t pt-4">
                  <form method="POST" action="?/update" use:enhance>
                    <input type="hidden" name="goalId" value={goal.id} />
                    <div class="form-control mb-4">
                      <input
                        type="text"
                        name="title"
                        class="input input-bordered input-sm w-full"
                        placeholder="Goal title"
                        bind:value={editingTitle}
                        required
                      />
                    </div>
                    <div class="form-control mb-4">
                      <textarea
                        name="description"
                        class="textarea textarea-bordered textarea-sm h-20 w-full"
                        placeholder="Description"
                        bind:value={editingDescription}
                      ></textarea>
                    </div>
                    <div class="form-control mb-4">
                      <input
                        type="text"
                        name="tags"
                        class="input input-bordered input-sm w-full"
                        placeholder="Tags (comma-separated)"
                        bind:value={editingTags}
                      />
                    </div>
                    <div class="flex gap-2">
                      <button type="submit" class="btn btn-primary btn-sm">Save</button>
                      <button type="button" class="btn btn-ghost btn-sm" onclick={() => cancelEditing()}> Cancel </button>
                    </div>
                  </form>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
