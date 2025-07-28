<script lang="ts">
  import { onMount } from 'svelte';
  import { generateTasksStore } from '$lib/stores/generate-tasks';
  import { simpleTodosStore } from '$lib/stores/todos';
  import { getTodayDateString } from '$lib/utils/date';
  import DailyIntentModal from '$lib/components/daily-intents/DailyIntentModal.svelte';
  // Export the showTitle prop with default value of true

  let currentDate = getTodayDateString();
  let generating = false;
  let showIntentModal = false;

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

  function handleGenerateClick() {
    // Always show the modal first to get/confirm daily intent
    showIntentModal = true;
  }

  async function handleIntentConfirmed(intentText: string) {
    showIntentModal = false;

    if (generating) return;

    generating = true;
    try {
      // Always include intent (true) since we just captured it in the modal
      await generateTasksStore.generateTasks(currentDate, true);
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

  function handleIntentCancelled() {
    showIntentModal = false;
  }

  function formatTaskDescription(task: any): string {
    if (task.description?.includes(':')) {
      return task.description;
    }
    // For older format or API responses, construct the description
    return `${task.title || ''}: ${task.description || ''}`.replace(/^:\s*/, '');
  }
</script>


<div class="w-full flex flex-col items-end text-right">
  <div class="mb-4 flex items-center justify-end w-full">
    <button class="btn btn-secondary btn-sm transition-all duration-200 hover:scale-105" on:click={handleGenerateClick} disabled={generating}>
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
    <div class="flex justify-end py-4 w-full">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  {:else if error}
    <div class="alert alert-error mb-4 w-full flex justify-end">
      <div class="flex items-center gap-2">
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
    </div>
  {:else}
    <div class="text-xs text-gray-500 w-full text-right">Create personalized tasks based on your habits and goals</div>
  {/if}
</div>

<DailyIntentModal isOpen={showIntentModal} onConfirm={handleIntentConfirmed} onCancel={handleIntentCancelled} />
