<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Filter, Search } from 'lucide-svelte';
  import { taskStore } from '$lib/stores/tasks';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import { goto } from '$app/navigation';
  import type { Task } from '$lib/api/client';
  
  let searchQuery = $state('');
  let statusFilter = $state('all');
  let priorityFilter = $state('all');
  
  // Subscribe to store
  let state = $state({
    tasks: [] as Task[],
    loading: false,
    error: null as string | null
  });
  
  taskStore.subscribe(storeState => {
    state = {
      tasks: storeState.tasks,
      loading: storeState.isLoading,
      error: storeState.error
    };
  });
  
  onMount(() => {
    taskStore.load();
  });
  
  let filteredTasks = $derived(() => {
    let tasks = state.tasks;
    
    // Filter by search query
    if (searchQuery) {
      tasks = tasks.filter((task: Task) => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by completion status (converting from old status system to isCompleted)
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        tasks = tasks.filter((task: Task) => task.isCompleted);
      } else {
        tasks = tasks.filter((task: Task) => !task.isCompleted);
      }
    }
    
    // Priority filter is not available in current Task model, so skip it
    
    return tasks;
  });
  
  function handleCreateTask() {
    goto('/tasks/new');
  }
</script>

<svelte:head>
  <title>Tasks - Journal App</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Tasks</h1>
    <button 
      class="btn btn-primary"
      onclick={handleCreateTask}
      aria-label="Create new task"
    >
      <Plus size={20} />
      New Task
    </button>
  </div>
  
  <!-- Filters -->
  <div class="card bg-base-100 shadow-sm mb-6">
    <div class="card-body">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="form-control flex-1">
          <label class="input input-bordered flex items-center gap-2">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..."
              bind:value={searchQuery}
              class="grow"
            />
          </label>
        </div>
        
        <!-- Status Filter -->
        <div class="form-control">
          <select class="select select-bordered" bind:value={statusFilter}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Tasks List -->
  {#if state.loading}
    <div class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if state.error}
    <div class="alert alert-error">
      <span>{state.error}</span>
    </div>
  {:else if filteredTasks.length === 0}
    <div class="text-center py-12">
      <p class="text-lg text-base-content/70 mb-4">
        {searchQuery || statusFilter !== 'all' 
          ? 'No tasks match your filters.' 
          : 'No tasks yet. Create your first task to get started!'}
      </p>
      {#if !searchQuery && statusFilter === 'all'}
        <button class="btn btn-primary" onclick={handleCreateTask}>
          <Plus size={20} />
          Create Your First Task
        </button>
      {/if}
    </div>
  {:else}
    <div class="grid gap-4">
      {#each filteredTasks as task (task.id)}
        <TaskCard {task} />
      {/each}
    </div>
  {/if}
</div>
