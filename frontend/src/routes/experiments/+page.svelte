<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { experimentsApi, type ExperimentResponse } from '$lib/api/experiments';
  import { Plus, Beaker, Calendar, BarChart, Trash2, Edit3, Eye } from 'lucide-svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

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
    const today = new Date().toLocaleDateString('en-CA');
    const startDate = experiment.startDate;
    const endDate = experiment.endDate;

    if (today < startDate) return 'upcoming';
    if (today > endDate) return 'completed';
    return 'active';
  }

  function getExperimentStatusColor(status: 'upcoming' | 'active' | 'completed'): string {
    switch (status) {
      case 'upcoming':
        return 'badge-info';
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-neutral';
    }
  }

  function formatDateRange(startDate: string, endDate: string): string {
    // Parse the date components manually to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    // Create dates in local timezone without any UTC conversion
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (startYear !== endYear) {
      return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    }

    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
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
      <Beaker class="text-primary h-8 w-8" />
      <div>
        <h1 class="text-base-content text-3xl font-bold">Experiments</h1>
        <p class="text-base-content/60">Short-lived self-improvement tests to discover what makes your life better</p>
      </div>
    </div>
    <a href="/experiments/create" class="btn btn-primary gap-2">
      <Plus class="h-5 w-5" />
      New Experiment
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
      <button onclick={loadExperimentsData} class="btn btn-ghost btn-sm"> Try again </button>
    </div>
  {:else if userExperiments.length === 0}
    <!-- Empty State -->
    <div class="py-12 text-center">
      <Beaker class="text-base-content/30 mx-auto mb-4 h-16 w-16" />
      <h3 class="text-base-content mb-2 text-xl font-semibold">No experiments yet</h3>
      <p class="text-base-content/60 mx-auto mb-6 max-w-md">
        Start your first experiment to test changes in your life and track what makes you happier and more productive.
      </p>
      <a href="/experiments/create" class="btn btn-primary gap-2">
        <Plus class="h-5 w-5" />
        Create Your First Experiment
      </a>
    </div>
  {:else}
    <!-- Experiments List -->
    <div class="space-y-8">
      <!-- Active Experiments -->
      {#if groupedExperiments().active.length > 0}
        <div>
          <h2 class="text-base-content mb-4 flex items-center gap-2 text-xl font-semibold">
            <span class="bg-success h-3 w-3 rounded-full"></span>
            Active Experiments ({groupedExperiments().active.length})
          </h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each groupedExperiments().active as experiment (experiment.id)}
              <div class="card bg-base-100 shadow-lg transition-shadow hover:shadow-xl">
                <div class="card-body">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="card-title text-base-content">{experiment.title}</h3>
                      {#if experiment.description}
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        <p class="text-base-content/60 prose prose-sm mb-3 text-sm">{@html DOMPurify.sanitize(String(marked.parse(experiment.description)))}</p>
                      {/if}
                    </div>
                    <span class="badge {getExperimentStatusColor(getExperimentStatus(experiment))}">
                      {getExperimentStatus(experiment)}
                    </span>
                  </div>

                  <div class="text-base-content/60 mb-4 flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-1">
                      <Calendar class="h-4 w-4" />
                      {formatDateRange(experiment.startDate, experiment.endDate)}
                    </div>
                    <div class="flex items-center gap-1">
                      <BarChart class="h-4 w-4" />
                      {getDuration(experiment.startDate, experiment.endDate)} days
                    </div>
                  </div>

                  <div class="card-actions justify-end">
                    <a href="/experiments/{experiment.id}" class="btn btn-primary btn-sm gap-1">
                      <BarChart class="h-4 w-4" />
                      Dashboard
                    </a>
                    <a href="/experiments/{experiment.id}/edit" class="btn btn-ghost btn-sm btn-circle" title="Edit">
                      <Edit3 class="h-4 w-4" />
                    </a>
                    <button onclick={() => deleteExperiment(experiment.id)} class="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10" title="Delete">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Upcoming Experiments -->
      {#if groupedExperiments().upcoming.length > 0}
        <div>
          <h2 class="text-base-content mb-4 flex items-center gap-2 text-xl font-semibold">
            <span class="bg-info h-3 w-3 rounded-full"></span>
            Upcoming Experiments ({groupedExperiments().upcoming.length})
          </h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each groupedExperiments().upcoming as experiment (experiment.id)}
              <div class="card bg-base-100 shadow-lg transition-shadow hover:shadow-xl">
                <div class="card-body">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="card-title text-base-content">{experiment.title}</h3>
                      {#if experiment.description}
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        <p class="text-base-content/60 prose prose-sm mb-3 text-sm">{@html DOMPurify.sanitize(String(marked.parse(experiment.description)))}</p>
                      {/if}
                    </div>
                    <span class="badge {getExperimentStatusColor(getExperimentStatus(experiment))}">
                      {getExperimentStatus(experiment)}
                    </span>
                  </div>

                  <div class="text-base-content/60 mb-4 flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-1">
                      <Calendar class="h-4 w-4" />
                      {formatDateRange(experiment.startDate, experiment.endDate)}
                    </div>
                    <div class="flex items-center gap-1">
                      <BarChart class="h-4 w-4" />
                      {getDuration(experiment.startDate, experiment.endDate)} days
                    </div>
                  </div>

                  <div class="card-actions justify-end">
                    <a href="/experiments/{experiment.id}" class="btn btn-secondary btn-sm gap-1">
                      <Eye class="h-4 w-4" />
                      View Details
                    </a>
                    <a href="/experiments/{experiment.id}/edit" class="btn btn-ghost btn-sm btn-circle" title="Edit">
                      <Edit3 class="h-4 w-4" />
                    </a>
                    <button onclick={() => deleteExperiment(experiment.id)} class="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10" title="Delete">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Completed Experiments -->
      {#if groupedExperiments().completed.length > 0}
        <div>
          <h2 class="text-base-content mb-4 flex items-center gap-2 text-xl font-semibold">
            <span class="bg-neutral h-3 w-3 rounded-full"></span>
            Completed Experiments ({groupedExperiments().completed.length})
          </h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each groupedExperiments().completed as experiment (experiment.id)}
              <div class="card bg-base-100 opacity-75 shadow-lg transition-shadow hover:shadow-xl">
                <div class="card-body">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <h3 class="card-title text-base-content">{experiment.title}</h3>
                        {#if experiment.reflection}
                          <span class="badge badge-info badge-sm">Reviewed</span>
                        {/if}
                      </div>
                      {#if experiment.description}
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                        <p class="text-base-content/60 prose prose-sm mb-3 text-sm">{@html DOMPurify.sanitize(String(marked.parse(experiment.description)))}</p>
                      {/if}
                    </div>
                    <span class="badge {getExperimentStatusColor(getExperimentStatus(experiment))}">
                      {getExperimentStatus(experiment)}
                    </span>
                  </div>

                  <div class="text-base-content/60 mb-4 flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-1">
                      <Calendar class="h-4 w-4" />
                      {formatDateRange(experiment.startDate, experiment.endDate)}
                    </div>
                    <div class="flex items-center gap-1">
                      <BarChart class="h-4 w-4" />
                      {getDuration(experiment.startDate, experiment.endDate)} days
                    </div>
                  </div>

                  <!-- Reflection and Repeat Info for Completed Experiments -->
                  {#if experiment.reflection || experiment.shouldRepeat !== null}
                    <div class="border-base-200 border-t pt-3 mb-4">
                      {#if experiment.reflection}
                        <div class="mb-2">
                          <p class="text-base-content/80 text-xs font-medium mb-1">Reflection:</p>
                          <p class="text-base-content/60 text-sm italic">"{experiment.reflection}"</p>
                        </div>
                      {/if}
                      {#if experiment.shouldRepeat !== null}
                        <div>
                          <p class="text-base-content/80 text-xs font-medium mb-1">Would repeat:</p>
                          <span class="badge badge-sm {experiment.shouldRepeat === true ? 'badge-success' : experiment.shouldRepeat === false ? 'badge-error' : 'badge-warning'}">
                            {experiment.shouldRepeat === true ? 'Yes' : experiment.shouldRepeat === false ? 'No' : 'Not sure'}
                          </span>
                        </div>
                      {/if}
                    </div>
                  {/if}

                  <div class="card-actions justify-end">
                    <a href="/experiments/{experiment.id}" class="btn btn-primary btn-sm gap-1">
                      <BarChart class="h-4 w-4" />
                      View Results
                    </a>
                    <button onclick={() => deleteExperiment(experiment.id)} class="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10" title="Delete">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
