<script lang="ts">
  import { onMount } from 'svelte';
  import { focusesStore, loadAllFocuses } from '$lib/stores/focus';
  import { createOrUpdateFocus, deleteFocus, getDayName, type Focus } from '$lib/api/focus';
  import FocusCard from '$lib/components/focus/FocusCard.svelte';
  import FocusEditor from '$lib/components/focus/FocusEditor.svelte';

  let isLoading = true;
  let error = '';
  let editingDayOfWeek: number | null = null;
  let editingFocus: Focus | null = null;
  let confirmingDelete: number | null = null;

  // Static values don't need reactive declarations
  const allDays = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday, 6 = Saturday
  const today = new Date().getDay();

  onMount(async () => {
    try {
      await loadAllFocuses();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load focuses';
    } finally {
      isLoading = false;
    }
  });

  function handleAddFocus(dayOfWeek: number) {
    editingDayOfWeek = dayOfWeek;
    editingFocus = null;
  }

  function handleEditFocus(event: CustomEvent<{ focus: Focus }>) {
    editingDayOfWeek = event.detail.focus.dayOfWeek;
    editingFocus = event.detail.focus;
  }

  function handleCancelEdit() {
    editingDayOfWeek = null;
    editingFocus = null;
  }

  function handleConfirmDelete(dayOfWeek: number) {
    confirmingDelete = dayOfWeek;
  }

  function handleCancelDelete() {
    confirmingDelete = null;
  }

  async function handleDeleteFocus(dayOfWeek: number) {
    try {
      await deleteFocus(dayOfWeek);
      // Remove this focus from the store
      focusesStore.update((focuses) => focuses.filter((f) => f.dayOfWeek !== dayOfWeek));
      confirmingDelete = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete focus';
    }
  }

  async function handleSaveFocus(focus: Focus) {
    // Add the new focus to the store
    focusesStore.update((focuses) => {
      const existingIndex = focuses.findIndex((f) => f.dayOfWeek === focus.dayOfWeek);
      if (existingIndex >= 0) {
        // Replace existing focus
        return [...focuses.slice(0, existingIndex), focus, ...focuses.slice(existingIndex + 1)];
      } else {
        // Add new focus
        return [...focuses, focus];
      }
    });

    editingDayOfWeek = null;
    editingFocus = null;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-base-content text-xl font-bold">Weekly Schedule</h2>
  </div>

  {#if error}
    <div class="alert alert-error">
      <p>{error}</p>
      <button
        class="btn btn-sm btn-ghost"
        on:click={() => {
          error = '';
          loadAllFocuses();
        }}
      >
        Try Again
      </button>
    </div>
  {/if}

  {#if isLoading}
    <div class="py-10 text-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-base-content/60 mt-2">Loading focuses...</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each allDays as dayOfWeek (dayOfWeek)}
        {#if editingDayOfWeek === dayOfWeek}
          <FocusEditor {dayOfWeek} focus={editingFocus} onSave={handleSaveFocus} onCancel={handleCancelEdit} />
        {:else if confirmingDelete === dayOfWeek}
          <div class="card bg-base-100 border-base-300 border p-5 shadow-xl">
            <h3 class="card-title text-error">Confirm Delete</h3>
            <p class="text-base-content/80 my-3">
              Are you sure you want to delete the focus for {getDayName(dayOfWeek)}?
            </p>
            <div class="mt-2 flex justify-end gap-3">
              <button on:click={handleCancelDelete} class="btn btn-outline"> Cancel </button>
              <button on:click={() => handleDeleteFocus(dayOfWeek)} class="btn btn-error"> Delete </button>
            </div>
          </div>
        {:else}
          {@const focus = $focusesStore.find((f) => f.dayOfWeek === dayOfWeek)}
          {#if focus}
            <FocusCard {focus} isActive={dayOfWeek === today} on:edit={handleEditFocus} on:delete={() => handleConfirmDelete(dayOfWeek)} />
          {:else}
            <div
              class="card bg-base-100 border-base-300 hover:bg-base-200 flex h-48 cursor-pointer flex-col items-center justify-center border border-dashed p-5 text-center transition-colors"
              on:click={() => handleAddFocus(dayOfWeek)}
              on:keydown={(e) => e.key === 'Enter' && handleAddFocus(dayOfWeek)}
              tabindex="0"
              role="button"
              aria-label="Add focus for {getDayName(dayOfWeek)}"
            >
              <div class="avatar placeholder mb-2">
                <div class="bg-base-300 text-base-content h-10 w-10 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <p class="text-base-content/80 font-medium">{getDayName(dayOfWeek)}</p>
              <p class="text-base-content/60 mt-1 text-sm">Add a daily focus</p>
            </div>
          {/if}
        {/if}
      {/each}
    </div>
  {/if}
</div>
