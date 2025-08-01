<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { experimentsApi } from '$lib/api/experiments';
  import { statsApi } from '$lib/api/stats';
  import type { ExperimentWithTasksResponse, UpdateExperimentRequest } from '$lib/types/experiments';
  import type { CharacterStatWithProgress } from '$lib/api/stats';
  import { ArrowLeft, Plus, Trash2, Calendar, Target, Award, Save } from 'lucide-svelte';

  // Reactive state
  let experiment: ExperimentWithTasksResponse | null = $state(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Stats for dropdown
  let userStats: CharacterStatWithProgress[] = $state([]);
  let loadingStats = $state(true);

  // Get experiment ID from URL
  let experimentId = $derived($page.params.id);

  // Form state
  let formData: UpdateExperimentRequest = $state({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    reflection: '',
    shouldRepeat: null,
  });

  // New task form
  let newTask = $state({
    description: '',
    successMetric: 1,
    xpReward: 10,
    statId: '',
  });

  // Load data on component mount
  onMount(async () => {
    await Promise.all([loadExperiment(), loadStats()]);
  });

  async function loadStats() {
    try {
      loadingStats = true;
      userStats = await statsApi.getUserStats();
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      loadingStats = false;
    }
  }

  async function loadExperiment() {
    try {
      loading = true;
      error = null;

      experiment = await experimentsApi.getExperiment(experimentId);

      // Populate form with existing data
      formData = {
        title: experiment.title,
        description: experiment.description || '',
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        reflection: experiment.reflection || '',
        shouldRepeat: experiment.shouldRepeat ?? null,
      };
    } catch (err) {
      console.error('Failed to load experiment:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load experiment';
    } finally {
      loading = false;
    }
  }

  async function saveExperiment() {
    try {
      saving = true;
      error = null;

      // Basic validation
      if (!formData.title?.trim()) {
        error = 'Title is required';
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        error = 'Start and end dates are required';
        return;
      }

      if (formData.startDate > formData.endDate) {
        error = 'End date must be after start date';
        return;
      }

      await experimentsApi.updateExperiment(experimentId, formData);
      goto(`/experiments/${experimentId}`);
    } catch (err) {
      console.error('Failed to save experiment:', err);
      error = err instanceof Error ? err.message : 'Failed to save experiment';
    } finally {
      saving = false;
    }
  }

  async function addTask() {
    if (!newTask.description.trim()) return;

    try {
      await experimentsApi.createExperimentTask(experimentId, {
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

      // Reload experiment to get updated tasks
      await loadExperiment();
    } catch (err) {
      console.error('Failed to add task:', err);
      error = err instanceof Error ? err.message : 'Failed to add task';
    }
  }

  async function removeTask(taskId: string) {
    if (!confirm('Are you sure you want to remove this task?')) {
      return;
    }

    try {
      await experimentsApi.deleteExperimentTask(experimentId, taskId);

      // Reload experiment to get updated tasks
      await loadExperiment();
    } catch (err) {
      console.error('Failed to remove task:', err);
      error = err instanceof Error ? err.message : 'Failed to remove task';
    }
  }

  function getDuration(startDate: string, endDate: string): number {
    // Parse the date components manually to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    // Create dates in local timezone without any UTC conversion
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
</script>

<svelte:head>
  <title>Edit Experiment - Journal App</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <!-- Navigation -->
  <div class="mb-6">
    <a href="/experiments/{experimentId}" class="btn btn-ghost btn-sm gap-2">
      <ArrowLeft class="h-4 w-4" />
      Back to Experiment
    </a>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="alert alert-error mb-6">
      <p>{error}</p>
      <button onclick={loadExperiment} class="btn btn-ghost btn-sm"> Try again </button>
    </div>
  {/if}

  {#if experiment}
    <!-- Form Content -->
    <div class="space-y-8">
      <!-- Header -->
      <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
        <div class="card-body">
          <h1 class="text-base-content mb-2 text-3xl font-bold">Edit Experiment</h1>
          <p class="text-base-content/60">Modify your experiment details and manage daily tasks.</p>
        </div>
      </div>

      <!-- Experiment Details Form -->
      <div class="card bg-base-100 border-base-300 border">
        <div class="card-body">
          <h2 class="text-base-content mb-6 text-2xl font-bold">Experiment Details</h2>

          <div class="space-y-6">
            <!-- Title -->
            <div class="form-control">
              <label for="title" class="label">
                <span class="label-text font-medium">Title</span>
              </label>
              <input
                id="title"
                type="text"
                bind:value={formData.title}
                placeholder="Enter experiment title"
                class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                maxlength="255"
              />
            </div>

            <!-- Description -->
            <div class="form-control">
              <label for="description" class="label">
                <span class="label-text font-medium">Description</span>
                <span class="label-text-alt text-xs opacity-60">Optional</span>
              </label>
              <textarea
                id="description"
                bind:value={formData.description}
                placeholder="Describe what you want to test or achieve..."
                class="textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
              ></textarea>
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="form-control">
                <label for="startDate" class="label">
                  <span class="label-text font-medium">Start Date</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  bind:value={formData.startDate}
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                />
              </div>

              <div class="form-control">
                <label for="endDate" class="label">
                  <span class="label-text font-medium">End Date</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  bind:value={formData.endDate}
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
            </div>

            <!-- Duration Display -->
            {#if formData.startDate && formData.endDate}
              <div class="alert alert-info">
                <Calendar class="h-5 w-5" />
                <span>
                  Duration: {getDuration(formData.startDate, formData.endDate)} days
                </span>
              </div>
            {/if}
          </div>

          <!-- Reflection Section -->
          <div class="space-y-6">
            <div class="divider">
              <span class="text-base-content/60 text-sm font-medium">Experiment Reflection</span>
            </div>

            <!-- Reflection -->
            <div class="form-control">
              <label for="reflection" class="label">
                <span class="label-text font-medium">How did it go?</span>
                <span class="label-text-alt text-xs opacity-60">Optional reflection</span>
              </label>
              <textarea
                id="reflection"
                bind:value={formData.reflection}
                placeholder="Reflect on your experiment experience... What worked well? What was challenging? What did you learn?"
                class="textarea textarea-bordered textarea-lg focus:textarea-primary h-40 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
              ></textarea>
            </div>

            <!-- Should Repeat -->
            <fieldset class="form-control">
              <legend class="label">
                <span class="label-text font-medium">Would you repeat this experiment?</span>
              </legend>
              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="shouldRepeat"
                    id="shouldRepeat-yes"
                    value="true"
                    checked={formData.shouldRepeat === true}
                    onchange={() => (formData.shouldRepeat = true)}
                    class="radio radio-primary"
                  />
                  <span class="label-text">Yes, I'd repeat this</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="shouldRepeat"
                    id="shouldRepeat-no"
                    value="false"
                    checked={formData.shouldRepeat === false}
                    onchange={() => (formData.shouldRepeat = false)}
                    class="radio radio-primary"
                  />
                  <span class="label-text">No, I wouldn't repeat this</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="shouldRepeat"
                    id="shouldRepeat-unsure"
                    value="null"
                    checked={formData.shouldRepeat === null}
                    onchange={() => (formData.shouldRepeat = null)}
                    class="radio radio-primary"
                  />
                  <span class="label-text">Not sure yet</span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Tasks Management -->
      <div class="card bg-base-100 border-base-300 border">
        <div class="card-body">
          <h2 class="text-base-content mb-6 flex items-center gap-2 text-2xl font-bold">
            <Target class="text-primary h-6 w-6" />
            Daily Tasks
          </h2>

          <!-- Existing Tasks -->
          {#if experiment.tasks && experiment.tasks.length > 0}
            <div class="mb-8 space-y-4">
              {#each experiment.tasks as task (task.id)}
                <div class="card bg-base-200 border-base-300 border">
                  <div class="card-body">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h3 class="text-base-content mb-2 font-semibold">{task.description}</h3>
                        <div class="text-base-content/60 flex items-center gap-4 text-sm">
                          {#if task.successMetric && task.successMetric > 1}
                            <div class="flex items-center gap-1">
                              <Target class="h-4 w-4" />
                              <span>Target: {task.successMetric} times</span>
                            </div>
                          {/if}
                          {#if task.xpReward && task.xpReward > 0}
                            <div class="flex items-center gap-1">
                              <Award class="h-4 w-4" />
                              <span>{task.xpReward} XP per completion</span>
                            </div>
                          {/if}
                          {#if task.statId}
                            {@const linkedStat = userStats.find((s) => s.id === task.statId)}
                            {#if linkedStat}
                              <div class="text-primary flex items-center gap-1">
                                <span class="bg-primary/10 rounded-full px-2 py-1 text-xs">
                                  → {linkedStat.name}
                                </span>
                              </div>
                            {/if}
                          {/if}
                        </div>
                      </div>
                      <button onclick={() => removeTask(task.id)} class="btn btn-ghost btn-sm text-error hover:bg-error/10">
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Add New Task Form -->
          <div class="border-t pt-6">
            <h3 class="text-base-content mb-4 text-lg font-semibold">Add New Task</h3>

            <div class="space-y-4">
              <div class="form-control">
                <label for="taskDescription" class="label">
                  <span class="label-text font-medium">Task Description</span>
                </label>
                <input
                  id="taskDescription"
                  type="text"
                  bind:value={newTask.description}
                  placeholder="e.g., Avoid checking social media"
                  class="input input-bordered focus:input-primary w-full"
                  maxlength="500"
                />
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="form-control">
                  <label for="successMetric" class="label">
                    <span class="label-text font-medium">Success Metric</span>
                    <span class="label-text-alt text-xs opacity-60">Times per day</span>
                  </label>
                  <input
                    id="successMetric"
                    type="number"
                    bind:value={newTask.successMetric}
                    min="1"
                    max="10"
                    class="input input-bordered focus:input-primary w-full"
                  />
                </div>

                <div class="form-control">
                  <label for="xpReward" class="label">
                    <span class="label-text font-medium">XP Reward</span>
                    <span class="label-text-alt text-xs opacity-60">Per completion</span>
                  </label>
                  <input id="xpReward" type="number" bind:value={newTask.xpReward} min="0" max="100" class="input input-bordered focus:input-primary w-full" />
                </div>
              </div>

              <div class="form-control">
                <label for="statId" class="label">
                  <span class="label-text font-medium">Link to Stat (Optional)</span>
                  <span class="label-text-alt text-xs opacity-60">Select which stat gains XP</span>
                </label>
                <select id="statId" bind:value={newTask.statId} class="select select-bordered focus:select-primary w-full">
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

              <button onclick={addTask} disabled={!newTask.description.trim()} class="btn btn-secondary">
                <Plus class="h-4 w-4" />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Actions -->
      <div class="flex items-center justify-between">
        <a href="/experiments/{experimentId}" class="btn btn-ghost"> Cancel </a>

        <button onclick={saveExperiment} disabled={saving || !formData.title?.trim()} class="btn btn-primary btn-lg">
          {#if saving}
            <span class="loading loading-spinner loading-sm"></span>
            Saving...
          {:else}
            <Save class="h-5 w-5" />
            Save Changes
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
