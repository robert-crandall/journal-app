<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { statsApi } from '$lib/api/stats.js';
  import { Trophy, TrendingUp, Calendar, Zap, Edit, Trash2, BarChart3, Award, Target, Activity } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  import type { XpGrantResponse, CharacterStatWithProgress } from '$lib/api/stats';

  // State
  let stat = $state<CharacterStatWithProgress | null>(null);
  let xpHistory = $state<XpGrantResponse[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showDeleteModal = $state(false);
  let deleting = $state(false);

  // Derived values
  const statId = $derived($page.params.id);
  const progressPercentage = $derived(() => {
    if (!stat) return 0;
    const currentLevelXp = stat.currentLevel * 100; // Assuming 100 XP per level
    const nextLevelXp = (stat.currentLevel + 1) * 100;
    const progressInLevel = stat.totalXp - currentLevelXp;
    const levelXpRequired = nextLevelXp - currentLevelXp;
    return Math.min((progressInLevel / levelXpRequired) * 100, 100);
  });

  // Functions
  async function loadStat() {
    if (!statId) return;

    try {
      loading = true;
      error = null;

      const [statResponse, historyResponse] = await Promise.all([statsApi.getStat(statId), statsApi.getXpHistory(statId)]);

      stat = statResponse;
      xpHistory = historyResponse;
    } catch (err) {
      console.error('Error loading stat:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = 'Failed to load stat details';
    } finally {
      loading = false;
    }
  }

  async function deleteStat() {
    if (!stat) return;

    try {
      deleting = true;
      await statsApi.deleteStat(stat.id);
      goto('/stats');
    } catch (err) {
      console.error('Error deleting stat:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = 'Failed to delete stat';
    } finally {
      deleting = false;
      showDeleteModal = false;
    }
  }

  function editStat() {
    if (stat) {
      goto(`/stats/${stat.id}/edit`);
    }
  }

  function grantXp() {
    if (stat) {
      goto(`/stats/${stat.id}/grant-xp`);
    }
  }

  function levelUp() {
    if (stat) {
      goto(`/stats/${stat.id}/level-up`);
    }
  }

  // Lifecycle
  onMount(() => {
    loadStat();
  });
</script>

<!-- Page Header -->
<div class="container mx-auto max-w-7xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="breadcrumbs mb-6 text-sm">
    <ul>
      <li><a href="/stats" class="text-primary hover:text-primary-focus">Stats</a></li>
      <li class="text-base-content/60">{stat?.name || 'Loading...'}</li>
    </ul>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60 mt-4">Loading stat details...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="card bg-error text-error-content shadow-xl">
      <div class="card-body text-center">
        <h2 class="card-title justify-center">
          <TrendingUp size={24} />
          Error Loading Stat
        </h2>
        <p>{error}</p>
        <div class="card-actions justify-center">
          <button onclick={loadStat} class="btn btn-neutral">Try Again</button>
          <a href="/stats" class="btn btn-outline">Back to Stats</a>
        </div>
      </div>
    </div>
  {:else if stat}
    <!-- Main Content -->
    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Stat Overview - Spans 2 columns on large screens -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Stat Header Card -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div class="flex-1">
                <div class="mb-4 flex items-center gap-4">
                  <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content w-16 rounded-full">
                      <BarChart3 size={32} />
                    </div>
                  </div>
                  <div>
                    <h1 class="text-primary text-3xl font-bold">{stat.name}</h1>
                    <p class="text-base-content/60 text-lg">Level {stat.currentLevel}</p>
                  </div>
                </div>
                <p class="text-base-content/80 mb-6">{stat.description}</p>

                <!-- XP Progress -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold">Progress to Level {stat.currentLevel + 1}</span>
                    <span class="text-primary text-2xl font-bold">{stat.totalXp} XP</span>
                  </div>
                  <div class="bg-base-300 h-4 w-full rounded-full">
                    <div
                      class="from-primary to-secondary flex h-4 items-center justify-end rounded-full bg-gradient-to-r pr-2 transition-all duration-700"
                      style="width: {progressPercentage()}%"
                    >
                      {#if progressPercentage() > 20}
                        <span class="text-primary-content text-xs font-semibold">
                          {Math.round(progressPercentage())}%
                        </span>
                      {/if}
                    </div>
                  </div>
                  <div class="text-base-content/60 flex justify-between text-sm">
                    <span>Current Level: {stat.currentLevel}</span>
                    <span>{stat.xpToNextLevel} XP needed for next level</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex min-w-[200px] flex-col gap-2">
                <button onclick={grantXp} class="btn btn-primary gap-2">
                  <Zap size={16} />
                  Grant XP
                </button>

                {#if stat.canLevelUp}
                  <button onclick={levelUp} class="btn btn-accent gap-2">
                    <Trophy size={16} />
                    Level Up!
                  </button>
                {/if}

                <button onclick={editStat} class="btn btn-outline gap-2">
                  <Edit size={16} />
                  Edit Stat
                </button>

                <button onclick={() => (showDeleteModal = true)} class="btn btn-outline btn-error gap-2">
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Example Activities -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h2 class="card-title border-base-300 mb-4 border-b pb-2 text-xl">
              <Target size={20} />
              Example Activities
            </h2>
            <div class="grid gap-4 md:grid-cols-2">
              {#each stat.exampleActivities ?? [] as activity}
                <div class="bg-base-200 rounded-lg p-4">
                  <div class="flex items-start justify-between gap-3">
                    <p class="flex-1 text-sm">{activity.description}</p>
                    <div class="badge badge-primary gap-1">
                      <Zap size={12} />
                      {activity.suggestedXp} XP
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- XP History -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h2 class="card-title border-base-300 mb-4 border-b pb-2 text-xl">
              <Activity size={20} />
              Recent XP History
            </h2>

            {#if xpHistory.length > 0}
              <div class="space-y-3">
                {#each xpHistory.slice(0, 10) as entry}
                  <div class="bg-base-200 flex items-center justify-between rounded-lg p-3">
                    <div class="flex-1">
                      <p class="font-medium">{entry.reason || 'XP Grant'}</p>
                      <p class="text-base-content/60 text-sm">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <div class="badge badge-success gap-1">
                      <Award size={12} />
                      +{entry.xpAmount} XP
                    </div>
                  </div>
                {/each}

                {#if xpHistory.length > 10}
                  <div class="pt-4 text-center">
                    <button class="btn btn-outline btn-sm">
                      View All History ({xpHistory.length} entries)
                    </button>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="py-8 text-center">
                <div class="avatar placeholder mb-4">
                  <div class="bg-base-300 text-base-content w-16 rounded-full">
                    <Activity size={32} />
                  </div>
                </div>
                <p class="text-base-content/60">No XP history yet. Start earning XP to see your progress!</p>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Sidebar - Stats Summary -->
      <div class="space-y-6">
        <!-- Quick Stats -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h3 class="card-title border-base-300 mb-4 border-b pb-2 text-lg">
              <BarChart3 size={18} />
              Quick Stats
            </h3>
            <div class="space-y-4">
              <div class="stat py-2">
                <div class="stat-title text-xs">Current Level</div>
                <div class="stat-value text-primary text-2xl">{stat.currentLevel}</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Total XP</div>
                <div class="stat-value text-secondary text-2xl">{stat.totalXp}</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">XP to Next Level</div>
                <div class="stat-value text-accent text-2xl">{stat.xpToNextLevel}</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Created</div>
                <div class="stat-desc text-sm">{formatDateTime(stat.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Level Progression -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h3 class="card-title border-base-300 mb-4 border-b pb-2 text-lg">
              <Trophy size={18} />
              Level Progression
            </h3>
            <div class="space-y-2">
              {#each Array(Math.min(stat.currentLevel + 3, 10)) as _, i}
                {@const level = i + 1}
                {@const isCurrentLevel = level === stat.currentLevel}
                {@const isCompleted = level < stat.currentLevel}
                {@const isNext = level === stat.currentLevel + 1}

                <div class="flex items-center gap-3 rounded-lg p-2 {isCurrentLevel ? 'bg-primary/10' : ''}">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full
										{isCompleted
                      ? 'bg-success text-success-content'
                      : isCurrentLevel
                        ? 'bg-primary text-primary-content'
                        : isNext
                          ? 'bg-warning text-warning-content'
                          : 'bg-base-300'}"
                  >
                    {#if isCompleted}
                      <Trophy size={14} />
                    {:else}
                      <span class="text-xs font-bold">{level}</span>
                    {/if}
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-medium">
                      Level {level}
                      {#if isCurrentLevel}
                        <span class="badge badge-primary badge-xs ml-2">Current</span>
                      {:else if isNext}
                        <span class="badge badge-warning badge-xs ml-2">Next</span>
                      {/if}
                    </div>
                    <div class="text-base-content/60 text-xs">
                      {level * 100} XP required
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="flex items-center gap-2 text-lg font-bold">
        <Trash2 size={20} class="text-error" />
        Delete Stat
      </h3>
      <p class="py-4">
        Are you sure you want to delete "<strong>{stat?.name}</strong>"? This action cannot be undone and will permanently remove all XP history.
      </p>
      <div class="modal-action">
        <button onclick={() => (showDeleteModal = false)} class="btn btn-outline" disabled={deleting}> Cancel </button>
        <button onclick={deleteStat} class="btn btn-error gap-2" disabled={deleting}>
          {#if deleting}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <Trash2 size={16} />
          {/if}
          Delete Permanently
        </button>
      </div>
    </div>
    <button class="modal-backdrop" onclick={() => (showDeleteModal = false)} aria-label="Close modal"></button>
  </div>
{/if}
