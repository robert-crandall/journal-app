<script lang="ts">
  import { onMount } from 'svelte';
  import { createOrUpdateFocus, getDayName, type Focus } from '$lib/api/focus';

  export let dayOfWeek: number;
  export let focus: Focus | null = null;
  export let onSave: (focus: Focus) => void = () => {};
  export let onCancel: () => void = () => {};

  let title = focus?.title || '';
  let description = focus?.description || '';
  let isSubmitting = false;
  let error = '';

  // Since dayOfWeek is a prop, it's better to make dayName reactive
  // to respond to potential prop changes
  $: dayName = getDayName(dayOfWeek);

  async function handleSubmit() {
    if (!title.trim()) {
      error = 'Title is required';
      return;
    }

    if (!description.trim()) {
      error = 'Description is required';
      return;
    }

    error = '';
    isSubmitting = true;

    try {
      const focusData = {
        dayOfWeek,
        title: title.trim(),
        description: description.trim(),
      };

      const savedFocus = await createOrUpdateFocus(focusData);
      onSave(savedFocus);
    } catch (err) {
      console.error('Failed to save focus:', err);
      error = err instanceof Error ? err.message : 'Failed to save focus';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="card bg-base-100 border-base-300 border p-6 shadow-xl">
  <h2 class="card-title mb-4">
    {focus ? 'Edit' : 'Create'} Focus for {dayName}
  </h2>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if error}
      <div class="alert alert-error">
        {error}
      </div>
    {/if}

    <div class="form-control w-full">
      <label for="title" class="label">
        <span class="label-text">Title</span>
      </label>
      <input id="title" type="text" bind:value={title} placeholder="e.g., Call to Adventure" class="input input-bordered w-full" required />
    </div>

    <div class="form-control w-full">
      <label for="description" class="label">
        <span class="label-text">Description</span>
      </label>
      <textarea
        id="description"
        bind:value={description}
        placeholder="e.g., Saturdays are for doing something bold or memorable"
        rows="3"
        class="textarea textarea-bordered w-full"
        required
      ></textarea>
    </div>

    <div class="mt-4 flex justify-end space-x-3">
      <button type="button" on:click={onCancel} class="btn btn-outline"> Cancel </button>

      <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </div>
  </form>
</div>
