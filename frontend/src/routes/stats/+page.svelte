<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { statsApi, type CharacterStatWithProgress, type PredefinedStat } from '$lib/api/stats';
  import { Plus, TrendingUp, Star, BarChart3, Zap, Trophy } from 'lucide-svelte';

  // Reactive state for stats data
  let userStats: CharacterStatWithProgress[] = $state([]);
  let predefinedStats: PredefinedStat[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Load data on component mount
  onMount(async () => {
    await loadStatsData();
  });

  // Separate function to load stats data
  async function loadStatsData() {
    try {
      loading = true;
      error = null;

      // Load both user stats and predefined stats in parallel
      const [userStatsData, predefinedStatsData] = await Promise.all([statsApi.getUserStats(), statsApi.getPredefinedStats()]);

      userStats = userStatsData;
      predefinedStats = predefinedStatsData;
    } catch (err) {
      console.error('Failed to load stats:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load stats';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getStatIcon(statName: string) {
    const name = statName.toLowerCase();
    if (name.includes('strength')) return BarChart3;
    if (name.includes('wisdom')) return Star;
    if (name.includes('creativity')) return Zap;
    if (name.includes('fatherhood') || name.includes('adventure')) return Trophy;
    return TrendingUp;
  }

  // Derived values for icons to avoid using svelte:component
  let userStatsWithIcons = $derived(
    userStats.map((stat) => ({
      ...stat,
      IconComponent: getStatIcon(stat.name),
    })),
  );

  let predefinedStatsWithIcons = $derived(
    predefinedStats.map((stat) => ({
      ...stat,
      IconComponent: getStatIcon(stat.name),
    })),
  );

  function calculateProgress(stat: CharacterStatWithProgress): number {
    const totalXpForLevel = Math.pow(stat.currentLevel, 2) * 100;
    const currentLevelXp = stat.totalXp - (stat.currentLevel > 1 ? Math.pow(stat.currentLevel - 1, 2) * 100 : 0);
    const xpNeededForLevel = Math.pow(stat.currentLevel + 1, 2) * 100 - totalXpForLevel;
    return Math.floor((currentLevelXp / xpNeededForLevel) * 100);
  }

  // Navigation functions
  function createCustomStat() {
    goto('/stats/create');
  }

  function editStat(statId: string) {
    goto(`/stats/${statId}/edit`);
  }

  function viewStatDetails(statId: string) {
    goto(`/stats/${statId}`);
  }
</script>

<svelte:head>
  <title>Character Stats - Gamified Life</title>
  <meta name="description" content="Manage your character's stats and track your personal development progress" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center gap-3">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content w-12 rounded-full">📊</div>
        </div>
        <div>
          <h1 class="text-primary text-3xl font-bold">Stats</h1>
          <p class="text-base-content/70">Track your progress and level up your abilities</p>
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
          <p class="text-base-content/60">Loading your stats...</p>
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
      <!-- Stats Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Stats Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          <!-- Current Stats Section -->
          {#if userStats.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">Your Stats</h2>
              <div class="grid gap-6 md:grid-cols-2">
                {#each userStatsWithIcons as stat}
                  <button
                    class="card bg-base-100 border-base-300 w-full cursor-pointer border text-left shadow-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl"
                    onclick={() => viewStatDetails(stat.id)}
                  >
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="avatar placeholder">
                            <div class="bg-primary text-primary-content w-12 rounded-full">
                              <stat.IconComponent size={24} />
                            </div>
                          </div>
                          <div>
                            <h3 class="text-lg font-bold">{stat.name}</h3>
                            <p class="text-base-content/60 text-sm">Level {stat.currentLevel}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-primary text-2xl font-bold">{stat.totalXp}</div>
                          <div class="text-base-content/60 text-xs">XP</div>
                        </div>
                      </div>

                      <p class="text-base-content/80 mb-4 text-sm">{stat.description}</p>

                      <!-- Progress Bar -->
                      <div class="space-y-2">
                        <div class="flex justify-between text-xs">
                          <span>Progress to Level {stat.currentLevel + 1}</span>
                          <span>{stat.xpToNextLevel} XP needed</span>
                        </div>
                        <div class="bg-base-300 h-3 w-full rounded-full">
                          <div
                            class="from-primary to-secondary h-3 rounded-full bg-gradient-to-r transition-all duration-500"
                            style="width: {calculateProgress(stat)}%"
                          ></div>
                        </div>
                      </div>

                      <!-- Level Up Button -->
                      {#if stat.canLevelUp}
                        <div class="mt-4">
                          <div
                            class="btn btn-accent btn-sm w-full cursor-pointer gap-2"
                            onclick={(e) => {
                              e.stopPropagation();
                              goto(`/stats/${stat.id}/level-up`);
                            }}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                goto(`/stats/${stat.id}/level-up`);
                              }
                            }}
                          >
                            <Trophy size={16} />
                            Level Up Available!
                          </div>
                        </div>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </section>
          {:else}
            <!-- Empty State for User Stats -->
            <section>
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body py-12 text-center">
                  <div class="avatar placeholder mb-6">
                    <div class="bg-base-300 text-base-content w-20 rounded-full">
                      <TrendingUp size={40} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">No Stats Yet</h3>
                  <p class="text-base-content/60 mb-6">Start your journey by creating a custom stat or choosing from our predefined options.</p>
                  <button onclick={createCustomStat} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Create Your First Stat
                  </button>
                </div>
              </div>
            </section>
          {/if}

          <!-- Predefined Stats Section -->
          {#if predefinedStats.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">Recommended Stats</h2>
              <p class="text-base-content/70 mb-6">
                These are carefully designed stats that work well for personal development. Click to add them to your character.
              </p>
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {#each predefinedStatsWithIcons as predefinedStat}
                  <div class="card from-secondary/5 to-accent/5 border-secondary/20 border bg-gradient-to-br transition-all duration-200 hover:shadow-lg">
                    <div class="card-body p-4">
                      <div class="mb-3 flex items-center gap-3">
                        <div class="avatar placeholder">
                          <div class="bg-secondary text-secondary-content w-10 rounded-full">
                            <predefinedStat.IconComponent size={20} />
                          </div>
                        </div>
                        <h4 class="font-semibold">{predefinedStat.name}</h4>
                      </div>

                      <p class="text-base-content/70 mb-3 text-sm">{predefinedStat.description}</p>

                      <div class="mb-4 space-y-1">
                        <div class="text-base-content/60 text-xs font-medium">Example Activities:</div>
                        {#each predefinedStat.exampleActivities.slice(0, 2) as activity}
                          <div class="text-base-content/50 text-xs">
                            • {activity.description} ({activity.suggestedXp} XP)
                          </div>
                        {/each}
                      </div>

                      <button class="btn btn-secondary btn-sm w-full" onclick={() => goto(`/stats/create?preset=${encodeURIComponent(predefinedStat.name)}`)}>
                        Add to Character
                      </button>
                    </div>
                  </div>
                {/each}
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
                    <span class="text-sm">Active Stats:</span>
                    <span class="font-medium">{userStats.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Total XP:</span>
                    <span class="font-medium">{userStats.reduce((sum, stat) => sum + stat.totalXp, 0)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Ready to Level:</span>
                    <span class="text-accent font-medium">{userStats.filter((stat) => stat.canLevelUp).length}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Tips</h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">Click on a stat card to view detailed progress and XP history.</p>
                  <p class="text-base-content/70">Stats automatically track XP from completed tasks and journal entries.</p>
                  <p class="text-base-content/70">Level up manually when you feel you've genuinely improved in that area.</p>
                </div>
              </div>
            </div>

            <!-- Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Actions</h3>
                <div class="space-y-2">
                  <button onclick={createCustomStat} class="btn btn-primary w-full gap-2">
                    <Plus size={16} />
                    Create Custom Stat
                  </button>
                  <button onclick={() => goto('/stats/history')} class="btn btn-outline btn-sm w-full gap-2">
                    <BarChart3 size={16} />
                    View XP History
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
