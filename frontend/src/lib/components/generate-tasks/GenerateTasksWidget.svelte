<script lang="ts">
  import { onMount } from 'svelte';
  import { generateTasksStore } from '$lib/stores/generate-tasks';
  import { simpleTodosStore } from '$lib/stores/todos';
  import { getTodayDateString } from '$lib/utils/date';

  let currentDate = getTodayDateString();
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
    </div>
  {/if}
</div>
