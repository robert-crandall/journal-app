<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Plus, Edit, Trash2, Calendar, Zap, TrendingUp, Award } from 'lucide-svelte';
  import type { PageData, ActionData } from './$types.js';
  import StatIcon from '$lib/components/StatIcon.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showAddActivityForm = $state(false);
  let editingActivity = $state<string | null>(null);

  // Watch for form state changes
  $effect(() => {
    if (form?.success) {
      showAddActivityForm = false;
      editingActivity = null;
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getSourceTypeIcon(sourceType: string) {
    switch (sourceType) {
      case 'task':
        return '✓';
      case 'journal':
        return '📝';
      case 'quest':
        return '⚔️';
      case 'adhoc':
        return '⭐';
      default:
        return '•';
    }
  }
</script>

<svelte:head>
  <title>{data.stat.name} - Stats - Journal App</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <button class="btn btn-ghost btn-sm" onclick={() => goto('/stats')}>
      <ArrowLeft size={20} />
    </button>
    <StatIcon icon={data.stat.icon} size={32} class="text-primary" />
    <div class="flex-1">
      <h1 class="text-base-content text-3xl font-bold">{data.stat.name}</h1>
      {#if data.stat.description}
        <p class="text-base-content/70 mt-2">{data.stat.description}</p>
      {/if}
    </div>
  </div>

  <!-- Success/Error Messages -->
  {#if form?.success}
    <div class="alert alert-success mb-6">
      <span>Action completed successfully!</span>
    </div>
  {:else if form?.error}
    <div class="alert alert-error mb-6">
      <span>{form.error}</span>
    </div>
  {/if}

  <!-- Stat Overview Card -->
  <div class="card bg-base-100 mb-8 shadow-lg">
    <div class="card-body">
      <div class="grid gap-6 md:grid-cols-3">
        <!-- Level Info -->
        <div class="text-center">
          <div class="mb-2 flex items-center justify-center gap-2">
            <Award size={24} class="text-primary" />
            <span class="text-2xl font-bold">Level {data.stat.currentLevel}</span>
          </div>
          {#if data.stat.currentLevelTitle}
            <p class="text-base-content/80 font-medium">{data.stat.currentLevelTitle}</p>
          {/if}
        </div>

        <!-- XP Info -->
        <div class="text-center">
          <div class="mb-2 flex items-center justify-center gap-2">
            <Zap size={24} class="text-warning" />
            <span class="text-2xl font-bold">{data.stat.currentXp} XP</span>
          </div>
          <p class="text-base-content/70">{data.stat.xpForNextLevel} to next level</p>
        </div>

        <!-- Progress Bar -->
        <div class="flex flex-col justify-center">
          <div class="mb-2 text-center">
            <TrendingUp size={20} class="text-success inline" />
            <span class="ml-2 font-medium">Progress</span>
          </div>
          <progress
            class="progress progress-primary w-full"
            value={calculateXpProgress(data.stat.currentXp, data.stat.totalXpForCurrentLevel, data.stat.totalXpForNextLevel)}
            max="100"
          ></progress>
          <div class="text-base-content/60 mt-1 text-center text-xs">
            {Math.round(calculateXpProgress(data.stat.currentXp, data.stat.totalXpForCurrentLevel, data.stat.totalXpForNextLevel))}%
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid gap-8 lg:grid-cols-2">
    <!-- Activities Section -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="card-title">Activities</h2>
          <button class="btn btn-primary btn-sm" onclick={() => (showAddActivityForm = true)}>
            <Plus size={16} />
            Add Activity
          </button>
        </div>

        <!-- Add Activity Form -->
        {#if showAddActivityForm}
          <div class="bg-base-200 mb-4 rounded-lg p-4">
            <form method="POST" action="?/addActivity" use:enhance>
              <div class="form-control mb-4">
                <input
                  type="text"
                  id="description"
                  name="description"
                  class="input input-bordered w-full"
                  placeholder="Activity description (e.g., Deadlift session at gym)"
                  required
                />
                <div class="label">
                  <span class="label-text-alt">Describe the specific activity that earns XP</span>
                </div>
              </div>
              <div class="form-control mb-4">
                <input
                  type="number"
                  id="suggestedXp"
                  name="suggestedXp"
                  class="input input-bordered w-full"
                  placeholder="Suggested XP amount"
                  value="10"
                  min="1"
                  max="100"
                  required
                />
                <div class="label">
                  <span class="label-text-alt">How much XP this activity should typically award (1-100)</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm">Add Activity</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick={() => (showAddActivityForm = false)}> Cancel </button>
              </div>
            </form>
          </div>
        {/if}

        <!-- Activities List -->
        {#if data.stat.activities.length === 0}
          <div class="py-8 text-center">
            <p class="text-base-content/60 mb-4">No activities yet</p>
            <button class="btn btn-outline btn-sm" onclick={() => (showAddActivityForm = true)}>
              <Plus size={16} />
              Add First Activity
            </button>
          </div>
        {:else}
          <div class="space-y-3">
            {#each data.stat.activities as activity (activity.id)}
              <div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
                {#if editingActivity === activity.id}
                  <!-- Edit Form -->
                  <form method="POST" action="?/updateActivity" use:enhance class="flex-1">
                    <input type="hidden" name="activityId" value={activity.id} />
                    <div class="flex items-end gap-2">
                      <div class="form-control flex-1">
                        <input type="text" name="description" class="input input-bordered input-sm" value={activity.description} required />
                      </div>
                      <div class="form-control w-24">
                        <input type="number" name="suggestedXp" class="input input-bordered input-sm" value={activity.suggestedXp} min="1" required />
                      </div>
                      <button type="submit" class="btn btn-primary btn-sm">Save</button>
                      <button type="button" class="btn btn-ghost btn-sm" onclick={() => (editingActivity = null)}> Cancel </button>
                    </div>
                  </form>
                {:else}
                  <!-- Display -->
                  <div class="flex-1">
                    <span class="font-medium">{activity.description}</span>
                    <span class="badge badge-primary badge-sm ml-2">+{activity.suggestedXp} XP</span>
                  </div>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" onclick={() => (editingActivity = activity.id)}>
                      <Edit size={14} />
                    </button>
                    <form method="POST" action="?/deleteActivity" use:enhance>
                      <input type="hidden" name="activityId" value={activity.id} />
                      <button type="submit" class="btn btn-ghost btn-xs text-error">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- XP History Section -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <Calendar size={20} />
          XP History
        </h2>

        {#if data.xpHistory.length === 0}
          <div class="py-8 text-center">
            <p class="text-base-content/60">No XP history yet</p>
            <p class="text-base-content/50 mt-2 text-sm">Complete tasks or journal entries to start earning XP</p>
          </div>
        {:else}
          <div class="max-h-96 space-y-3 overflow-y-auto">
            {#each data.xpHistory as grant (grant.id)}
              <div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
                <div class="flex items-center gap-3">
                  <span class="text-lg">{getSourceTypeIcon(grant.sourceType)}</span>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-success font-medium">+{grant.amount} XP</span>
                      <span class="badge badge-outline badge-xs">{grant.sourceType}</span>
                    </div>
                    {#if grant.comment}
                      <p class="text-base-content/70 mt-1 text-sm">{grant.comment}</p>
                    {/if}
                  </div>
                </div>
                <span class="text-base-content/50 text-xs">
                  {formatDate(grant.createdAt)}
                </span>
              </div>
            {/each}
          </div>

          <!-- Summary Stats -->
          <div class="mt-4 border-t pt-4">
            <div class="grid grid-cols-2 gap-4 text-center">
              <div>
                <div class="text-primary text-lg font-bold">
                  {data.xpHistory.reduce((sum, grant) => sum + grant.amount, 0)}
                </div>
                <div class="text-base-content/60 text-xs">Total XP Earned</div>
              </div>
              <div>
                <div class="text-secondary text-lg font-bold">
                  {data.xpHistory.length}
                </div>
                <div class="text-base-content/60 text-xs">XP Grants</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
