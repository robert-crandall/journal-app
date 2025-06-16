<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeft, Save, Trash2 } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { taskStore } from '$lib/stores/tasks';
  import { journalApi } from '$lib/api/client';
  import type { Task, CreateTaskInput, UpdateTaskInput } from '$lib/api/client';
  
  let isEdit = $derived($page.params.id !== undefined);
  let taskId = $derived($page.params.id);
  
  let loading = $state(false);
  let error = $state('');
  let task: Task | null = $state(null);
  
  // Form fields
  let title = $state('');
  let description = $state('');
  let isCompleted = $state(false);
  let dueDate = $state('');
  
  onMount(async () => {
    if (isEdit && taskId) {
      loading = true;
      try {
        const response = await journalApi.getTask(taskId);
        if (response.success && response.data) {
          task = response.data;
          title = task.title;
          description = task.description || '';
          isCompleted = task.isCompleted;
          dueDate = task.dueDate || '';
        } else {
          error = response.error || 'Task not found';
        }
      } catch (err) {
        error = 'Failed to load task';
        console.error(err);
      } finally {
        loading = false;
      }
    }
  });
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!title.trim()) {
      error = 'Title is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        ...(isEdit ? { isCompleted } : {})
      };
      
      if (isEdit && taskId) {
        await taskStore.update(taskId, taskData as UpdateTaskInput);
      } else {
        await taskStore.create(taskData as CreateTaskInput);
      }
      
      goto('/tasks');
    } catch (err) {
      error = isEdit ? 'Failed to update task' : 'Failed to create task';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  async function handleDelete() {
    if (!isEdit || !taskId) return;
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    loading = true;
    try {
      await taskStore.delete(taskId);
      goto('/tasks');
    } catch (err) {
      error = 'Failed to delete task';
      console.error(err);
      loading = false;
    }
  }
  
  function handleCancel() {
    goto('/tasks');
  }
</script>

<svelte:head>
  <title>{isEdit ? 'Edit Task' : 'New Task'} - Journal App</title>
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
    <h1 class="text-3xl font-bold">
      {isEdit ? 'Edit Task' : 'New Task'}
    </h1>
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
        
        <!-- Due Date and Completion Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <!-- Due Date -->
          <div class="form-control">
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
          
          <!-- Completion Status (only for editing) -->
          {#if isEdit}
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Completed</span>
                <input 
                  type="checkbox"
                  class="checkbox checkbox-primary"
                  bind:checked={isCompleted}
                  disabled={loading}
                />
              </label>
            </div>
          {/if}
        </div>
        
        <!-- Actions -->
        <div class="flex justify-between">
          <div>
            {#if isEdit}
              <button 
                type="button"
                class="btn btn-error"
                onclick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={16} />
                Delete
              </button>
            {/if}
          </div>
          
          <div class="flex gap-2">
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
              {isEdit ? 'Update' : 'Create'} Task
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
