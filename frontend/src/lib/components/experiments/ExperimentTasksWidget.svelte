<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { experimentsApi, type ExperimentTaskWithCompletionsResponse, type ExperimentResponse } from '$lib/api/experiments';
  import { Beaker, CheckCircle, Circle, Plus, BarChart } from 'lucide-svelte';

  // State
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeExperiments: ExperimentResponse[] = $state([]);
  let todaysTasks: Array<{
    experiment: ExperimentResponse;
    task: ExperimentTaskWithCompletionsResponse;
  }> = $state([]);

  onMount(async () => {
    await loadExperimentTasks();
  });

  async function loadExperimentTasks() {
    try {
      loading = true;
      error = null;

      // Get all user experiments
      const experiments = await experimentsApi.getUserExperiments();

      // Filter for active experiments (experiments happening today)
      const today = new Date().toISOString().split('T')[0];
      const active = experiments.filter((exp) => {
        return exp.startDate <= today && exp.endDate >= today;
      });

      activeExperiments = active;

      // Get tasks for active experiments
      const allTasks: Array<{
        experiment: ExperimentResponse;
        task: ExperimentTaskWithCompletionsResponse;
      }> = [];

      for (const experiment of active) {
        try {
          const tasks = await experimentsApi.getExperimentTasks(experiment.id);
          for (const task of tasks) {
            allTasks.push({ experiment, task });
          }
        } catch (err) {
          console.error(`Failed to load tasks for experiment ${experiment.id}:`, err);
        }
      }

      todaysTasks = allTasks;
    } catch (err) {
      console.error('Failed to load experiment tasks:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load experiment tasks';
    } finally {
      loading = false;
    }
  }

  async function completeTask(experimentId: string, taskId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      await experimentsApi.completeExperimentTask(experimentId, taskId, {
        completedDate: today,
      });

      // Reload tasks to update completion status
      await loadExperimentTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
      error = err instanceof Error ? err.message : 'Failed to complete task';

      // Clear error after a few seconds
      setTimeout(() => {
        error = null;
      }, 3000);
    }
  }

  function getTaskStatus(task: ExperimentTaskWithCompletionsResponse): 'completed' | 'available' {
    return task.isCompleteToday ? 'completed' : 'available';
  }
</script>

{#if loading}
  <div class="mb-6">
    <div class="mb-3 flex items-center gap-2">
      <Beaker class="text-secondary h-5 w-5" />
      <h3 class="text-base-content text-lg font-semibold">Today's Experiments</h3>
    </div>
    <div class="animate-pulse">
      <div class="bg-base-200 h-16 rounded-lg"></div>
    </div>
  </div>
{:else if error}
  <div class="mb-6">
    <div class="mb-3 flex items-center gap-2">
      <Beaker class="text-secondary h-5 w-5" />
      <h3 class="text-base-content text-lg font-semibold">Today's Experiments</h3>
    </div>
    <div class="border-error bg-error/10 rounded-lg border p-4">
      <p class="text-error text-sm">{error}</p>
      <button onclick={loadExperimentTasks} class="text-error hover:text-error/80 mt-2 text-sm underline"> Try again </button>
    </div>
  </div>
{:else if todaysTasks.length === 0}
  <!-- Show experiments prompt if there are no active experiment tasks -->
  <div class="mb-6">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Beaker class="text-secondary h-5 w-5" />
        <h3 class="text-base-content text-lg font-semibold">Today's Experiments</h3>
      </div>
      <a href="/experiments" class="text-secondary hover:text-secondary/80 flex items-center gap-1 text-sm font-medium">
        <BarChart class="h-4 w-4" />
        View All
      </a>
    </div>

    {#if activeExperiments.length === 0}
      <!-- No active experiments -->
      <div class="card from-secondary/10 to-accent/10 border-secondary/20 border bg-gradient-to-br">
        <div class="card-body p-4">
          <div class="flex items-start gap-3">
            <Beaker class="text-secondary mt-0.5 h-6 w-6 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-base-content mb-1 text-sm font-medium">No active experiments</p>
              <p class="text-base-content/70 mb-3 text-sm">Start an experiment to test life changes and track what makes you happier.</p>
              <a href="/experiments/create" class="btn btn-secondary btn-sm gap-1">
                <Plus class="h-4 w-4" />
                Create Experiment
              </a>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Active experiments but no tasks -->
      <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
        <div class="card-body p-4">
          <div class="flex items-start gap-3">
            <Beaker class="text-primary mt-0.5 h-6 w-6 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-base-content mb-1 text-sm font-medium">
                {activeExperiments.length} active experiment{activeExperiments.length === 1 ? '' : 's'}, no tasks yet
              </p>
              <p class="text-base-content/70 mb-3 text-sm">Add daily tasks to your experiments to track progress and build habits.</p>
              <a href="/experiments" class="btn btn-primary btn-sm gap-1">
                <BarChart class="h-4 w-4" />
                Manage Experiments
              </a>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Show active experiment tasks -->
  <div class="mb-6">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Beaker class="text-secondary h-5 w-5" />
        <h3 class="text-base-content text-lg font-semibold">Today's Experiments</h3>
        <span class="badge badge-secondary badge-sm">
          {todaysTasks.filter((t) => !t.task.isCompleteToday).length} pending
        </span>
      </div>
      <a href="/experiments" class="text-secondary hover:text-secondary/80 flex items-center gap-1 text-sm font-medium">
        <BarChart class="h-4 w-4" />
        View All
      </a>
    </div>

    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="divide-base-300 divide-y">
        {#each todaysTasks as { experiment, task }}
          <div class="hover:bg-base-200 p-4 transition-colors">
            <div class="flex items-center gap-3">
              <!-- Completion Button -->
              <button
                onclick={() => completeTask(experiment.id, task.id)}
                disabled={task.isCompleteToday}
                class="btn btn-ghost btn-sm btn-circle transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed"
                title={task.isCompleteToday ? 'Completed for today' : 'Mark as complete'}
              >
                {#if task.isCompleteToday}
                  <CheckCircle class="text-success h-6 w-6" />
                {:else}
                  <Circle class="text-base-content/40 hover:text-secondary h-6 w-6" />
                {/if}
              </button>

              <!-- Task Details -->
              <div class="min-w-0 flex-1">
                <div class="mb-1 flex items-center gap-2">
                  <p class="text-base-content truncate font-medium" class:line-through={task.isCompleteToday}>
                    {task.description}
                  </p>
                  {#if task.xpReward && task.xpReward > 0}
                    <span class="badge badge-warning badge-sm gap-1">
                      <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                      {task.xpReward} XP
                    </span>
                  {/if}
                </div>
                <div class="text-base-content/60 flex items-center gap-4 text-sm">
                  <span class="flex items-center gap-1">
                    <Beaker class="h-3 w-3" />
                    {experiment.title}
                  </span>
                  <span>{task.completionCount} / {task.successMetric} completed</span>
                </div>
              </div>

              <!-- Dashboard Link -->
              <a
                href="/experiments/{experiment.id}/dashboard"
                class="btn btn-ghost btn-sm btn-circle transition-all duration-200 hover:scale-105"
                title="View experiment dashboard"
              >
                <BarChart class="h-4 w-4" />
              </a>
            </div>
          </div>
        {/each}
      </div>

      <!-- Footer with summary -->
      <div class="bg-base-200 rounded-b-lg px-4 py-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-base-content/60">
            {todaysTasks.filter((t) => t.task.isCompleteToday).length} of {todaysTasks.length} tasks completed today
          </span>
          <a href="/experiments" class="text-secondary hover:text-secondary/80 font-medium"> View all experiments → </a>
        </div>
      </div>
    </div>
  </div>
{/if}
