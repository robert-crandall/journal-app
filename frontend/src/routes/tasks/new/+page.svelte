<script lang="ts">
  import { ArrowLeft, Save } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { taskStore } from '$lib/stores/tasks';
  import type { CreateTaskInput } from '$lib/api/client';
  
  let loading = $state(false);
  let error = $state('');
  
  // Form fields
  let title = $state('');
  let description = $state('');
  let dueDate = $state('');
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!title.trim()) {
      error = 'Title is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const taskData: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined
      };
      
      await taskStore.create(taskData);
      goto('/tasks');
    } catch (err) {
      error = 'Failed to create task';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  function handleCancel() {
    goto('/tasks');
  }
</script>

<svelte:head>
  <title>New Task - Journal App</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="flex items-center gap-4 mb-6">
    <button 
      class="btn btn-ghost btn-sm"
      onclick={handleCancel}
      aria-label="Go back to tasks"
    >
      <ArrowLeft size={20} />
    </button>
    <h1 class="text-3xl font-bold">New Task</h1>
  </div>
  
  {#if error}
    <div class="alert alert-error mb-6">
      <span>{error}</span>
    </div>
  {/if}
  
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <form onsubmit={handleSubmit}>
        <!-- Title -->
        <div class="form-control mb-4">
          <label class="label" for="title">
            <span class="label-text">Title *</span>
          </label>
          <input 
            id="title"
            type="text"
            class="input input-bordered w-full"
            bind:value={title}
            placeholder="Enter task title"
            required
            disabled={loading}
          />
        </div>
        
        <!-- Description -->
        <div class="form-control mb-4">
          <label class="label" for="description">
            <span class="label-text">Description</span>
          </label>
          <textarea 
            id="description"
            class="textarea textarea-bordered w-full"
            bind:value={description}
            placeholder="Enter task description (optional)"
            rows="4"
            disabled={loading}
          ></textarea>
        </div>
        
        <!-- Due Date -->
        <div class="form-control mb-6">
          <label class="label" for="dueDate">
            <span class="label-text">Due Date</span>
          </label>
          <input 
            id="dueDate"
            type="date"
            class="input input-bordered w-full"
            bind:value={dueDate}
            disabled={loading}
          />
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button 
            type="button"
            class="btn btn-ghost"
            onclick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
            disabled={loading || !title.trim()}
          >
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <Save size={16} />
            {/if}
            Create Task
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
