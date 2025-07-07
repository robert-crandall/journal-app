<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { statsApi, type CreateCharacterStatInput, type CharacterStatExampleActivity, type PredefinedStat } from '$lib/api/stats';
  import { ArrowLeft, Plus, Trash2, Lightbulb, Save, Zap } from 'lucide-svelte';

  // Form state
  let formData = $state<CreateCharacterStatInput>({
    name: '',
    description: '',
    exampleActivities: [{ description: '', suggestedXp: 25 }],
  });

  let predefinedStats: PredefinedStat[] = $state([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let isPresetMode = $state(false);

  // Check for preset parameter on mount
  onMount(async () => {
    await initializePage();
  });

  // Separate function to initialize the page
  async function initializePage() {
    // Load predefined stats for reference
    try {
      predefinedStats = await statsApi.getPredefinedStats();
    } catch (err) {
      console.error('Failed to load predefined stats:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
    }

    // Check if we're creating from a preset
    const presetName = $page.url.searchParams.get('preset');
    if (presetName && predefinedStats.length > 0) {
      const preset = predefinedStats.find((stat) => stat.name === presetName);
      if (preset) {
        formData = {
          name: preset.name,
          description: preset.description,
          exampleActivities: [...preset.exampleActivities],
        };
        isPresetMode = true;
      }
    }
  }

  // Form validation
  function validateForm(): string | null {
    if (!formData.name.trim()) return 'Stat name is required';
    if (formData.name.length > 100) return 'Stat name must be 100 characters or less';
    if (!formData.description.trim()) return 'Description is required';
    if (formData.description.length > 500) return 'Description must be 500 characters or less';
    if (formData.exampleActivities.length === 0) return 'At least one example activity is required';

    for (const activity of formData.exampleActivities) {
      if (!activity.description.trim()) return 'All example activities must have descriptions';
      if (activity.description.length > 200) return 'Activity descriptions must be 200 characters or less';
      if (activity.suggestedXp < 1 || activity.suggestedXp > 100) return 'Suggested XP must be between 1 and 100';
    }

    return null;
  }

  // Example activity management
  function addExampleActivity() {
    formData.exampleActivities = [...formData.exampleActivities, { description: '', suggestedXp: 25 }];
  }

  function removeExampleActivity(index: number) {
    if (formData.exampleActivities.length > 1) {
      formData.exampleActivities = formData.exampleActivities.filter((_, i) => i !== index);
    }
  }

  // Form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      error = validationError;
      return;
    }

    loading = true;
    error = null;

    try {
      await statsApi.createStat(formData);
      goto('/stats');
    } catch (err) {
      console.error('Failed to create stat:', err);
      error = err instanceof Error ? err.message : 'Failed to create stat';
    } finally {
      loading = false;
    }
  }

  // Quick preset helpers
  function usePreset(preset: PredefinedStat) {
    formData = {
      name: preset.name,
      description: preset.description,
      exampleActivities: [...preset.exampleActivities],
    };
    isPresetMode = true;
  }
</script>

<svelte:head>
  <title>Create Stat - Gamified Life</title>
  <meta name="description" content="Create a new character stat to track your personal development" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center gap-4">
        <button onclick={() => goto('/stats')} class="btn btn-circle btn-outline">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Create New Stat</h1>
          <p class="text-base-content/70 text-lg">
            {isPresetMode ? 'Customize this recommended stat for your character' : 'Design a custom stat to track your progress'}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Main Form (2/3 width) -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 border-base-300 border shadow-2xl">
          <div class="card-body p-8">
            <form onsubmit={handleSubmit} class="space-y-8">
              <!-- Stat Name -->
              <div class="form-control">
                <label class="label" for="stat-name">
                  <span class="label-text text-lg font-medium">Stat Name *</span>
                  <span class="label-text-alt text-xs opacity-60">{formData.name.length}/100</span>
                </label>
                <div class="relative">
                  <input
                    id="stat-name"
                    type="text"
                    placeholder="e.g., Programming, Fitness, Creativity"
                    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                    bind:value={formData.name}
                    maxlength="100"
                    required
                  />
                  <div class="absolute inset-y-0 right-3 flex items-center">
                    <Zap class="text-base-content/40" size={20} />
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="form-control">
                <label class="label" for="stat-description">
                  <span class="label-text text-lg font-medium">Description *</span>
                  <span class="label-text-alt text-xs opacity-60">{formData.description.length}/500</span>
                </label>
                <div class="relative">
                  <textarea
                    id="stat-description"
                    class="textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                    placeholder="Describe what this stat represents and why it's important to your personal development..."
                    bind:value={formData.description}
                    maxlength="500"
                    required
                  ></textarea>
                </div>
              </div>

              <!-- Example Activities -->
              <div class="form-control">
                <div class="label">
                  <span class="label-text text-lg font-medium">Example Activities *</span>
                  <span class="label-text-alt text-xs opacity-60">How you'll earn XP</span>
                </div>
                <div class="space-y-4">
                  {#each formData.exampleActivities as activity, index}
                    <div class="bg-base-200 grid grid-cols-1 gap-3 rounded-lg p-4 md:grid-cols-4">
                      <div class="md:col-span-3">
                        <label class="sr-only" for="activity-{index}">Activity {index + 1} description</label>
                        <input
                          id="activity-{index}"
                          type="text"
                          placeholder="e.g., Complete a coding challenge, workout for 30 minutes"
                          class="input input-bordered w-full"
                          bind:value={activity.description}
                          maxlength="200"
                          required
                        />
                      </div>
                      <div class="flex gap-2">
                        <div class="flex flex-1 items-center gap-2">
                          <label class="sr-only" for="xp-{index}">Suggested XP for activity {index + 1}</label>
                          <input
                            id="xp-{index}"
                            type="number"
                            placeholder="XP"
                            class="input input-bordered w-20"
                            bind:value={activity.suggestedXp}
                            min="1"
                            max="100"
                            required
                          />
                          <span class="text-base-content/60 text-sm">XP</span>
                        </div>
                        {#if formData.exampleActivities.length > 1}
                          <button
                            type="button"
                            class="btn btn-circle btn-sm btn-outline btn-error"
                            onclick={() => removeExampleActivity(index)}
                            aria-label="Remove activity {index + 1}"
                          >
                            <Trash2 size={16} />
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/each}

                  <button type="button" class="btn btn-outline btn-sm gap-2" onclick={addExampleActivity}>
                    <Plus size={16} />
                    Add Activity
                  </button>
                </div>
              </div>

              <!-- Error Display -->
              {#if error}
                <div class="alert alert-error">
                  <div class="flex items-center gap-3">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              {/if}

              <!-- Submit Button -->
              <div class="flex gap-4 pt-4">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg h-16 flex-1 text-lg shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  disabled={loading}
                >
                  {#if loading}
                    <span class="loading loading-spinner loading-md"></span>
                    Creating Stat...
                  {:else}
                    <Save size={24} />
                    Create Stat
                  {/if}
                </button>
                <button type="button" onclick={() => goto('/stats')} class="btn btn-outline btn-lg gap-2"> Cancel </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Sidebar (1/3 width) -->
      <div class="lg:col-span-1">
        <div class="sticky top-8 space-y-6">
          <!-- Tips Card -->
          <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
            <div class="card-body p-6">
              <div class="mb-4 flex items-center gap-2">
                <Lightbulb class="text-primary" size={20} />
                <h3 class="text-primary font-semibold">Tips for Great Stats</h3>
              </div>
              <div class="space-y-3 text-sm">
                <p class="text-base-content/70">Choose stats that are personally meaningful and measurable.</p>
                <p class="text-base-content/70">Good stats reflect skills or qualities you actively want to develop.</p>
                <p class="text-base-content/70">XP amounts should feel rewarding but not too easy to earn.</p>
                <p class="text-base-content/70">Include diverse activities to keep progress interesting.</p>
              </div>
            </div>
          </div>

          <!-- Preset Stats (if not in preset mode) -->
          {#if !isPresetMode && predefinedStats.length > 0}
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">🎯 Quick Start</h3>
                <p class="text-base-content/70 mb-4 text-sm">Use one of these well-designed stat templates:</p>
                <div class="space-y-2">
                  {#each predefinedStats.slice(0, 4) as preset}
                    <button type="button" class="btn btn-outline btn-sm w-full justify-start" onclick={() => usePreset(preset)}>
                      {preset.name}
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Form Progress -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h3 class="mb-4 font-semibold">Form Progress</h3>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span>Name:</span>
                  <span class="text-{formData.name.trim() ? 'success' : 'base-content/40'}">
                    {formData.name.trim() ? '✓' : '○'}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span>Description:</span>
                  <span class="text-{formData.description.trim() ? 'success' : 'base-content/40'}">
                    {formData.description.trim() ? '✓' : '○'}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span>Activities:</span>
                  <span class="text-{formData.exampleActivities.some((a) => a.description.trim()) ? 'success' : 'base-content/40'}">
                    {formData.exampleActivities.some((a) => a.description.trim()) ? '✓' : '○'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
