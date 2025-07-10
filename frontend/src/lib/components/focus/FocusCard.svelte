<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getDayName, type Focus } from '$lib/api/focus';

  export let focus: Focus;
  export let isActive = false; // Whether this is today's focus
  export let showActions = true;

  const dispatch = createEventDispatcher<{
    edit: { focus: Focus };
    delete: { focus: Focus };
  }>();

  function handleEdit() {
    dispatch('edit', { focus });
  }

  function handleDelete() {
    dispatch('delete', { focus });
  }

  $: dayName = getDayName(focus.dayOfWeek);
</script>

<div class="card bg-base-100 border-base-300 border p-5 shadow-xl transition-all duration-200 hover:shadow-2xl {isActive ? 'border-l-primary border-l-4' : ''}">
  <div class="flex items-start justify-between">
    <div>
      <div class="flex items-center gap-2">
        <h3 class="text-base-content text-lg font-semibold">
          {focus.title}
        </h3>
        {#if isActive}
          <span class="badge badge-primary badge-sm"> Today </span>
        {/if}
      </div>
      <p class="text-base-content/60 mt-1 text-sm">
        {dayName}
      </p>
    </div>

    {#if showActions}
      <div class="flex space-x-2">
        <button on:click={handleEdit} class="btn btn-ghost btn-sm btn-square" aria-label="Edit focus">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button on:click={handleDelete} class="btn btn-ghost btn-sm btn-square text-error hover:bg-error hover:text-error-content" aria-label="Delete focus">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <p class="text-base-content/80 mt-2">
    {focus.description}
  </p>
</div>
