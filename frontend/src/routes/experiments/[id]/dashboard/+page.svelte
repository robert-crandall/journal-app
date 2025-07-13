<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { experimentsApi } from '$lib/api/experiments';
  import type { ExperimentDashboardResponse } from '$lib/api/experiments';
  import { ArrowLeft, Calendar, BarChart, Target, Award, TrendingUp, CheckCircle2, Clock, Book, Star } from 'lucide-svelte';
  import { marked } from 'marked';

  // Reactive state
  let dashboard: ExperimentDashboardResponse | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Get experiment ID from URL
  let experimentId = $derived($page.params.id);

  // Load data on component mount
  onMount(async () => {
    await loadDashboard();
  });

  async function loadDashboard() {
    try {
      loading = true;
      error = null;

      dashboard = await experimentsApi.getExperimentDashboard(experimentId);
    } catch (err) {
      console.error('Failed to load experiment dashboard:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load experiment dashboard';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getExperimentStatus(exp: ExperimentDashboardResponse['experiment']): 'upcoming' | 'active' | 'completed' {
    const today = new Date().toLocaleDateString('en-CA');
    const startDate = exp.startDate;
    const endDate = exp.endDate;

    if (today < startDate) return 'upcoming';
    if (today > endDate) return 'completed';
    return 'active';
  }

  function getExperimentStatusColor(status: 'upcoming' | 'active' | 'completed'): string {
    switch (status) {
      case 'upcoming':
        return 'badge-primary';
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

  function formatDate(dateString: string): string {
    // Use the proper date formatting utility
    // Parse the date components manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);

    // Create date in local timezone without any UTC conversion
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString();
  }

  function getProgressPercentage(current: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  }

  function getTaskCompletionRate(task: ExperimentDashboardResponse['tasks'][0]): number {
    if (!dashboard) return 0;
    const totalPossible = dashboard.stats.totalDays;
    return totalPossible > 0 ? Math.round((task.completionCount / totalPossible) * 100) : 0;
  }
</script>

<svelte:head>
  <title>{dashboard ? `${dashboard.experiment.title} Dashboard` : 'Experiment Dashboard'} - Journal App</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <!-- Navigation -->
  <div class="mb-6">
    <a href="/experiments/{experimentId}" class="text-base-content/60 hover:text-base-content inline-flex items-center gap-2 transition-colors">
      <ArrowLeft class="h-4 w-4" />
      Back to Experiment
    </a>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="alert alert-error">
      <h3 class="mb-2 text-lg font-semibold">Error Loading Dashboard</h3>
      <p class="mb-4">{error}</p>
      <button onclick={loadDashboard} class="btn btn-outline btn-error"> Try Again </button>
    </div>
  {:else if dashboard}
    <!-- Dashboard Content -->
    <div class="space-y-8">
      <!-- Header -->
      <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-3">
                <h1 class="text-base-content text-3xl font-bold">{dashboard.experiment.title}</h1>
                <span class="badge {getExperimentStatusColor(getExperimentStatus(dashboard.experiment))} badge-lg">
                  {getExperimentStatus(dashboard.experiment)}
                </span>
              </div>

              {#if dashboard.experiment.description}
                <p class="text-base-content/70 prose prose-sm mb-4 text-lg">{@html marked.parse(dashboard.experiment.description)}</p>
              {/if}

              <div class="text-base-content/60 flex flex-wrap items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <Calendar class="h-4 w-4" />
                  <span>{formatDateRange(dashboard.experiment.startDate, dashboard.experiment.endDate)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <BarChart class="h-4 w-4" />
                  <span>{dashboard.stats.totalDays} days</span>
                </div>
                <div class="flex items-center gap-2">
                  <TrendingUp class="h-4 w-4" />
                  <span>{dashboard.stats.completionPercentage}% complete</span>
                </div>
              </div>
            </div>

            <!-- Progress Circle -->
            <div class="flex-shrink-0">
              <div class="radial-progress text-primary" style="--value:{dashboard.stats.completionPercentage};" role="progressbar">
                {dashboard.stats.completionPercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Stats Grid -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body text-center">
            <div class="text-primary text-3xl font-bold">{dashboard.stats.daysCompleted}</div>
            <div class="text-base-content/60 text-sm">Days Completed</div>
            <div class="text-base-content/40 text-xs">out of {dashboard.stats.totalDays}</div>
          </div>
        </div>

        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body text-center">
            <div class="text-secondary text-3xl font-bold">{dashboard.stats.tasksCompleted}</div>
            <div class="text-base-content/60 text-sm">Tasks Completed</div>
            <div class="text-base-content/40 text-xs">out of {dashboard.stats.totalTaskInstances}</div>
          </div>
        </div>

        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body text-center">
            <div class="text-accent text-3xl font-bold">{dashboard.stats.totalXpEarned}</div>
            <div class="text-base-content/60 text-sm">Total XP Earned</div>
            <div class="text-base-content/40 text-xs">{dashboard.xpBreakdown.fromTasks} from tasks, {dashboard.xpBreakdown.fromJournals} from journals</div>
          </div>
        </div>

        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body text-center">
            <div class="text-warning text-3xl font-bold">{dashboard.journalEntries.length}</div>
            <div class="text-base-content/60 text-sm">Journal Entries</div>
            <div class="text-base-content/40 text-xs">during experiment</div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Tasks Progress -->
        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body">
            <h2 class="text-base-content mb-6 flex items-center gap-2 text-2xl font-bold">
              <Target class="text-primary h-6 w-6" />
              Task Progress
            </h2>

            {#if dashboard.tasks.length > 0}
              <div class="space-y-6">
                {#each dashboard.tasks as task}
                  <div class="space-y-3">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h3 class="text-base-content font-semibold">{task.description}</h3>
                        <div class="text-base-content/60 mt-1 flex items-center gap-4 text-sm">
                          <div class="flex items-center gap-1">
                            <CheckCircle2 class="h-4 w-4" />
                            <span>{task.completionCount} completions</span>
                          </div>
                          {#if task.xpReward && task.xpReward > 0}
                            <div class="flex items-center gap-1">
                              <Award class="h-4 w-4" />
                              <span>{task.completionCount * task.xpReward} XP earned</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-primary text-lg font-bold">{getTaskCompletionRate(task)}%</div>
                        <div class="text-base-content/40 text-xs">completion rate</div>
                      </div>
                    </div>
                    <!-- Progress Bar -->
                    <div class="bg-base-300 h-2 w-full rounded-full">
                      <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: {getTaskCompletionRate(task)}%"></div>
                    </div>

                    <!-- Recent Completions -->
                    {#if task.completions.length > 0}
                      <div class="text-base-content/40 text-xs">
                        <span>Recent: </span>
                        {#each task.completions.slice(0, 5) as completion, i}
                          <span class="inline-block">
                            {formatDate(completion.completedDate)}{i < task.completions.slice(0, 5).length - 1 ? ', ' : ''}
                          </span>
                        {/each}
                        {#if task.completions.length > 5}
                          <span>and {task.completions.length - 5} more...</span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <div class="py-8 text-center">
                <Target class="text-base-content/30 mx-auto mb-4 h-12 w-12" />
                <h3 class="text-base-content mb-2 text-lg font-medium">No tasks defined</h3>
                <p class="text-base-content/60">Add some daily tasks to track progress.</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Journal Entries -->
        <div class="card bg-base-100 border-base-300 border">
          <div class="card-body">
            <h2 class="text-base-content mb-6 flex items-center gap-2 text-2xl font-bold">
              <Book class="text-secondary h-6 w-6" />
              Journal Entries
            </h2>

            {#if dashboard.journalEntries.length > 0}
              <div class="space-y-4">
                {#each dashboard.journalEntries as entry}
                  <div class="card bg-base-200 border-base-300 border">
                    <div class="card-body p-4">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h3 class="text-base-content mb-1 font-semibold">{entry.title}</h3>
                          {#if entry.synopsis}
                            <p class="text-base-content/60 mb-2 line-clamp-2 text-sm">{entry.synopsis}</p>
                          {/if}
                          <div class="text-base-content/40 text-xs">
                            {formatDate(entry.createdAt)}
                          </div>
                        </div>
                        <a href="/journal/{entry.id}" class="btn btn-ghost btn-sm" title="View entry"> View </a>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              {#if dashboard.journalEntries.length > 5}
                <div class="mt-4 text-center">
                  <a href="/journal" class="btn btn-outline btn-sm"> View All Journal Entries </a>
                </div>
              {/if}
            {:else}
              <div class="py-8 text-center">
                <Book class="text-base-content/30 mx-auto mb-4 h-12 w-12" />
                <h3 class="text-base-content mb-2 text-lg font-medium">No journal entries</h3>
                <p class="text-base-content/60 mb-4">Write about your experiment experience to track insights and progress.</p>
                <a href="/journal/longform" class="btn btn-secondary btn-sm">
                  <Book class="h-4 w-4" />
                  Start Journaling
                </a>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- XP Breakdown -->
      <div class="card bg-base-100 border-base-300 border">
        <div class="card-body">
          <h2 class="text-base-content mb-6 flex items-center gap-2 text-2xl font-bold">
            <Star class="text-warning h-6 w-6" />
            XP Breakdown
          </h2>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="text-center">
              <div class="text-primary mb-2 text-3xl font-bold">{dashboard.xpBreakdown.fromTasks}</div>
              <div class="text-base-content/60 mb-1 text-sm">From Tasks</div>
              <div class="text-base-content/40 text-xs">
                {getProgressPercentage(dashboard.xpBreakdown.fromTasks, dashboard.xpBreakdown.total)}% of total
              </div>
            </div>

            <div class="text-center">
              <div class="text-secondary mb-2 text-3xl font-bold">{dashboard.xpBreakdown.fromJournals}</div>
              <div class="text-base-content/60 mb-1 text-sm">From Journals</div>
              <div class="text-base-content/40 text-xs">
                {getProgressPercentage(dashboard.xpBreakdown.fromJournals, dashboard.xpBreakdown.total)}% of total
              </div>
            </div>

            <div class="text-center">
              <div class="text-accent mb-2 text-3xl font-bold">{dashboard.xpBreakdown.total}</div>
              <div class="text-base-content/60 mb-1 text-sm">Total XP</div>
              <div class="text-base-content/40 text-xs">Overall experiment earnings</div>
            </div>
          </div>

          <!-- Visual XP Breakdown -->
          {#if dashboard.xpBreakdown.total > 0}
            <div class="mt-6">
              <div class="flex h-4 overflow-hidden rounded-lg">
                <div class="bg-primary" style="width: {getProgressPercentage(dashboard.xpBreakdown.fromTasks, dashboard.xpBreakdown.total)}%"></div>
                <div class="bg-secondary" style="width: {getProgressPercentage(dashboard.xpBreakdown.fromJournals, dashboard.xpBreakdown.total)}%"></div>
              </div>
              <div class="text-base-content/40 mt-2 flex justify-between text-xs">
                <span>Tasks</span>
                <span>Journals</span>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Not found state -->
    <div class="py-12 text-center">
      <h2 class="text-base-content mb-2 text-2xl font-bold">Experiment Not Found</h2>
      <p class="text-base-content/60 mb-6">The experiment dashboard you're looking for doesn't exist or you don't have access to it.</p>
      <a href="/experiments" class="btn btn-primary"> Back to Experiments </a>
    </div>
  {/if}
</div>
