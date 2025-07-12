<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { experimentsApi, type ExperimentResponse } from '$lib/api/experiments';
  import { Plus, Beaker, Calendar, BarChart, Trash2, Edit3, Eye } from 'lucide-svelte';

  // Reactive state for experiments data
  let userExperiments: ExperimentResponse[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Load data on component mount
  onMount(async () => {
    await loadExperimentsData();
  });

  // Separate function to load experiments data
  async function loadExperimentsData() {
    try {
      loading = true;
      error = null;

      const experimentsData = await experimentsApi.getUserExperiments();
      userExperiments = experimentsData;
    } catch (err) {
      console.error('Failed to load experiments:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load experiments';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getExperimentStatus(experiment: ExperimentResponse): 'upcoming' | 'active' | 'completed' {
    const today = new Date().toISOString().split('T')[0];
    const startDate = experiment.startDate;
    const endDate = experiment.endDate;

    if (today < startDate) return 'upcoming';
    if (today > endDate) return 'completed';
    return 'active';
  }

  function getExperimentStatusColor(status: 'upcoming' | 'active' | 'completed'): string {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
    }
  }

  function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    }

    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  }

  function getDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  async function deleteExperiment(id: string) {
    if (!confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }

    try {
      await experimentsApi.deleteExperiment(id);
      await loadExperimentsData(); // Reload the list
    } catch (err) {
      console.error('Failed to delete experiment:', err);
      error = err instanceof Error ? err.message : 'Failed to delete experiment';
    }
  }

  // Group experiments by status
  let groupedExperiments = $derived(() => {
    const grouped = {
      active: userExperiments.filter((exp) => getExperimentStatus(exp) === 'active'),
      upcoming: userExperiments.filter((exp) => getExperimentStatus(exp) === 'upcoming'),
      completed: userExperiments.filter((exp) => getExperimentStatus(exp) === 'completed'),
    };
    return grouped;
  });
</script>

<svelte:head>
  <title>Experiments</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <Beaker class="h-8 w-8 text-purple-600" />
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Experiments</h1>
        <p class="text-gray-600">Short-lived self-improvement tests to discover what makes your life better</p>
      </div>
    </div>
    <a href="/experiments/create" class="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700">
      <Plus class="h-5 w-5" />
      New Experiment
    </a>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
      <p class="text-red-800">{error}</p>
      <button onclick={loadExperimentsData} class="mt-2 text-red-600 underline hover:text-red-700"> Try again </button>
    </div>
  {:else if userExperiments.length === 0}
    <!-- Empty State -->
    <div class="py-12 text-center">
      <Beaker class="mx-auto mb-4 h-16 w-16 text-gray-300" />
      <h3 class="mb-2 text-xl font-semibold text-gray-900">No experiments yet</h3>
      <p class="mx-auto mb-6 max-w-md text-gray-600">
        Start your first experiment to test changes in your life and track what makes you happier and more productive.
      </p>
      <a href="/experiments/create" class="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700">
        <Plus class="h-5 w-5" />
        Create Your First Experiment
      </a>
    </div>
  {:else}
    <!-- Experiments List -->
    <div class="space-y-8">
      <!-- Active Experiments -->
      {#if groupedExperiments.active.length > 0}
        <div>
          <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <span class="h-3 w-3 rounded-full bg-green-500"></span>
            Active Experiments ({groupedExperiments.active.length})
          </h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each groupedExperiments.active as experiment}
              <div class="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <div class="mb-4 flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="mb-2 font-semibold text-gray-900">{experiment.title}</h3>
                    {#if experiment.description}
                      <p class="mb-3 line-clamp-2 text-sm text-gray-600">{experiment.description}</p>
                    {/if}
                  </div>
                  <span class="rounded-full px-2 py-1 text-xs font-medium {getExperimentStatusColor(getExperimentStatus(experiment))}">
                    {getExperimentStatus(experiment)}
                  </span>
                </div>

                <div class="mb-4 flex items-center gap-4 text-sm text-gray-500">
                  <div class="flex items-center gap-1">
                    <Calendar class="h-4 w-4" />
                    {formatDateRange(experiment.startDate, experiment.endDate)}
                  </div>
                  <div class="flex items-center gap-1">
                    <BarChart class="h-4 w-4" />
                    {getDuration(experiment.startDate, experiment.endDate)} days
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    href="/experiments/{experiment.id}/dashboard"
                    class="flex flex-1 items-center justify-center gap-1 rounded bg-purple-100 px-3 py-2 text-center text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
                  >
                    <BarChart class="h-4 w-4" />
                    Dashboard
                  </a>
                  <a
                    href="/experiments/{experiment.id}"
                    class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    title="View Details"
                  >
                    <Eye class="h-4 w-4" />
                  </a>
                  <a
                    href="/experiments/{experiment.id}/edit"
                    class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    title="Edit"
                  >
                    <Edit3 class="h-4 w-4" />
                  </a>
                  <button
                    onclick={() => deleteExperiment(experiment.id)}
                    class="rounded p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Upcoming Experiments -->
      {#if groupedExperiments.upcoming.length > 0}
        <div>
          <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <span class="h-3 w-3 rounded-full bg-blue-500"></span>
            Upcoming Experiments ({groupedExperiments.upcoming.length})
          </h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each groupedExperiments.upcoming as experiment}
              <div class="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <div class="mb-4 flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="mb-2 font-semibold text-gray-900">{experiment.title}</h3>
                    {#if experiment.description}
                      <p class="mb-3 line-clamp-2 text-sm text-gray-600">{experiment.description}</p>
                    {/if}
                  </div>
                  <span class="rounded-full px-2 py-1 text-xs font-medium {getExperimentStatusColor(getExperimentStatus(experiment))}">
                    {getExperimentStatus(experiment)}
                  </span>
                </div>

                <div class="mb-4 flex items-center gap-4 text-sm text-gray-500">
                  <div class="flex items-center gap-1">
                    <Calendar class="h-4 w-4" />
                    {formatDateRange(experiment.startDate, experiment.endDate)}
                  </div>
                  <div class="flex items-center gap-1">
                    <BarChart class="h-4 w-4" />
                    {getDuration(experiment.startDate, experiment.endDate)} days
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    href="/experiments/{experiment.id}"
                    class="flex flex-1 items-center justify-center gap-1 rounded bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    <Eye class="h-4 w-4" />
                    View Details
                  </a>
                  <a
                    href="/experiments/{experiment.id}/edit"
                    class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    title="Edit"
                  >
                    <Edit3 class="h-4 w-4" />
                  </a>
                  <button
                    onclick={() => deleteExperiment(experiment.id)}
                    class="rounded p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Completed Experiments -->
      {#if groupedExperiments.completed.length > 0}
        <div>
          <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <span class="h-3 w-3 rounded-full bg-gray-500"></span>
            Completed Experiments ({groupedExperiments.completed.length})
          </h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each groupedExperiments.completed as experiment}
              <div class="rounded-lg border border-gray-200 bg-white p-6 opacity-75 transition-shadow hover:shadow-lg">
                <div class="mb-4 flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="mb-2 font-semibold text-gray-900">{experiment.title}</h3>
                    {#if experiment.description}
                      <p class="mb-3 line-clamp-2 text-sm text-gray-600">{experiment.description}</p>
                    {/if}
                  </div>
                  <span class="rounded-full px-2 py-1 text-xs font-medium {getExperimentStatusColor(getExperimentStatus(experiment))}">
                    {getExperimentStatus(experiment)}
                  </span>
                </div>

                <div class="mb-4 flex items-center gap-4 text-sm text-gray-500">
                  <div class="flex items-center gap-1">
                    <Calendar class="h-4 w-4" />
                    {formatDateRange(experiment.startDate, experiment.endDate)}
                  </div>
                  <div class="flex items-center gap-1">
                    <BarChart class="h-4 w-4" />
                    {getDuration(experiment.startDate, experiment.endDate)} days
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    href="/experiments/{experiment.id}/dashboard"
                    class="flex flex-1 items-center justify-center gap-1 rounded bg-purple-100 px-3 py-2 text-center text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
                  >
                    <BarChart class="h-4 w-4" />
                    View Results
                  </a>
                  <a
                    href="/experiments/{experiment.id}"
                    class="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    title="View Details"
                  >
                    <Eye class="h-4 w-4" />
                  </a>
                  <button
                    onclick={() => deleteExperiment(experiment.id)}
                    class="rounded p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
</style>
