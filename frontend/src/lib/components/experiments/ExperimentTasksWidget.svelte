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
      const active = experiments.filter(exp => {
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
    <div class="flex items-center gap-2 mb-3">
      <Beaker class="h-5 w-5 text-purple-600" />
      <h3 class="text-lg font-semibold">Today's Experiments</h3>
    </div>
    <div class="animate-pulse">
      <div class="h-16 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
{:else if error}
  <div class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <Beaker class="h-5 w-5 text-purple-600" />
      <h3 class="text-lg font-semibold">Today's Experiments</h3>
    </div>
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800 text-sm">{error}</p>
      <button 
        onclick={loadExperimentTasks}
        class="mt-2 text-red-600 hover:text-red-700 underline text-sm"
      >
        Try again
      </button>
    </div>
  </div>
{:else if todaysTasks.length === 0}
  <!-- Show experiments prompt if there are no active experiment tasks -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Beaker class="h-5 w-5 text-purple-600" />
        <h3 class="text-lg font-semibold">Today's Experiments</h3>
      </div>
      <a 
        href="/experiments" 
        class="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
      >
        <BarChart class="h-4 w-4" />
        View All
      </a>
    </div>
    
    {#if activeExperiments.length === 0}
      <!-- No active experiments -->
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <Beaker class="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-purple-800 font-medium text-sm mb-1">No active experiments</p>
            <p class="text-purple-700 text-sm mb-3">
              Start an experiment to test life changes and track what makes you happier.
            </p>
            <a 
              href="/experiments/create" 
              class="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Plus class="h-4 w-4" />
              Create Experiment
            </a>
          </div>
        </div>
      </div>
    {:else}
      <!-- Active experiments but no tasks -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <Beaker class="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-blue-800 font-medium text-sm mb-1">
              {activeExperiments.length} active experiment{activeExperiments.length === 1 ? '' : 's'}, no tasks yet
            </p>
            <p class="text-blue-700 text-sm mb-3">
              Add daily tasks to your experiments to track progress and build habits.
            </p>
            <a 
              href="/experiments" 
              class="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <BarChart class="h-4 w-4" />
              Manage Experiments
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Show active experiment tasks -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Beaker class="h-5 w-5 text-purple-600" />
        <h3 class="text-lg font-semibold">Today's Experiments</h3>
        <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
          {todaysTasks.filter(t => !t.task.isCompleteToday).length} pending
        </span>
      </div>
      <a 
        href="/experiments" 
        class="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
      >
        <BarChart class="h-4 w-4" />
        View All
      </a>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg">
      <div class="divide-y divide-gray-100">
        {#each todaysTasks as { experiment, task }}
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-3">
              <!-- Completion Button -->
              <button
                onclick={() => completeTask(experiment.id, task.id)}
                disabled={task.isCompleteToday}
                class="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors disabled:cursor-not-allowed"
                title={task.isCompleteToday ? 'Completed for today' : 'Mark as complete'}
              >
                {#if task.isCompleteToday}
                  <CheckCircle class="h-6 w-6 text-green-600" />
                {:else}
                  <Circle class="h-6 w-6 text-gray-400 hover:text-purple-600" />
                {/if}
              </button>

              <!-- Task Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-medium text-gray-900 truncate" class:line-through={task.isCompleteToday}>
                    {task.description}
                  </p>
                  {#if task.xpReward > 0}
                    <span class="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                      <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      {task.xpReward} XP
                    </span>
                  {/if}
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-500">
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
                class="flex-shrink-0 p-2 text-gray-400 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="View experiment dashboard"
              >
                <BarChart class="h-4 w-4" />
              </a>
            </div>
          </div>
        {/each}
      </div>

      <!-- Footer with summary -->
      <div class="bg-gray-50 px-4 py-3 rounded-b-lg">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">
            {todaysTasks.filter(t => t.task.isCompleteToday).length} of {todaysTasks.length} tasks completed today
          </span>
          <a 
            href="/experiments" 
            class="text-purple-600 hover:text-purple-700 font-medium"
          >
            View all experiments →
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}