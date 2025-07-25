<script lang="ts">
  import { onMount } from 'svelte';
  import { generateTasksStore } from '$lib/stores/generate-tasks';
  import { simpleTodosStore } from '$lib/stores/todos';

  let currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  let generating = false;
  let includeIntent = true;

  // Reactive references to store state
  $: ({ lastGenerated, currentDateTasks, loading, error } = $generateTasksStore);

  onMount(() => {
    loadTodayTasks();
  });

  async function loadTodayTasks() {
    try {
      await generateTasksStore.getGeneratedTasksForDate(currentDate);
    } catch (err) {
      console.error("Failed to load today's generated tasks:", err);
    }
  }

  async function generateDailyTasks() {
    if (generating) return;

    generating = true;
    try {
      await generateTasksStore.generateTasks(currentDate, includeIntent);
      // Refresh the todos list to show the new generated tasks
      await simpleTodosStore.loadTodos();
      // Also refresh the tasks for this date
      await loadTodayTasks();
    } catch (err) {
      console.error('Failed to generate tasks:', err);
    } finally {
      generating = false;
    }
  }

  function formatTaskDescription(task: any): string {
    if (task.description?.includes(':')) {
      return task.description;
    }
    // For older format or API responses, construct the description
    return `${task.title || ''}: ${task.description || ''}`.replace(/^:\s*/, '');
  }
</script>

<div class="w-full">
  <div class="mb-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="text-secondary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M5.636 5.636l-.707-.707M12 21v-1m6.364-1.636l-.707-.707M5.636 18.364l.707-.707"
          />
          <circle cx="12" cy="12" r="5" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold">AI Daily Tasks</h3>
    </div>

    <button class="btn btn-secondary btn-sm transition-all duration-200 hover:scale-105" on:click={generateDailyTasks} disabled={generating}>
      {#if generating}
        <span class="loading loading-spinner loading-xs"></span>
        Generating...
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M5.636 5.636l-.707-.707M12 21v-1m6.364-1.636l-.707-.707M5.636 18.364l.707-.707"
          />
          <circle cx="12" cy="12" r="5" />
        </svg>
        Generate
      {/if}
    </button>
  </div>

  {#if loading && !currentDateTasks}
    <div class="flex justify-center py-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  {:else if error}
    <div class="alert alert-error mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6" />
        <path d="M12 16h.01" />
      </svg>
      <span class="text-sm">{error}</span>
    </div>
  {:else}
    <div class="space-y-4">
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-3">
          <input type="checkbox" class="checkbox checkbox-secondary" bind:checked={includeIntent} />
          <span class="label-text">Include today's intent in task generation</span>
        </label>
      </div>

      {#if currentDateTasks && currentDateTasks.tasks.length > 0}
        <div class="bg-base-200/50 rounded-lg p-4">
          <h4 class="mb-3 flex items-center gap-2 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 12l2 2 4-4" />
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
            Today's Generated Tasks
          </h4>

          <div class="space-y-2">
            {#each currentDateTasks.tasks as task (task.id)}
              <div class="bg-base-100 flex items-center gap-3 rounded p-3">
                <input type="checkbox" class="checkbox checkbox-accent" checked={task.isCompleted} disabled />
                <span class="flex-1 text-sm {task.isCompleted ? 'line-through opacity-60' : ''}">
                  {formatTaskDescription(task)}
                </span>
                <div class="badge badge-xs badge-outline">AI</div>
              </div>
            {/each}
          </div>

          {#if currentDateTasks.intent}
            <div class="border-base-300 mt-3 border-t pt-3">
              <p class="text-base-content/70 mb-1 text-xs">Today's Intent:</p>
              <p class="text-sm italic">"{currentDateTasks.intent.importanceStatement}"</p>
            </div>
          {/if}
        </div>
      {:else if lastGenerated}
        <div class="bg-secondary/10 rounded-lg p-4">
          <h4 class="text-secondary mb-3 font-medium">Latest Generated Tasks</h4>

          <div class="space-y-3">
            <div class="bg-base-100 rounded p-3">
              <div class="mb-1 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span class="text-sm font-medium">Personal Task</span>
              </div>
              <p class="text-sm"><strong>{lastGenerated.personalTask.title}</strong></p>
              <p class="text-base-content/70 mt-1 text-xs">{lastGenerated.personalTask.description}</p>
            </div>

            <div class="bg-base-100 rounded p-3">
              <div class="mb-1 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="m22 2-2 2" />
                  <path d="M22 22v-8a4 4 0 0 0-4-4h-1" />
                </svg>
                <span class="text-sm font-medium">Family Task</span>
              </div>
              <p class="text-sm"><strong>{lastGenerated.familyTask.title}</strong></p>
              <p class="text-base-content/70 mt-1 text-xs">{lastGenerated.familyTask.description}</p>
            </div>
          </div>

          <div class="text-base-content/60 mt-3 text-xs">
            Generated for {lastGenerated.metadata.date}
            {#if lastGenerated.metadata.includedIntent}
              • Including daily intent
            {/if}
          </div>
        </div>
      {:else}
        <div class="flex flex-col items-center py-8 text-center">
          <div class="text-secondary mb-3 opacity-60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M5.636 5.636l-.707-.707M12 21v-1m6.364-1.636l-.707-.707M5.636 18.364l.707-.707"
              />
              <circle cx="12" cy="12" r="5" />
            </svg>
          </div>
          <p class="text-base-content/60 mb-2 text-sm">No tasks generated for today yet</p>
          <p class="text-base-content/40 text-xs">Click "Generate" to create personalized daily tasks</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
