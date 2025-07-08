<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft, Edit, Trash2, Zap, TrendingUp, Award, BarChart3 } from 'lucide-svelte';
  import type { PageData, ActionData } from './$types.js';
  import StatIcon from '$lib/components/StatIcon.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showGrantXpForm = $state(false);
  let showEditForm = $state(false);

  // Watch for form state changes
  $effect(() => {
    if (form?.success) {
      showGrantXpForm = false;
      showEditForm = false;
    }
  });

  function calculateXpProgress(currentXp: number, totalXpForCurrentLevel: number, totalXpForNextLevel: number) {
    const currentLevelXp = currentXp - totalXpForCurrentLevel;
    const nextLevelXp = totalXpForNextLevel - totalXpForCurrentLevel;
    return (currentLevelXp / nextLevelXp) * 100;
  }

  function formatDate(date: string | Date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<svelte:head>
  <title>{data.stat.name} - Stats - Life Quest</title>
</svelte:head>

<!-- Dark background with gradient -->
<div class="min-h-screen bg-gradient-to-br from-base-300 to-base-100">
  <!-- Breadcrumb Navigation -->
  <div class="bg-primary/10 border-b border-primary/20 px-4 py-3">
    <div class="container mx-auto">
      <div class="breadcrumbs text-sm">
        <ul>
          <li><a href="/stats" class="text-primary hover:text-primary/80">Stats</a></li>
          <li class="text-base-content">{data.stat.name}</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-4 py-8">
    <!-- Stat Header -->
    <div class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <StatIcon icon={data.stat.icon} size={32} class="text-primary" />
        </div>
        <div class="flex-1">
          <h1 class="text-4xl font-bold text-primary mb-1">{data.stat.name}</h1>
          <div class="badge badge-primary badge-lg">Level {data.stat.currentLevel}</div>
        </div>
      </div>
      {#if data.stat.description}
        <p class="text-base-content/70 max-w-2xl">{data.stat.description}</p>
      {/if}
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-4 mb-8">
      <button
        onclick={() => showGrantXpForm = !showGrantXpForm}
        class="btn btn-primary"
      >
        <Zap size={16} />
        Grant XP
      </button>
      <button
        onclick={() => showEditForm = !showEditForm}
        class="btn btn-outline"
      >
        <Edit size={16} />
        Edit Stat
      </button>
      <form method="POST" action="?/delete" use:enhance class="inline">
        <button type="submit" class="btn btn-error btn-outline">
          <Trash2 size={16} />
          Delete
        </button>
      </form>
    </div>

    <!-- Grant XP Form -->
    {#if showGrantXpForm}
      <div class="card bg-base-100 shadow-xl mb-8">
        <div class="card-body">
          <h3 class="card-title">Grant XP</h3>
          <form method="POST" action="?/awardXp" use:enhance class="space-y-4">
            <input type="hidden" name="statId" value={data.stat.id} />
            <div class="form-control">
              <label class="label">
                <span class="label-text">XP Amount</span>
              </label>
              <input
                type="number"
                name="amount"
                class="input input-bordered"
                placeholder="Enter XP amount"
                min="1"
                max="100"
                value="25"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Comment (optional)</span>
              </label>
              <input
                type="text"
                name="comment"
                class="input input-bordered"
                placeholder="What did you do to earn this XP?"
              />
            </div>
            <div class="flex gap-2">
              <button type="submit" class="btn btn-primary">Grant XP</button>
              <button type="button" class="btn" onclick={() => showGrantXpForm = false}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Edit Form -->
    {#if showEditForm}
      <div class="card bg-base-100 shadow-xl mb-8">
        <div class="card-body">
          <h3 class="card-title">Edit Stat</h3>
          <form method="POST" action="?/update" use:enhance class="space-y-4">
            <input type="hidden" name="statId" value={data.stat.id} />
            <div class="form-control">
              <label class="label">
                <span class="label-text">Name</span>
              </label>
              <input
                type="text"
                name="name"
                class="input input-bordered"
                value={data.stat.name}
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Description</span>
              </label>
              <textarea
                name="description"
                class="textarea textarea-bordered"
                value={data.stat.description || ''}
                rows="3"
              ></textarea>
            </div>
            <div class="flex gap-2">
              <button type="submit" class="btn btn-primary">Save Changes</button>
              <button type="button" class="btn" onclick={() => showEditForm = false}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Main Content Grid -->
    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Left Column: Progress and Activities -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Progress Section -->
        <div class="card bg-base-100 shadow-xl border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-lg mb-4">Progress to Level {data.stat.currentLevel + 1}</h3>
            
            <!-- XP Progress Bar -->
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-primary font-bold">{data.stat.currentXp - data.stat.totalXpForCurrentLevel} XP</span>
                <span class="text-base-content/60">
                  {data.stat.totalXpForNextLevel - data.stat.totalXpForCurrentLevel} XP needed for next level
                </span>
              </div>
              <div class="relative">
                <progress
                  class="progress progress-primary w-full h-4"
                  value={calculateXpProgress(data.stat.currentXp, data.stat.totalXpForCurrentLevel, data.stat.totalXpForNextLevel)}
                  max="100"
                ></progress>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-xs font-bold text-primary-content drop-shadow">
                    {Math.round(calculateXpProgress(data.stat.currentXp, data.stat.totalXpForCurrentLevel, data.stat.totalXpForNextLevel))}%
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex justify-between text-sm text-base-content/60">
              <span>Current Level: {data.stat.currentLevel}</span>
              <span>{data.stat.xpForNextLevel} XP needed for next level</span>
            </div>
          </div>
        </div>

        <!-- Example Activities -->
        <div class="card bg-base-100 shadow-xl border border-base-300">
          <div class="card-body">
            <h3 class="card-title flex items-center gap-2 mb-4">
              <TrendingUp size={20} />
              Example Activities
            </h3>
            
            {#if data.stat.exampleActivities && Object.keys(data.stat.exampleActivities).length > 0}
              <div class="space-y-4">
                {#each Object.entries(data.stat.exampleActivities) as [category, activities]}
                  <div>
                    <h4 class="font-semibold text-base-content/80 mb-2">{category}</h4>
                    <div class="grid md:grid-cols-2 gap-2">
                      {#each activities as activity}
                        <div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                          <span class="text-sm">{activity.description}</span>
                          <span class="badge badge-primary">+{activity.suggestedXp} XP</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {:else if data.stat.activities && data.stat.activities.length > 0}
              <div class="grid md:grid-cols-2 gap-2">
                {#each data.stat.activities as activity}
                  <div class="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span class="text-sm">{activity.description}</span>
                    <span class="badge badge-primary">+{activity.suggestedXp} XP</span>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-8 text-base-content/60">
                <TrendingUp size={48} class="mx-auto mb-4 opacity-50" />
                <p>No activities defined yet</p>
                <button class="btn btn-outline btn-sm mt-2" onclick={() => showEditForm = true}>
                  Add Activities
                </button>
              </div>
            {/if}
          </div>
        </div>

        <!-- Recent XP History -->
        <div class="card bg-base-100 shadow-xl border border-base-300">
          <div class="card-body">
            <h3 class="card-title flex items-center gap-2 mb-4">
              <BarChart3 size={20} />
              Recent XP History
            </h3>
            
            {#if data.xpHistory.length === 0}
              <div class="text-center py-8">
                <BarChart3 size={48} class="mx-auto mb-4 text-base-content/30" />
                <p class="text-base-content/60 mb-2">No XP history yet. Start earning XP to see your progress!</p>
              </div>
            {:else}
              <div class="space-y-3 max-h-96 overflow-y-auto">
                {#each data.xpHistory.slice(0, 10) as grant (grant.id)}
                  <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-success font-bold">+{grant.amount} XP</span>
                        <span class="badge badge-outline badge-xs">{grant.sourceType}</span>
                      </div>
                      {#if grant.comment}
                        <p class="text-sm text-base-content/70 mt-1">{grant.comment}</p>
                      {/if}
                    </div>
                    <span class="text-xs text-base-content/50">
                      {formatDate(grant.createdAt)}
                    </span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-6">
        <!-- Quick Stats -->
        <div class="card bg-gradient-to-br from-base-300 to-base-200 shadow-xl">
          <div class="card-body">
            <h3 class="card-title flex items-center gap-2 text-lg">
              <BarChart3 size={20} />
              Quick Stats
            </h3>
            
            <div class="space-y-4">
              <div>
                <div class="text-2xl font-bold text-primary">{data.stat.currentLevel}</div>
                <div class="text-sm text-base-content/60">Current Level</div>
              </div>
              
              <div>
                <div class="text-2xl font-bold text-secondary">{data.stat.currentXp}</div>
                <div class="text-sm text-base-content/60">Total XP</div>
              </div>
              
              <div>
                <div class="text-2xl font-bold text-accent">{data.stat.xpForNextLevel}</div>
                <div class="text-sm text-base-content/60">XP to Next Level</div>
              </div>
              
              <div>
                <div class="text-sm text-base-content/60">Created</div>
                <div class="font-mono text-sm">
                  {formatDate(data.stat.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Level Progression -->
        <div class="card bg-gradient-to-br from-base-300 to-base-200 shadow-xl">
          <div class="card-body">
            <h3 class="card-title flex items-center gap-2 text-lg">
              <Award size={20} />
              Level Progression
            </h3>
            
            <div class="space-y-3">
              <!-- Current Level -->
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  {data.stat.currentLevel}
                </div>
                <div class="flex-1">
                  <div class="flex justify-between">
                    <span class="text-sm font-medium">Level {data.stat.currentLevel}</span>
                    <span class="badge badge-primary badge-xs">Current</span>
                  </div>
                  <div class="text-xs text-base-content/60">{data.stat.totalXpForCurrentLevel} XP required</div>
                </div>
              </div>
              
              <!-- Next Level -->
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-warning flex items-center justify-center text-white font-bold text-sm">
                  {data.stat.currentLevel + 1}
                </div>
                <div class="flex-1">
                  <div class="flex justify-between">
                    <span class="text-sm font-medium">Level {data.stat.currentLevel + 1}</span>
                    <span class="badge badge-warning badge-xs">Next</span>
                  </div>
                  <div class="text-xs text-base-content/60">{data.stat.totalXpForNextLevel} XP required</div>
                </div>
              </div>
              
              <!-- Future Levels -->
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center text-base-content font-bold text-sm">
                  {data.stat.currentLevel + 2}
                </div>
                <div class="flex-1">
                  <div class="flex justify-between">
                    <span class="text-sm font-medium">Level {data.stat.currentLevel + 2}</span>
                  </div>
                  <div class="text-xs text-base-content/60">Future milestone</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
