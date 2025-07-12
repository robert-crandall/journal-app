<script lang="ts">
  import { goto } from '$app/navigation';
  import { experimentsApi, type CreateExperimentRequest } from '$lib/api/experiments';
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
  });

  function addTask() {
    if (!newTask.description.trim()) return;

    formData.tasks.push({
      description: newTask.description.trim(),
      successMetric: newTask.successMetric,
      xpReward: newTask.xpReward,
    });

    // Reset form
    newTask = {
      description: '',
      successMetric: 1,
      xpReward: 10,
    };
  }

  function removeTask(index: number) {
    formData.tasks = formData.tasks.filter((_, i) => i !== index);
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
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  let duration = $derived(calculateDuration(formData.startDate, formData.endDate));
</script>

<svelte:head>
  <title>Create Experiment</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <a href="/experiments" class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900" title="Back to Experiments">
      <ArrowLeft class="h-5 w-5" />
    </a>
    <div class="flex items-center gap-3">
      <Beaker class="h-8 w-8 text-purple-600" />
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Create Experiment</h1>
        <p class="text-gray-600">Design a short-term test to improve your life</p>
      </div>
    </div>
  </div>

  <!-- Form -->
  <form onsubmit={handleSubmit} class="space-y-6">
    <!-- Basic Information -->
    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>

      <!-- Title -->
      <div class="mb-4">
        <label for="title" class="mb-2 block text-sm font-medium text-gray-700"> Experiment Title * </label>
        <input
          id="title"
          type="text"
          bind:value={formData.title}
          placeholder="e.g., No social media for 7 days"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label for="description" class="mb-2 block text-sm font-medium text-gray-700"> Description </label>
        <textarea
          id="description"
          bind:value={formData.description}
          placeholder="Describe what you're testing and why..."
          rows="3"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
        ></textarea>
      </div>

      <!-- Date Range -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label for="startDate" class="mb-2 block text-sm font-medium text-gray-700"> Start Date * </label>
          <input
            id="startDate"
            type="date"
            bind:value={formData.startDate}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label for="endDate" class="mb-2 block text-sm font-medium text-gray-700"> End Date * </label>
          <input
            id="endDate"
            type="date"
            bind:value={formData.endDate}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
      </div>

      {#if duration > 0}
        <div class="mt-3 flex items-center gap-2 text-sm text-purple-600">
          <Calendar class="h-4 w-4" />
          Duration: {duration} day{duration === 1 ? '' : 's'}
        </div>
      {/if}
    </div>

    <!-- Daily Tasks -->
    <div class="rounded-lg border border-gray-200 bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Daily Tasks</h2>
        <div class="text-sm text-gray-500">
          {formData.tasks.length} task{formData.tasks.length === 1 ? '' : 's'}
        </div>
      </div>

      <p class="mb-4 text-sm text-gray-600">Add tasks that you'll do daily during this experiment. These will appear on your homepage.</p>

      <!-- Existing Tasks -->
      {#if formData.tasks.length > 0}
        <div class="mb-6 space-y-3">
          {#each formData.tasks as task, index}
            <div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Target class="h-5 w-5 flex-shrink-0 text-purple-600" />
              <div class="flex-1">
                <div class="font-medium text-gray-900">{task.description}</div>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span>Goal: {task.successMetric} time{task.successMetric === 1 ? '' : 's'} during experiment</span>
                  {#if task.xpReward > 0}
                    <span class="flex items-center gap-1">
                      <Award class="h-3 w-3" />
                      {task.xpReward} XP per completion
                    </span>
                  {/if}
                </div>
              </div>
              <button
                type="button"
                onclick={() => removeTask(index)}
                class="rounded p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                title="Remove task"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Add New Task -->
      <div class="rounded-lg border border-gray-200 p-4">
        <h3 class="mb-3 font-medium text-gray-900">Add New Task</h3>
        <div class="space-y-3">
          <div>
            <input
              type="text"
              bind:value={newTask.description}
              placeholder="e.g., Avoid checking Instagram"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label for="successMetric" class="mb-1 block text-sm font-medium text-gray-700"> Success Metric (times during experiment) </label>
              <input
                id="successMetric"
                type="number"
                bind:value={newTask.successMetric}
                min="1"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label for="xpReward" class="mb-1 block text-sm font-medium text-gray-700"> XP Reward (per completion) </label>
              <input
                id="xpReward"
                type="number"
                bind:value={newTask.xpReward}
                min="0"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <button
            type="button"
            onclick={addTask}
            disabled={!newTask.description.trim()}
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-purple-700 transition-colors hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus class="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="rounded-lg border border-red-200 bg-red-50 p-4">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}

    <!-- Submit Buttons -->
    <div class="flex items-center gap-3 pt-4">
      <button
        type="submit"
        disabled={loading || !formData.title.trim()}
        class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {#if loading}
          <div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
          Creating...
        {:else}
          <Beaker class="h-5 w-5" />
          Create Experiment
        {/if}
      </button>
      <a href="/experiments" class="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"> Cancel </a>
    </div>
  </form>
</div>
