<script lang="ts">
  import { onMount } from 'svelte';
  import { simpleTodosStore } from '$lib/stores/todos';

  // Export the showTitle prop with default value of true
  export let showTitle: boolean = true;

  let newTodoDescription = '';
  let addingTodo = false;

  // Reactive references to store state
  $: ({ todos, loading, error } = $simpleTodosStore);
  $: incompleteTodos = todos.filter((todo) => !todo.isCompleted);
  $: completedTodos = todos.filter((todo) => todo.isCompleted);

  onMount(() => {
    simpleTodosStore.loadTodos();
  });

  async function addTodo() {
    if (!newTodoDescription.trim() || addingTodo) return;

    addingTodo = true;
    try {
      await simpleTodosStore.createTodo(newTodoDescription.trim());
      newTodoDescription = '';
    } catch (err) {
      console.error('Failed to add todo:', err);
    } finally {
      addingTodo = false;
    }
  }

  async function toggleTodo(todoId: string, isCompleted: boolean) {
    try {
      await simpleTodosStore.completeTodo(todoId, isCompleted);
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  }

  async function deleteTodo(todoId: string) {
    try {
      await simpleTodosStore.deleteTodo(todoId);
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      addTodo();
    }
  }
</script>

<div class="w-full">
  {#if showTitle}
  <div class="mb-6 flex items-center gap-3">
    <div class="text-accent">
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
        <path d="M9 12l2 2 4-4" />
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      </svg>
    </div>
    <h3 class="text-xl font-semibold">Quick Tasks</h3>
  </div>
  {/if}

  <!-- Add new todo form -->
  <div class="mb-4">
    <div class="flex gap-2">
      <input
        type="text"
        placeholder="Add a quick task..."
        class="input input-bordered focus:input-accent flex-1 transition-all duration-200"
        bind:value={newTodoDescription}
        on:keypress={handleKeyPress}
        disabled={addingTodo}
        maxlength="200"
      />
      <button
        class="btn btn-accent btn-square transition-all duration-200 hover:scale-105"
        on:click={addTodo}
        disabled={addingTodo || !newTodoDescription.trim()}
      >
        {#if addingTodo}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Loading state -->
  {#if loading && todos.length === 0}
    <div class="flex justify-center py-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  {:else if error}
    <!-- Error state -->
    <div class="alert alert-error">
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
    <!-- Todos list -->
    <div class="space-y-3">
      <!-- Incomplete todos -->
      {#each incompleteTodos as todo (todo.id)}
        <div class="bg-base-200/50 hover:bg-base-200 flex items-center gap-3 rounded-lg p-3 transition-all duration-200">
          <input type="checkbox" class="checkbox checkbox-accent" checked={false} on:change={() => toggleTodo(todo.id, true)} />
          <span class="flex-1 text-sm">{todo.description}</span>
          <button
            class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content transition-all duration-200"
            on:click={() => deleteTodo(todo.id)}
            aria-label="Delete task"
            title="Delete task"
          >
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      {/each}

      <!-- Completed todos (show last 3) -->
      {#if completedTodos.length > 0}
        <div class="divider text-xs opacity-60">Recently Completed</div>
        {#each completedTodos.slice(-3) as todo (todo.id)}
          <div class="bg-base-200/30 flex items-center gap-3 rounded-lg p-3 opacity-60 transition-all duration-200">
            <input type="checkbox" class="checkbox checkbox-accent" checked={true} on:change={() => toggleTodo(todo.id, false)} />
            <span class="flex-1 text-sm line-through">{todo.description}</span>
            <button
              class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content transition-all duration-200"
              on:click={() => deleteTodo(todo.id)}
              aria-label="Delete task"
              title="Delete task"
            >
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        {/each}
      {/if}

      <!-- Empty state -->
      {#if incompleteTodos.length === 0 && completedTodos.length === 0}
        <div class="flex flex-col items-center py-8 text-center">
          <div class="text-accent mb-3 opacity-60">
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
              <path d="M9 12l2 2 4-4" />
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          </div>
          <p class="text-base-content/60 text-sm">No tasks yet. Add one above to get started!</p>
        </div>
      {:else if incompleteTodos.length === 0}
        <div class="flex flex-col items-center py-6 text-center">
          <div class="text-accent mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m9 12 2 2 4-4" />
              <path
                d="M21 12c.552 0 1.448-.063 1.448-.63 0-.567-.896-.63-1.448-.63-2.9 0-9.552 0-18 0-.552 0-1.448.063-1.448.63 0 .567.896.63 1.448.63 8.448 0 15.1 0 18 0Z"
              />
            </svg>
          </div>
          <p class="text-accent text-sm font-medium">All caught up! 🎉</p>
          <p class="text-base-content/60 mt-1 text-xs">Great job completing all your tasks</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
