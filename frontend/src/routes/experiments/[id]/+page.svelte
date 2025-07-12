<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { experimentsApi } from '$lib/api/experiments';
  import type { ExperimentWithTasksResponse } from '$lib/api/experiments';
  import { ArrowLeft, Calendar, BarChart, Edit3, Trash2, Target, Award, CheckCircle2, Clock } from 'lucide-svelte';

  // Reactive state
  let experiment: ExperimentWithTasksResponse | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let deleting = $state(false);

  // Get experiment ID from URL
  let experimentId = $derived($page.params.id);

  // Load data on component mount
  onMount(async () => {
    await loadExperiment();
  });

  async function loadExperiment() {
    try {
      loading = true;
      error = null;

      experiment = await experimentsApi.getExperiment(experimentId);
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

  async function deleteExperiment() {
    if (!experiment) return;

    if (!confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }

    try {
      deleting = true;
      await experimentsApi.deleteExperiment(experiment.id);
      goto('/experiments');
    } catch (err) {
      console.error('Failed to delete experiment:', err);
      error = err instanceof Error ? err.message : 'Failed to delete experiment';
    } finally {
      deleting = false;
    }
  }

  // Helper functions
  function getExperimentStatus(exp: ExperimentWithTasksResponse): 'upcoming' | 'active' | 'completed' {
    const today = new Date().toISOString().split('T')[0];
    const startDate = exp.startDate;
    const endDate = exp.endDate;

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
      default:
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

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
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

  function getDaysRemaining(exp: ExperimentWithTasksResponse): number {
    const today = new Date();
    // Parse the date components manually to avoid timezone issues
    const [endYear, endMonth, endDay] = exp.endDate.split('-').map(Number);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getDaysElapsed(exp: ExperimentWithTasksResponse): number {
    const today = new Date();
    // Parse the date components manually to avoid timezone issues
    const [startYear, startMonth, startDay] = exp.startDate.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);

    const diffTime = today.getTime() - startDate.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }
</script>

<svelte:head>
  <title>{experiment ? experiment.title : 'Experiment'} - Journal App</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <!-- Navigation -->
  <div class="mb-6">
    <a href="/experiments" class="btn btn-ghost btn-sm gap-2">
      <ArrowLeft class="h-4 w-4" />
      Back to Experiments
    </a>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="alert alert-error">
      <h3 class="text-lg font-semibold">Error Loading Experiment</h3>
      <p>{error}</p>
      <button onclick={loadExperiment} class="btn btn-outline btn-error"> Try Again </button>
    </div>
  {:else if experiment}
    <!-- Experiment Content -->
    <div class="space-y-8">
      <!-- Header -->
      <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-3">
                <h1 class="text-base-content text-3xl font-bold">{experiment.title}</h1>
                <span class="badge {getExperimentStatusColor(getExperimentStatus(experiment))} badge-lg">
                  {getExperimentStatus(experiment)}
                </span>
              </div>

              {#if experiment.description}
                <p class="text-base-content/70 mb-4 text-lg">{experiment.description}</p>
              {/if}

              <div class="text-base-content/60 flex flex-wrap items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <Calendar class="h-4 w-4" />
                  <span>{formatDateRange(experiment.startDate, experiment.endDate)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <BarChart class="h-4 w-4" />
                  <span>{getDuration(experiment.startDate, experiment.endDate)} days</span>
                </div>
                {#if getExperimentStatus(experiment) === 'active'}
                  <div class="flex items-center gap-2">
                    <Clock class="h-4 w-4" />
                    <span>{getDaysRemaining(experiment)} days remaining</span>
                  </div>
                {:else if getExperimentStatus(experiment) === 'completed'}
                  <div class="text-success flex items-center gap-2">
                    <CheckCircle2 class="h-4 w-4" />
                    <span>Completed</span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <a href="/experiments/{experiment.id}/dashboard" class="btn btn-primary">
                <BarChart class="h-4 w-4" />
                Dashboard
              </a>
              <a href="/experiments/{experiment.id}/edit" class="btn btn-outline">
                <Edit3 class="h-4 w-4" />
                Edit
              </a>
              <button onclick={deleteExperiment} class="btn btn-error btn-outline" disabled={deleting}>
                {#if deleting}
                  <span class="loading loading-spinner loading-sm"></span>
                {:else}
                  <Trash2 class="h-4 w-4" />
                {/if}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Experiment Stats -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body text-center">
            <div class="text-primary text-3xl font-bold">{getDuration(experiment.startDate, experiment.endDate)}</div>
            <div class="text-base-content/60 text-sm">Total Days</div>
          </div>
        </div>

        {#if getExperimentStatus(experiment) === 'active'}
          <div class="card bg-base-100 border-base-300 border">
            <div class="card-body text-center">
              <div class="text-secondary text-3xl font-bold">{getDaysElapsed(experiment)}</div>
              <div class="text-base-content/60 text-sm">Days Completed</div>
            </div>
          </div>
        {/if}

        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body text-center">
            <div class="text-accent text-3xl font-bold">{experiment.tasks.length}</div>
            <div class="text-base-content/60 text-sm">Daily Tasks</div>
          </div>
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="card bg-base-100 border-base-300 border">
        <div class="card-body">
          <h2 class="text-base-content mb-6 flex items-center gap-2 text-2xl font-bold">
            <Target class="text-primary h-6 w-6" />
            Daily Tasks
          </h2>

          {#if experiment.tasks.length > 0}
            <div class="space-y-4">
              {#each experiment.tasks as task}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="py-8 text-center">
              <Target class="text-base-content/30 mx-auto mb-4 h-12 w-12" />
              <h3 class="text-base-content mb-2 text-lg font-medium">No tasks defined</h3>
              <p class="text-base-content/60 mb-4">Add some daily tasks to track during this experiment.</p>
              <a href="/experiments/{experiment.id}/edit" class="btn btn-primary"> Add Tasks </a>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Not found state -->
    <div class="py-12 text-center">
      <h2 class="text-base-content mb-2 text-2xl font-bold">Experiment Not Found</h2>
      <p class="text-base-content/60 mb-6">The experiment you're looking for doesn't exist or you don't have access to it.</p>
      <a href="/experiments" class="btn btn-primary"> Back to Experiments </a>
    </div>
  {/if}
</div>
