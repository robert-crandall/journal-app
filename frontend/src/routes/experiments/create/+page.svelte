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

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <!-- Header -->
  <div class="flex items-center gap-4 mb-8">
    <a 
      href="/experiments" 
      class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      title="Back to Experiments"
    >
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
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
      
      <!-- Title -->
      <div class="mb-4">
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Experiment Title *
        </label>
        <input
          id="title"
          type="text"
          bind:value={formData.title}
          placeholder="e.g., No social media for 7 days"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          bind:value={formData.description}
          placeholder="Describe what you're testing and why..."
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        ></textarea>
      </div>

      <!-- Date Range -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            id="startDate"
            type="date"
            bind:value={formData.startDate}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            id="endDate"
            type="date"
            bind:value={formData.endDate}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Daily Tasks</h2>
        <div class="text-sm text-gray-500">
          {formData.tasks.length} task{formData.tasks.length === 1 ? '' : 's'}
        </div>
      </div>
      
      <p class="text-gray-600 text-sm mb-4">
        Add tasks that you'll do daily during this experiment. These will appear on your homepage.
      </p>

      <!-- Existing Tasks -->
      {#if formData.tasks.length > 0}
        <div class="space-y-3 mb-6">
          {#each formData.tasks as task, index}
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Target class="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div class="flex-1">
                <div class="font-medium text-gray-900">{task.description}</div>
                <div class="text-sm text-gray-500 flex items-center gap-4">
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
                class="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Remove task"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Add New Task -->
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-medium text-gray-900 mb-3">Add New Task</h3>
        <div class="space-y-3">
          <div>
            <input
              type="text"
              bind:value={newTask.description}
              placeholder="e.g., Avoid checking Instagram"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label for="successMetric" class="block text-sm font-medium text-gray-700 mb-1">
                Success Metric (times during experiment)
              </label>
              <input
                id="successMetric"
                type="number"
                bind:value={newTask.successMetric}
                min="1"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label for="xpReward" class="block text-sm font-medium text-gray-700 mb-1">
                XP Reward (per completion)
              </label>
              <input
                id="xpReward"
                type="number"
                bind:value={newTask.xpReward}
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="button"
            onclick={addTask}
            disabled={!newTask.description.trim()}
            class="w-full bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus class="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}

    <!-- Submit Buttons -->
    <div class="flex items-center gap-3 pt-4">
      <button
        type="submit"
        disabled={loading || !formData.title.trim()}
        class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Creating...
        {:else}
          <Beaker class="h-5 w-5" />
          Create Experiment
        {/if}
      </button>
      <a
        href="/experiments"
        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </a>
    </div>
  </form>
</div>