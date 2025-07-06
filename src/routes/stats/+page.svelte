<script lang="ts">
  import { enhance } from '$app/forms';
  import { Plus, Award, TrendingUp, Zap, Edit, Trash2, BarChart3 } from 'lucide-svelte';
  import type { PageData, ActionData } from './$types.js';
  import IconSelector from '$lib/components/IconSelector.svelte';
  import StatIcon from '$lib/components/StatIcon.svelte';
  import ActivityManager from '$lib/components/ActivityManager.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreateForm = $state(false);
  let editingStat = $state<string | null>(null);
  let awardingXpStat = $state<string | null>(null);
  let selectedIcon = $state<string>('');
  let editingIcon = $state<string>('');
  let exampleActivities = $state<Record<string, { description: string; suggestedXp: number }[]>>({});
  let editingExampleActivities = $state<Record<string, { description: string; suggestedXp: number }[]>>({});

  // Watch for form state changes
  $effect(() => {
    // Only reset form state if we have a successful form submission
    if (form?.success) {
      showCreateForm = false;
      editingStat = null;
      awardingXpStat = null;
      selectedIcon = '';
      editingIcon = '';
      exampleActivities = {};
      editingExampleActivities = {};
    }

    // Restore form data on form error (but don't close the form)
    if (form && 'icon' in form && !form.success) {
      selectedIcon = form.icon as string;
    }
    if (form && 'exampleActivities' in form && !form.success) {
      try {
        exampleActivities = JSON.parse((form.exampleActivities as string) || '{}');
      } catch {
        exampleActivities = {};
      }
    }
  });

  function calculateXpProgress(currentXp: number, totalXpForCurrentLevel: number, totalXpForNextLevel: number) {
    const currentLevelXp = currentXp - totalXpForCurrentLevel;
    const nextLevelXp = totalXpForNextLevel - totalXpForCurrentLevel;
    return (currentLevelXp / nextLevelXp) * 100;
  }

  function startEditingStat(stat: {
    id: string;
    icon?: string | null;
    exampleActivities?: Record<string, { description: string; suggestedXp: number }[]> | null;
  }) {
    editingStat = stat.id;
    editingIcon = stat.icon || '';
    editingExampleActivities = stat.exampleActivities || {};
  }
</script>

<svelte:head>
  <title>Stats - Journal App</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-base-content text-3xl font-bold">Character Stats</h1>
        <p class="text-base-content/70 mt-2">Track your personal growth and level up your life</p>
      </div>
      <button class="btn btn-primary" onclick={() => (showCreateForm = true)} data-testid="create-stat-btn">
        <Plus size={20} />
        Create Stat
      </button>
    </div>

    <!-- Success/Error Messages -->
    {#if form?.success && form?.leveledUp}
      <div class="alert alert-success mb-6">
        <Award size={20} />
        <span>Level up! You reached level {form.newLevel}! (+{form.xpAwarded} XP)</span>
      </div>
    {:else if form?.success && form?.xpAwarded}
      <div class="alert alert-success mb-6">
        <Zap size={20} />
        <span>XP awarded! (+{form.xpAwarded} XP)</span>
      </div>
    {:else if form?.error}
      <div class="alert alert-error mb-6">
        <span>{form.error}</span>
      </div>
    {/if}

    <!-- Create Stat Form -->
    {#if showCreateForm}
      <div class="mb-8 grid gap-8 lg:grid-cols-3">
        <!-- Form -->
        <div class="lg:col-span-2">
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <h2 class="card-title mb-6 text-2xl">Create New Stat</h2>
              <form method="POST" action="?/create" use:enhance class="space-y-6" data-testid="create-stat-form">
                <input type="hidden" name="icon" value={selectedIcon} />
                <input type="hidden" name="exampleActivities" value={JSON.stringify(exampleActivities)} />

                <div class="form-control">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    class="input input-bordered w-full"
                    placeholder="Stat name (e.g., Strength, Fatherhood, Self-Control)"
                    value={form?.name || ''}
                    required
                  />
                  <div class="label">
                    <span class="label-text-alt">Choose a meaningful name for tracking your growth</span>
                  </div>
                </div>

                <div class="form-control">
                  <textarea
                    id="description"
                    name="description"
                    class="textarea textarea-bordered h-24 w-full"
                    placeholder="What this stat means to you..."
                    value={form?.description || ''}
                  ></textarea>
                  <div class="label">
                    <span class="label-text-alt">Describe what this stat represents in your life</span>
                  </div>
                </div>

                <IconSelector value={selectedIcon} onSelect={(icon) => (selectedIcon = icon)} />

                <ActivityManager value={exampleActivities} onUpdate={(activities) => (exampleActivities = activities)} />

                <div class="flex gap-3 pt-4">
                  <button type="submit" class="btn btn-primary flex-1">
                    <Plus size={20} />
                    Create Stat
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
                <TrendingUp size={20} />
                Stat Tips
              </h3>
              <ul class="space-y-2 text-sm">
                <li>• Choose stats that matter to your personal goals</li>
                <li>• Be specific with descriptions to guide XP awards</li>
                <li>• Organize activities into logical categories</li>
                <li>• Multiple examples help GPT give better recommendations</li>
                <li>• Start with 3-5 core stats to avoid overwhelm</li>
              </ul>
            </div>
          </div>

          <div class="card bg-primary/10">
            <div class="card-body">
              <h3 class="card-title text-lg">
                <Award size={20} />
                XP Guidelines
              </h3>
              <ul class="space-y-2 text-sm">
                <li>• Small actions: 5-15 XP</li>
                <li>• Medium efforts: 15-30 XP</li>
                <li>• Major achievements: 30-50 XP</li>
                <li>• Exceptional accomplishments: 50+ XP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Stats Grid -->
    {#if data.stats.length === 0}
      <div class="py-12 text-center">
        <BarChart3 size={48} class="text-base-content/50 mx-auto mb-4" />
        <h3 class="text-base-content/70 mb-2 text-xl font-semibold">No stats yet</h3>
        <p class="text-base-content/50 mb-4">Create your first stat to start tracking your personal growth</p>
        <button class="btn btn-primary" onclick={() => (showCreateForm = true)} data-testid="create-first-stat-btn">
          <Plus size={20} />
          Create Your First Stat
        </button>
      </div>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {#each data.stats as stat (stat.id)}
          <div class="card bg-base-100 shadow-lg">
            <div class="card-body">
              <div class="mb-4 flex items-start justify-between">
                <div class="flex flex-1 items-center gap-3">
                  <StatIcon icon={stat.icon} size={24} class="text-primary flex-shrink-0" />
                  <div>
                    <h3 class="card-title text-xl">{stat.name}</h3>
                    {#if stat.description}
                      <p class="text-base-content/70 mt-1 text-sm">{stat.description}</p>
                    {/if}
                  </div>
                </div>
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-ghost btn-sm">⋮</div>
                  <ul class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                    <li>
                      <button onclick={() => startEditingStat(stat)}>
                        <Edit size={16} />
                        Edit
                      </button>
                    </li>
                    <li>
                      <button onclick={() => (awardingXpStat = stat.id)}>
                        <Zap size={16} />
                        Award XP
                      </button>
                    </li>
                    <li>
                      <a href="/stats/{stat.id}">
                        <TrendingUp size={16} />
                        View History
                      </a>
                    </li>
                    <li>
                      <form method="POST" action="?/delete" use:enhance>
                        <input type="hidden" name="statId" value={stat.id} />
                        <button type="submit" class="text-error w-full justify-start">
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </form>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Level and Title -->
              <div class="mb-4">
                <div class="mb-2 flex items-center gap-2">
                  <span class="badge badge-primary">Level {stat.currentLevel}</span>
                  {#if stat.currentLevelTitle}
                    <span class="text-base-content/80 text-sm font-medium">{stat.currentLevelTitle}</span>
                  {/if}
                </div>
              </div>

              <!-- XP Progress -->
              <div class="mb-4">
                <div class="mb-2 flex justify-between text-sm">
                  <span>{stat.currentXp} XP</span>
                  <span>{stat.xpForNextLevel} to next level</span>
                </div>
                <progress
                  class="progress progress-primary w-full"
                  value={calculateXpProgress(stat.currentXp, stat.totalXpForCurrentLevel, stat.totalXpForNextLevel)}
                  max="100"
                ></progress>
              </div>

              <!-- Activities -->
              {#if stat.exampleActivities && Object.keys(stat.exampleActivities).length > 0}
                <div class="mb-4">
                  <h4 class="text-base-content/80 mb-2 text-sm font-medium">Example Activities:</h4>
                  <div class="space-y-2">
                    {#each Object.entries(stat.exampleActivities).slice(0, 2) as [category, activities] (category)}
                      <div>
                        <span class="text-base-content/60 text-xs font-medium">{category}:</span>
                        <div class="mt-1 flex flex-wrap gap-1">
                          {#each activities.slice(0, 3) as activity (activity.description)}
                            <span class="badge badge-outline badge-sm">
                              {activity.description} (+{activity.suggestedXp})
                            </span>
                          {/each}
                          {#if activities.length > 3}
                            <span class="badge badge-ghost badge-sm">+{activities.length - 3} more</span>
                          {/if}
                        </div>
                      </div>
                    {/each}
                    {#if Object.keys(stat.exampleActivities).length > 2}
                      <span class="text-base-content/40 text-xs">+{Object.keys(stat.exampleActivities).length - 2} more categories</span>
                    {/if}
                  </div>
                </div>
              {:else if stat.activities.length > 0}
                <div class="mb-4">
                  <h4 class="text-base-content/80 mb-2 text-sm font-medium">Activities:</h4>
                  <div class="flex flex-wrap gap-1">
                    {#each stat.activities.slice(0, 3) as activity (activity.id)}
                      <span class="badge badge-outline badge-sm">
                        {activity.description} (+{activity.suggestedXp})
                      </span>
                    {/each}
                    {#if stat.activities.length > 3}
                      <span class="badge badge-ghost badge-sm">+{stat.activities.length - 3} more</span>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Edit Form -->
              {#if editingStat === stat.id}
                <div class="mt-4 border-t pt-4">
                  <form method="POST" action="?/update" use:enhance>
                    <input type="hidden" name="statId" value={stat.id} />
                    <input type="hidden" name="icon" value={editingIcon} />
                    <input type="hidden" name="exampleActivities" value={JSON.stringify(editingExampleActivities)} />
                    <div class="form-control mb-4">
                      <input
                        type="text"
                        id="edit-name-{stat.id}"
                        name="name"
                        class="input input-bordered w-full"
                        placeholder="Stat name"
                        value={stat.name}
                        required
                      />
                      <div class="label">
                        <span class="label-text-alt">The name of your stat (e.g., "Fitness", "Learning")</span>
                      </div>
                    </div>
                    <div class="form-control mb-4">
                      <textarea
                        id="edit-description-{stat.id}"
                        name="description"
                        class="textarea textarea-bordered w-full"
                        placeholder="Describe what this stat represents..."
                        value={stat.description || ''}
                        rows="3"
                      ></textarea>
                      <div class="label">
                        <span class="label-text-alt">Help clarify what activities contribute to this stat</span>
                      </div>
                    </div>
                    <div class="mb-4">
                      <IconSelector value={editingIcon} onSelect={(icon) => (editingIcon = icon)} />
                    </div>
                    <div class="mb-4">
                      <ActivityManager value={editingExampleActivities} onUpdate={(activities) => (editingExampleActivities = activities)} />
                    </div>
                    <div class="flex gap-2">
                      <button type="submit" class="btn btn-primary btn-sm">Save</button>
                      <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editingStat = null)}> Cancel </button>
                    </div>
                  </form>
                </div>
              {/if}

              <!-- Award XP Form -->
              {#if awardingXpStat === stat.id}
                <div class="mt-4 border-t pt-4">
                  <form method="POST" action="?/awardXp" use:enhance>
                    <input type="hidden" name="statId" value={stat.id} />
                    <div class="form-control mb-4">
                      <input
                        type="number"
                        id="award-amount-{stat.id}"
                        name="amount"
                        class="input input-bordered w-full"
                        placeholder="XP amount"
                        min="1"
                        max="100"
                        value="10"
                        required
                      />
                      <div class="label">
                        <span class="label-text-alt">How much XP to award (1-100)</span>
                      </div>
                    </div>
                    <div class="form-control mb-4">
                      <input
                        type="text"
                        id="award-comment-{stat.id}"
                        name="comment"
                        class="input input-bordered w-full"
                        placeholder="What did you do to earn this XP?"
                      />
                      <div class="label">
                        <span class="label-text-alt">Optional: describe the achievement</span>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button type="submit" class="btn btn-primary btn-sm">
                        <Zap size={16} />
                        Award XP
                      </button>
                      <button type="button" class="btn btn-ghost btn-sm" onclick={() => (awardingXpStat = null)}> Cancel </button>
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
