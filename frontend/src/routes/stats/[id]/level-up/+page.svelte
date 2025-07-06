<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { statsApi } from '$lib/api/stats.js';
  import { Trophy, ArrowLeft, Sparkles, TrendingUp, Zap, Star, Crown, Award, PartyPopper } from 'lucide-svelte';

  // Type definitions
  interface Stat {
    id: string;
    name: string;
    description: string;
    currentLevel: number;
    totalXp: number;
    xpToNextLevel: number;
    canLevelUp: boolean;
  }

  // State
  let stat = $state<Stat | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let leveling = $state(false);
  let leveledUp = $state(false);
  let newLevel = $state<number>(0);

  // Animation states
  let showConfetti = $state(false);
  let showLevelBadge = $state(false);

  // Derived values
  const statId = $derived($page.params.id);
  const nextLevel = $derived(() => (stat ? stat.currentLevel + 1 : 1));
  const levelTitle = $derived(() => {
    if (!stat) return '';
    const level = stat.currentLevel + 1;
    if (level <= 5) return 'Novice';
    if (level <= 10) return 'Apprentice';
    if (level <= 20) return 'Journeyman';
    if (level <= 35) return 'Expert';
    if (level <= 50) return 'Master';
    return 'Grandmaster';
  });

  // Functions
  async function loadStat() {
    if (!statId) return;

    try {
      loading = true;
      error = null;
      stat = await statsApi.getStat(statId);
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

  async function levelUp() {
    if (!stat || !stat.canLevelUp) return;

    try {
      leveling = true;
      error = null;

      const updatedStat = await statsApi.levelUp(stat.id);
      newLevel = updatedStat.currentLevel;
      stat = updatedStat;

      // Show celebration animations
      leveledUp = true;
      showConfetti = true;

      // Stagger the animations
      setTimeout(() => {
        showLevelBadge = true;
      }, 500);
    } catch (err) {
      console.error('Error leveling up:', err);
      error = 'Failed to level up. Please try again.';
    } finally {
      leveling = false;
    }
  }

  function goBack() {
    goto(`/stats/${statId}`);
  }

  function continueToStats() {
    goto(`/stats/${statId}`);
  }

  // Lifecycle
  onMount(() => {
    loadStat();
  });
</script>

<!-- Page Header -->
<div class="container mx-auto max-w-4xl px-4 py-8">
  {#if !leveledUp}
    <!-- Breadcrumb -->
    <div class="breadcrumbs mb-6 text-sm">
      <ul>
        <li><a href="/stats" class="text-primary hover:text-primary-focus">Stats</a></li>
        <li>
          <a href="/stats/{statId}" class="text-primary hover:text-primary-focus">
            {stat?.name || 'Loading...'}
          </a>
        </li>
        <li class="text-base-content/60">Level Up</li>
      </ul>
    </div>
  {/if}

  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60 mt-4">Loading stat details...</p>
      </div>
    </div>
  {:else if error && !stat}
    <!-- Error State -->
    <div class="card bg-error text-error-content shadow-xl">
      <div class="card-body text-center">
        <h2 class="card-title justify-center">
          <Trophy size={24} />
          Error Loading Stat
        </h2>
        <p>{error}</p>
        <div class="card-actions justify-center">
          <button onclick={loadStat} class="btn btn-neutral">Try Again</button>
          <a href="/stats" class="btn btn-outline">Back to Stats</a>
        </div>
      </div>
    </div>
  {:else if leveledUp}
    <!-- Success/Celebration State -->
    <div class="space-y-8 py-12 text-center">
      <!-- Confetti Animation -->
      {#if showConfetti}
        <div class="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {#each Array(20) as _, i}
            <div
              class="absolute animate-bounce"
              style="
								left: {Math.random() * 100}%; 
								top: {Math.random() * 100}%;
								animation-delay: {Math.random() * 2}s;
								animation-duration: {2 + Math.random() * 2}s;
							"
            >
              <div class="text-2xl">
                {#if i % 4 === 0}🎉
                {:else if i % 4 === 1}⭐
                {:else if i % 4 === 2}🏆
                {:else}✨
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Level Up Celebration -->
      <div class="card from-primary/20 to-secondary/20 border-primary border-2 bg-gradient-to-br shadow-2xl">
        <div class="card-body text-center">
          <!-- Level Badge -->
          {#if showLevelBadge}
            <div class="mb-6 flex justify-center">
              <div class="relative">
                <div class="from-warning flex h-32 w-32 animate-pulse items-center justify-center rounded-full bg-gradient-to-br to-amber-500 shadow-lg">
                  <Crown size={48} class="text-warning-content" />
                </div>
                <div class="badge badge-success absolute -top-2 -right-2 animate-bounce gap-1">
                  <Star size={12} />
                  NEW!
                </div>
              </div>
            </div>
          {/if}

          <h1 class="text-primary mb-2 flex items-center justify-center gap-3 text-4xl font-bold">
            <Trophy size={40} />
            Level Up!
          </h1>

          <p class="text-base-content/80 mb-6 text-xl">
            <strong>{stat?.name}</strong> has reached Level
            <strong class="text-primary">{newLevel}</strong>!
          </p>

          <div class="stats border-base-300 mb-8 border shadow">
            <div class="stat place-items-center">
              <div class="stat-title">Previous Level</div>
              <div class="stat-value text-base-content/60 text-2xl">{newLevel - 1}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">New Level</div>
              <div class="stat-value text-primary text-3xl">{newLevel}</div>
            </div>
            <div class="stat place-items-center">
              <div class="stat-title">Total XP</div>
              <div class="stat-value text-secondary text-2xl">{stat?.totalXp}</div>
            </div>
          </div>

          <!-- Achievement Badge -->
          <div class="card bg-base-100 border-success/20 mx-auto mb-8 max-w-md border shadow-lg">
            <div class="card-body py-6 text-center">
              <div class="mb-3 flex justify-center">
                <Award size={32} class="text-success" />
              </div>
              <h3 class="text-success text-lg font-bold">Achievement Unlocked!</h3>
              <p class="text-base-content/80 text-sm">
                You've earned the title "<strong>{levelTitle}</strong>" in {stat?.name}
              </p>
            </div>
          </div>

          <!-- Continue Button -->
          <div class="card-actions justify-center">
            <button onclick={continueToStats} class="btn btn-primary btn-lg gap-2">
              <Sparkles size={20} />
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  {:else if stat && !stat.canLevelUp}
    <!-- Cannot Level Up State -->
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body text-center">
        <div class="avatar placeholder mb-6">
          <div class="bg-warning text-warning-content w-20 rounded-full">
            <TrendingUp size={40} />
          </div>
        </div>
        <h2 class="card-title mb-4 justify-center text-2xl">Not Ready to Level Up</h2>
        <p class="text-base-content/80 mb-6">
          You need <strong class="text-warning">{stat.xpToNextLevel} more XP</strong> to reach Level {stat.currentLevel + 1} in {stat.name}.
        </p>

        <div class="stats border-base-300 mb-8 border shadow">
          <div class="stat place-items-center">
            <div class="stat-title">Current Level</div>
            <div class="stat-value text-primary">{stat.currentLevel}</div>
          </div>
          <div class="stat place-items-center">
            <div class="stat-title">Current XP</div>
            <div class="stat-value text-secondary">{stat.totalXp}</div>
          </div>
          <div class="stat place-items-center">
            <div class="stat-title">XP Needed</div>
            <div class="stat-value text-warning">{stat.xpToNextLevel}</div>
          </div>
        </div>

        <div class="card-actions justify-center gap-4">
          <button onclick={goBack} class="btn btn-outline gap-2">
            <ArrowLeft size={16} />
            Back to Stat
          </button>
          <a href="/stats/{stat.id}/grant-xp" class="btn btn-primary gap-2">
            <Zap size={16} />
            Grant XP
          </a>
        </div>
      </div>
    </div>
  {:else if stat}
    <!-- Ready to Level Up State -->
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body">
        <!-- Header -->
        <div class="mb-6 flex items-center gap-4">
          <button onclick={goBack} class="btn btn-circle btn-outline btn-sm">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 class="text-primary flex items-center gap-2 text-2xl font-bold">
              <Trophy size={24} />
              Level Up {stat.name}
            </h1>
            <p class="text-base-content/60">You've earned enough XP to advance to the next level!</p>
          </div>
        </div>

        <!-- Error Message -->
        {#if error}
          <div class="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        {/if}

        <!-- Current Progress -->
        <div class="card from-primary/10 to-secondary/10 border-primary/20 mb-8 border bg-gradient-to-r">
          <div class="card-body">
            <h3 class="card-title mb-4 flex items-center gap-2 text-lg">
              <TrendingUp size={18} />
              Ready for Level {stat.currentLevel + 1}!
            </h3>

            <div class="mb-6 grid gap-4 md:grid-cols-3">
              <div class="stat bg-base-100 rounded-lg">
                <div class="stat-title">Current Level</div>
                <div class="stat-value text-primary">{stat.currentLevel}</div>
              </div>
              <div class="stat bg-base-100 rounded-lg">
                <div class="stat-title">Total XP</div>
                <div class="stat-value text-secondary">{stat.totalXp}</div>
              </div>
              <div class="stat bg-base-100 rounded-lg">
                <div class="stat-title">Next Level</div>
                <div class="stat-value text-accent">{stat.currentLevel + 1}</div>
              </div>
            </div>

            <!-- Progress Bar (Full) -->
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Level {stat.currentLevel}</span>
                <span class="text-success font-semibold">Ready to Level Up!</span>
                <span>Level {stat.currentLevel + 1}</span>
              </div>
              <div class="bg-base-300 h-4 w-full rounded-full">
                <div class="from-success to-accent flex h-4 w-full items-center justify-center rounded-full bg-gradient-to-r">
                  <span class="text-success-content text-xs font-semibold">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Level Up Benefits -->
        <div class="card bg-base-100 border-base-300 mb-8 border">
          <div class="card-body">
            <h3 class="card-title mb-4 flex items-center gap-2 text-lg">
              <Star size={18} />
              Level {nextLevel()} Benefits
            </h3>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="bg-success/10 flex items-center gap-3 rounded-lg p-3">
                <Crown size={20} class="text-success" />
                <div>
                  <p class="text-success font-medium">New Title</p>
                  <p class="text-base-content/80 text-sm">Earn the "{levelTitle}" rank</p>
                </div>
              </div>
              <div class="bg-primary/10 flex items-center gap-3 rounded-lg p-3">
                <Trophy size={20} class="text-primary" />
                <div>
                  <p class="text-primary font-medium">Achievement</p>
                  <p class="text-base-content/80 text-sm">Level {nextLevel()} milestone reached</p>
                </div>
              </div>
              <div class="bg-secondary/10 flex items-center gap-3 rounded-lg p-3">
                <TrendingUp size={20} class="text-secondary" />
                <div>
                  <p class="text-secondary font-medium">Progress</p>
                  <p class="text-base-content/80 text-sm">Higher XP capacity unlocked</p>
                </div>
              </div>
              <div class="bg-accent/10 flex items-center gap-3 rounded-lg p-3">
                <Sparkles size={20} class="text-accent" />
                <div>
                  <p class="text-accent font-medium">Motivation</p>
                  <p class="text-base-content/80 text-sm">Celebration and momentum boost</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions justify-center">
          <button onclick={goBack} class="btn btn-outline gap-2" disabled={leveling}>
            <ArrowLeft size={16} />
            Back to Stat
          </button>
          <button onclick={levelUp} class="btn btn-primary btn-lg gap-2" disabled={leveling}>
            {#if leveling}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <Trophy size={20} />
            {/if}
            Level Up to {nextLevel()}!
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
