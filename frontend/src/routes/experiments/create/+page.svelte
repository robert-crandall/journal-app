<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { experimentsApi, type CreateExperimentRequest } from '$lib/api/experiments';
  import { statsApi, type CharacterStatWithProgress } from '$lib/api/stats';
  import { Beaker, Plus, Trash2, Calendar, Target, Award, ArrowLeft } from 'lucide-svelte';

  // Form state
  let formData: CreateExperimentRequest = $state({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    tasks: [],
  });

  let loading = $state(false);
  let error = $state<string | null>(null);
  let userStats = $state<CharacterStatWithProgress[]>([]);
  let loadingStats = $state(true);

  // Set default start date to today
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  formData.startDate = todayString;

  // Set default end date to 7 days from now
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 6); // 7 days total (inclusive)
  formData.endDate = nextWeek.toISOString().split('T')[0];

  // New task form
  let newTask = $state({
    description: '',
    successMetric: 1,
    xpReward: 10,
    statId: '',
  });

  // Load user stats on mount
  onMount(async () => {
    try {
      userStats = await statsApi.getUserStats();
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      loadingStats = false;
    }
  });

  function addTask() {
    if (!newTask.description.trim()) return;

    if (!formData.tasks) {
      formData.tasks = [];
    }

    formData.tasks.push({
      description: newTask.description.trim(),
      successMetric: newTask.successMetric,
      xpReward: newTask.xpReward,
      statId: newTask.statId || undefined,
    });

    // Reset form
    newTask = {
      description: '',
      successMetric: 1,
      xpReward: 10,
      statId: '',
    };
  }

  function removeTask(index: number) {
    if (formData.tasks) {
      formData.tasks = formData.tasks.filter((_, i) => i !== index);
    }
  }

  async function handleSubmit() {
    try {
      loading = true;
      error = null;

      // Basic validation
      if (!formData.title.trim()) {
        error = 'Title is required';
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        error = 'Start and end dates are required';
        return;
      }

      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        error = 'End date must be on or after start date';
        return;
      }

      const experiment = await experimentsApi.createExperiment({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
      });

      // Redirect to the experiment detail page
      goto(`/experiments/${experiment.id}`);
    } catch (err) {
      console.error('Failed to create experiment:', err);
      error = err instanceof Error ? err.message : 'Failed to create experiment';
    } finally {
      loading = false;
    }
  }

  function calculateDuration(start: string, end: string): number {
    if (!start || !end) return 0;

    // Parse the date components manually to avoid timezone issues
    const [startYear, startMonth, startDay] = start.split('-').map(Number);
    const [endYear, endMonth, endDay] = end.split('-').map(Number);

    // Create dates in local timezone without any UTC conversion
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  let duration = $derived(calculateDuration(formData.startDate, formData.endDate));
</script>

<svelte:head>
  <title>Create Experiment - Gamified Life</title>
  <meta name="description" content="Design a short-term test to improve your life" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center gap-4">
        <button onclick={() => goto('/experiments')} class="btn btn-circle btn-outline">
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div class="flex items-center gap-3">
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content w-16 rounded-full">
              <Beaker class="h-8 w-8" />
            </div>
          </div>
          <div>
            <h1 class="text-primary text-3xl font-bold">Create Experiment</h1>
            <p class="text-base-content/70">Design a short-term test to improve your life</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body p-8">
        <form onsubmit={handleSubmit} class="space-y-8">
          <!-- Basic Information -->
          <div>
            <h2 class="text-primary mb-6 text-xl font-semibold">Basic Information</h2>

            <!-- Title -->
            <div class="form-control mb-6">
              <label class="label" for="title">
                <span class="label-text text-lg font-medium">Experiment Title *</span>
              </label>
              <input
                id="title"
                type="text"
                bind:value={formData.title}
                placeholder="e.g., No social media for 7 days"
                class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-control mb-6">
              <label class="label" for="description">
                <span class="label-text text-lg font-medium">Description</span>
              </label>
              <textarea
                id="description"
                bind:value={formData.description}
                placeholder="Describe what you're testing and why..."
                rows="3"
                class="textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
              ></textarea>
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="form-control">
                <label class="label" for="startDate">
                  <span class="label-text text-lg font-medium">Start Date *</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  bind:value={formData.startDate}
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label" for="endDate">
                  <span class="label-text text-lg font-medium">End Date *</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  bind:value={formData.endDate}
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  required
                />
              </div>
            </div>

            {#if duration > 0}
              <div class="text-primary mt-4 flex items-center gap-2 text-sm">
                <Calendar class="h-4 w-4" />
                Duration: {duration} day{duration === 1 ? '' : 's'}
              </div>
            {/if}
          </div>

          <!-- Daily Tasks -->
          <div>
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-primary text-xl font-semibold">Daily Tasks</h2>
              <div class="text-base-content/70 text-sm">
                {formData.tasks?.length || 0} task{(formData.tasks?.length || 0) === 1 ? '' : 's'}
              </div>
            </div>

            <p class="text-base-content/70 mb-6">Add tasks that you'll do daily during this experiment. These will appear on your homepage.</p>

            <!-- Existing Tasks -->
            {#if formData.tasks && formData.tasks.length > 0}
              <div class="mb-8 space-y-4">
                {#each formData.tasks as task, index}
                  <div class="from-secondary/10 to-accent/10 border-base-300 flex items-center gap-4 rounded-lg border bg-gradient-to-r p-4">
                    <Target class="text-primary h-6 w-6 flex-shrink-0" />
                    <div class="flex-1">
                      <div class="text-base-content font-medium">{task.description}</div>
                      <div class="text-base-content/70 flex items-center gap-4 text-sm">
                        <span>Goal: {task.successMetric || 1} time{(task.successMetric || 1) === 1 ? '' : 's'} during experiment</span>
                        {#if (task.xpReward || 0) > 0}
                          <span class="flex items-center gap-1">
                            <Award class="h-3 w-3" />
                            {task.xpReward} XP per completion
                          </span>
                        {/if}
                      </div>
                    </div>
                    <button type="button" onclick={() => removeTask(index)} class="btn btn-circle btn-outline btn-error btn-sm" title="Remove task">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Add New Task -->
            <div class="card bg-base-200 border-base-300 border">
              <div class="card-body p-6">
                <h3 class="text-base-content mb-4 font-medium">Add New Task</h3>
                <div class="space-y-4">
                  <div class="form-control">
                    <input
                      type="text"
                      bind:value={newTask.description}
                      placeholder="e.g., Avoid checking Instagram"
                      class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="form-control">
                      <label class="label" for="successMetric">
                        <span class="label-text font-medium">Success Metric (times during experiment)</span>
                      </label>
                      <input
                        id="successMetric"
                        type="number"
                        bind:value={newTask.successMetric}
                        min="1"
                        class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div class="form-control">
                      <label class="label" for="xpReward">
                        <span class="label-text font-medium">XP Reward (per completion)</span>
                      </label>
                      <input
                        id="xpReward"
                        type="number"
                        bind:value={newTask.xpReward}
                        min="0"
                        class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div class="form-control">
                      <label class="label" for="statId">
                        <span class="label-text font-medium">Link to Stat (Optional)</span>
                      </label>
                      <select
                        id="statId"
                        bind:value={newTask.statId}
                        class="select select-bordered select-lg focus:select-primary w-full transition-all duration-200 focus:scale-[1.02]"
                      >
                        <option value="">No stat link</option>
                        {#if loadingStats}
                          <option disabled>Loading stats...</option>
                        {:else}
                          {#each userStats as stat}
                            <option value={stat.id}>{stat.name}</option>
                          {/each}
                        {/if}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onclick={addTask}
                    disabled={!newTask.description.trim()}
                    class="btn btn-primary btn-lg w-full gap-2 transition-all duration-200 hover:scale-105"
                  >
                    <Plus class="h-5 w-5" />
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Display -->
          {#if error}
            <div class="alert alert-error">
              <p>{error}</p>
            </div>
          {/if}

          <!-- Submit Buttons -->
          <div class="flex flex-col gap-4 pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              class="btn btn-primary btn-lg flex-1 gap-2 transition-all duration-200 hover:scale-105"
            >
              {#if loading}
                <span class="loading loading-spinner loading-sm"></span>
                Creating...
              {:else}
                <Beaker class="h-5 w-5" />
                Create Experiment
              {/if}
            </button>
            <button type="button" onclick={() => goto('/experiments')} class="btn btn-outline btn-lg gap-2"> Cancel </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
