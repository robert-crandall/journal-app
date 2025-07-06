<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.js';
  import { statsApi } from '$lib/api/stats.js';
  import { Zap, ArrowLeft, Trophy, Target, Clock, CheckCircle2 } from 'lucide-svelte';

  // Type definitions
  interface Stat {
    id: string;
    name: string;
    description: string;
    currentLevel: number;
    totalXp: number;
    xpToNextLevel: number;
    canLevelUp: boolean;
    exampleActivities: Array<{
      description: string;
      suggestedXp: number;
    }>;
  }

  // State
  let stat = $state<Stat | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let submitting = $state(false);
  let success = $state(false);

  // Form state
  let xpAmount = $state<number>(1);
  let description = $state('');
  let selectedActivity = $state<string>('');

  // Derived values
  const statId = $derived($page.params.id);
  const isValid = $derived(xpAmount > 0 && xpAmount <= 100 && description.trim().length > 0);

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

  async function grantXp() {
    if (!stat || !isValid) return;

    try {
      submitting = true;
      error = null;

      await statsApi.grantXp(stat.id, xpAmount, 'adhoc', description.trim());

      success = true;

      // Reset form
      xpAmount = 1;
      description = '';
      selectedActivity = '';

      // Show success for a moment, then redirect
      setTimeout(() => {
        if (stat) {
          goto(`/stats/${stat.id}`);
        }
      }, 1500);
    } catch (err) {
      console.error('Error granting XP:', err);
      error = 'Failed to grant XP. Please try again.';
    } finally {
      submitting = false;
    }
  }

  function selectActivity(activity: { description: string; suggestedXp: number }) {
    description = activity.description;
    xpAmount = activity.suggestedXp;
    selectedActivity = activity.description;
  }

  function goBack() {
    goto(`/stats/${statId}`);
  }

  // Lifecycle
  onMount(() => {
    loadStat();
  });
</script>

<!-- Page Header -->
<div class="container mx-auto max-w-4xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="breadcrumbs mb-6 text-sm">
    <ul>
      <li><a href="/stats" class="text-primary hover:text-primary-focus">Stats</a></li>
      <li>
        <a href="/stats/{statId}" class="text-primary hover:text-primary-focus">
          {stat?.name || 'Loading...'}
        </a>
      </li>
      <li class="text-base-content/60">Grant XP</li>
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
  {:else if error && !stat}
    <!-- Error State -->
    <div class="card bg-error text-error-content shadow-xl">
      <div class="card-body text-center">
        <h2 class="card-title justify-center">
          <Zap size={24} />
          Error Loading Stat
        </h2>
        <p>{error}</p>
        <div class="card-actions justify-center">
          <button onclick={loadStat} class="btn btn-neutral">Try Again</button>
          <a href="/stats" class="btn btn-outline">Back to Stats</a>
        </div>
      </div>
    </div>
  {:else if success}
    <!-- Success State -->
    <div class="card bg-success text-success-content shadow-xl">
      <div class="card-body text-center">
        <h2 class="card-title justify-center">
          <CheckCircle2 size={24} />
          XP Granted Successfully!
        </h2>
        <p>+{xpAmount} XP has been added to {stat?.name}</p>
        <div class="card-actions justify-center">
          <span class="loading loading-spinner loading-sm"></span>
          <span>Redirecting to stat details...</span>
        </div>
      </div>
    </div>
  {:else if stat}
    <!-- Main Content -->
    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Grant XP Form - Spans 2 columns on large screens -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <!-- Header -->
            <div class="mb-6 flex items-center gap-4">
              <button onclick={goBack} class="btn btn-circle btn-outline btn-sm">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 class="text-primary flex items-center gap-2 text-2xl font-bold">
                  <Zap size={24} />
                  Grant XP to {stat.name}
                </h1>
                <p class="text-base-content/60">Award yourself experience points for completed activities</p>
              </div>
            </div>

            <!-- Error Message -->
            {#if error}
              <div class="alert alert-error mb-6">
                <span>{error}</span>
              </div>
            {/if}

            <!-- Grant XP Form -->
            <form
              onsubmit={(e) => {
                e.preventDefault();
                grantXp();
              }}
              class="space-y-6"
            >
              <!-- Activity Description -->
              <div class="form-control">
                <label class="label" for="description">
                  <span class="label-text text-lg font-medium">What did you accomplish? *</span>
                </label>
                <textarea
                  id="description"
                  class="textarea textarea-bordered h-24 resize-none"
                  placeholder="e.g., Completed a 30-minute workout, finished reading a chapter, solved a coding problem..."
                  bind:value={description}
                  maxlength="500"
                  required
                  disabled={submitting}
                ></textarea>
                <div class="label">
                  <span class="label-text-alt">
                    {description.length}/500 characters
                  </span>
                </div>
              </div>

              <!-- XP Amount -->
              <div class="form-control">
                <label class="label" for="xp-amount">
                  <span class="label-text text-lg font-medium">XP Amount *</span>
                  <span class="label-text-alt text-xs opacity-60">1-100 XP</span>
                </label>
                <div class="join max-w-xs">
                  <input
                    id="xp-amount"
                    type="number"
                    class="input input-bordered join-item flex-1"
                    bind:value={xpAmount}
                    min="1"
                    max="100"
                    required
                    disabled={submitting}
                  />
                  <span class="btn btn-outline join-item pointer-events-none">XP</span>
                </div>
                <div class="label">
                  <span class="label-text-alt text-xs opacity-60"> Consider the effort and impact of your accomplishment </span>
                </div>
              </div>

              <!-- Quick Time Stamps -->
              <div class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Quick Time Options</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-outline btn-sm gap-1"
                    onclick={() => {
                      if (stat) {
                        description = `Worked for 15 minutes on ${stat.name.toLowerCase()}`;
                        xpAmount = 5;
                      }
                    }}
                    disabled={submitting}
                  >
                    <Clock size={14} />
                    15 min (+5 XP)
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-sm gap-1"
                    onclick={() => {
                      if (stat) {
                        description = `Worked for 30 minutes on ${stat.name.toLowerCase()}`;
                        xpAmount = 10;
                      }
                    }}
                    disabled={submitting}
                  >
                    <Clock size={14} />
                    30 min (+10 XP)
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-sm gap-1"
                    onclick={() => {
                      if (stat) {
                        description = `Dedicated 1 hour to ${stat.name.toLowerCase()}`;
                        xpAmount = 20;
                      }
                    }}
                    disabled={submitting}
                  >
                    <Clock size={14} />
                    1 hour (+20 XP)
                  </button>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="form-control pt-4">
                <button type="submit" class="btn btn-primary gap-2" disabled={!isValid || submitting}>
                  {#if submitting}
                    <span class="loading loading-spinner loading-sm"></span>
                  {:else}
                    <Zap size={16} />
                  {/if}
                  Grant {xpAmount} XP
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Sidebar - Example Activities and Tips -->
      <div class="space-y-6">
        <!-- Example Activities -->
        {#if stat.exampleActivities && stat.exampleActivities.length > 0}
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body">
              <h3 class="card-title border-base-300 mb-4 border-b pb-2 text-lg">
                <Target size={18} />
                Example Activities
              </h3>
              <div class="space-y-3">
                {#each stat.exampleActivities as activity}
                  <button
                    type="button"
                    class="bg-base-200 hover:bg-base-300 w-full rounded-lg p-3 text-left transition-colors duration-200
											{selectedActivity === activity.description ? 'ring-primary ring-2' : ''}"
                    onclick={() => selectActivity(activity)}
                    disabled={submitting}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <p class="flex-1 text-sm">{activity.description}</p>
                      <div class="badge badge-primary flex-shrink-0 gap-1">
                        <Zap size={10} />
                        {activity.suggestedXp}
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
              <p class="text-base-content/60 mt-4 text-xs">Click an activity to auto-fill the form with its description and suggested XP.</p>
            </div>
          </div>
        {/if}

        <!-- Tips -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h3 class="card-title border-base-300 mb-4 border-b pb-2 text-lg">
              <Trophy size={18} />
              XP Granting Tips
            </h3>
            <div class="space-y-3 text-sm">
              <div class="bg-info/10 rounded-lg p-3">
                <p class="text-info font-medium">Small wins matter!</p>
                <p class="text-base-content/80">Award 1-5 XP for quick tasks and small progress steps.</p>
              </div>
              <div class="bg-success/10 rounded-lg p-3">
                <p class="text-success font-medium">Moderate efforts</p>
                <p class="text-base-content/80">Give 10-25 XP for meaningful practice sessions and completed tasks.</p>
              </div>
              <div class="bg-warning/10 rounded-lg p-3">
                <p class="text-warning font-medium">Major achievements</p>
                <p class="text-base-content/80">Reward 30-50 XP for significant milestones and breakthroughs.</p>
              </div>
              <div class="bg-error/10 rounded-lg p-3">
                <p class="text-error font-medium">Epic accomplishments</p>
                <p class="text-base-content/80">Grant 60+ XP for extraordinary achievements and major completions.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Progress -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h3 class="card-title border-base-300 mb-4 border-b pb-2 text-lg">Current Progress</h3>
            <div class="space-y-3">
              <div class="stat py-2">
                <div class="stat-title text-xs">Current Level</div>
                <div class="stat-value text-primary text-xl">{stat.currentLevel}</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Total XP</div>
                <div class="stat-value text-secondary text-xl">{stat.totalXp}</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">XP to Next Level</div>
                <div class="stat-value text-accent text-xl">{stat.xpToNextLevel}</div>
              </div>

              {#if stat.canLevelUp}
                <div class="alert alert-success">
                  <Trophy size={16} />
                  <span class="text-sm">Ready to level up!</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
