<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { tasksApi, type TaskWithRelations, type TaskFilters } from '$lib/api/tasks';
  import { Plus, CheckSquare, Clock, Zap, User, Archive, Edit3, Trash2, Eye, Filter, RotateCcw } from 'lucide-svelte';

  // Reactive state for tasks data
  let userTasks: TaskWithRelations[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let filterSourceType = $state<string>('');
  let showCompleted = $state(false);
  let filterPriority = $state<string>('');

  // Load data on component mount
  onMount(async () => {
    await loadTasksData();
  });

  // Separate function to load tasks data
  async function loadTasksData() {
    try {
      loading = true;
      error = null;

      const filters: TaskFilters = {};
      if (filterSourceType) filters.sourceType = filterSourceType;
      if (showCompleted !== undefined) filters.completed = showCompleted;

      const tasksData = await tasksApi.getUserTasks(filters);
      userTasks = tasksData;
    } catch (err) {
      console.error('Failed to load tasks:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load tasks';
    } finally {
      loading = false;
    }
  }

  // Filter tasks based on priority filter
  let filteredTasks = $derived(() => {
    let filtered = userTasks;
    
    if (filterPriority) {
      if (filterPriority === 'high') {
        filtered = filtered.filter(task => (task.priority || 0) >= 8);
      } else if (filterPriority === 'medium') {
        filtered = filtered.filter(task => (task.priority || 0) >= 5 && (task.priority || 0) < 8);
      } else if (filterPriority === 'low') {
        filtered = filtered.filter(task => (task.priority || 0) < 5);
      }
    }
    
    return filtered;
  });

  // Helper functions
  function getTaskIcon(task: TaskWithRelations) {
    switch (task.sourceType) {
      case 'track_task': return '🎯'; // From quests/experiments
      case 'initiative_task': return '📋'; // From projects
      case 'manual': return '💪'; // XP-earning manual tasks
      case 'todo': return '📝'; // Simple todos
      default: return '✅';
    }
  }

  function getPriorityColor(priority: number | null) {
    if (!priority) return 'badge-ghost';
    if (priority >= 8) return 'badge-error';
    if (priority >= 5) return 'badge-warning';
    return 'badge-success';
  }

  function getPriorityLabel(priority: number | null) {
    if (!priority) return 'None';
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatSourceType(sourceType: string): string {
    switch (sourceType) {
      case 'track_task': return 'Quest/Experiment';
      case 'initiative_task': return 'Project';
      case 'manual': return 'Manual';
      case 'todo': return 'Todo';
      default: return sourceType;
    }
  }

  // Navigation functions
  function createTask() {
    goto('/tasks/create');
  }

  function editTask(taskId: string) {
    goto(`/tasks/${taskId}/edit`);
  }

  function viewTaskDetails(taskId: string) {
    goto(`/tasks/${taskId}`);
  }

  // Task actions
  async function completeTask(task: TaskWithRelations) {
    try {
      await tasksApi.completeTask(task.id);
      await loadTasksData(); // Refresh the list
    } catch (err) {
      console.error('Failed to complete task:', err);
      error = err instanceof Error ? err.message : 'Failed to complete task';
    }
  }

  async function deleteTask(task: TaskWithRelations) {
    if (!confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await tasksApi.deleteTask(task.id);
      await loadTasksData(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete task:', err);
      error = err instanceof Error ? err.message : 'Failed to delete task';
    }
  }

  // Filter handlers
  async function handleFilterChange() {
    await loadTasksData();
  }
</script>

<svelte:head>
  <title>Tasks - Gamified Life</title>
  <meta name="description" content="Manage your daily tasks and track your progress towards your goals" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Tasks Dashboard</h1>
          <p class="text-base-content/70 text-lg">Manage your daily actions and earn XP</p>
        </div>
        <div class="flex gap-3">
          <button onclick={createTask} class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
            <Plus size={20} />
            Create Task
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters Section -->
  <div class="mx-auto max-w-7xl px-4 py-6">
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <Filter size={16} />
            <span class="font-medium">Filters:</span>
          </div>
          
          <div class="form-control">
            <label class="label" for="source-type-filter">
              <span class="label-text">Source Type</span>
            </label>
            <select 
              id="source-type-filter"
              bind:value={filterSourceType} 
              onchange={handleFilterChange}
              class="select select-bordered select-sm w-40"
            >
              <option value="">All Types</option>
              <option value="track_task">Quest/Experiment</option>
              <option value="initiative_task">Project</option>
              <option value="manual">Manual</option>
              <option value="todo">Todo</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label" for="priority-filter">
              <span class="label-text">Priority</span>
            </label>
            <select 
              id="priority-filter"
              bind:value={filterPriority} 
              class="select select-bordered select-sm w-32"
            >
              <option value="">All</option>
              <option value="high">High (8+)</option>
              <option value="medium">Medium (5-7)</option>
              <option value="low">Low (&lt;5)</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer gap-2">
              <span class="label-text">Show Completed</span>
              <input 
                type="checkbox" 
                bind:checked={showCompleted} 
                onchange={handleFilterChange}
                class="checkbox checkbox-primary checkbox-sm" 
              />
            </label>
          </div>

          <button onclick={async () => { filterSourceType = ''; filterPriority = ''; showCompleted = false; await loadTasksData(); }} class="btn btn-ghost btn-sm gap-2">
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 pb-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading your tasks...</p>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="alert alert-error mx-auto max-w-md">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      </div>
    {:else}
      <!-- Tasks Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Tasks Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          {#if filteredTasks.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">
                {showCompleted ? 'Completed Tasks' : 'Active Tasks'}
              </h2>
              <div class="grid gap-4 md:grid-cols-2">
                {#each filteredTasks as task}
                  <div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="text-2xl">
                            {getTaskIcon(task)}
                          </div>
                          <div class="flex-1">
                            <h3 class="text-lg font-bold">{task.title}</h3>
                            <p class="text-base-content/60 text-sm">{formatSourceType(task.sourceType)}</p>
                          </div>
                        </div>

                        <!-- Priority Badge -->
                        <div class="badge {getPriorityColor(task.priority)}">
                          {getPriorityLabel(task.priority)}
                        </div>
                      </div>

                      {#if task.description}
                        <p class="text-base-content/80 mb-4 text-sm">{task.description}</p>
                      {/if}

                      <!-- Task Details -->
                      <div class="mb-4 space-y-2">
                        {#if task.dueDate}
                          <div class="flex items-center gap-2 text-sm">
                            <Clock size={14} />
                            <span>Due: {formatDate(task.dueDate)}</span>
                          </div>
                        {/if}
                        
                        {#if task.xpReward}
                          <div class="flex items-center gap-2 text-sm">
                            <Zap size={14} />
                            <span>{task.xpReward} XP</span>
                          </div>
                        {/if}

                        {#if task.stat}
                          <div class="flex items-center gap-2 text-sm">
                            <span class="badge badge-outline badge-xs">{task.stat.name}</span>
                          </div>
                        {/if}

                        {#if task.familyMember}
                          <div class="flex items-center gap-2 text-sm">
                            <User size={14} />
                            <span>{task.familyMember.name}</span>
                          </div>
                        {/if}

                        {#if task.isRecurring}
                          <div class="flex items-center gap-2 text-sm">
                            <RotateCcw size={14} />
                            <span>Recurring {task.recurringType}</span>
                          </div>
                        {/if}
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewTaskDetails(task.id)}>
                          <Eye size={14} />
                          View
                        </button>
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => editTask(task.id)}>
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button class="btn btn-success btn-sm gap-1" onclick={() => completeTask(task)}>
                          <CheckSquare size={14} />
                          Complete
                        </button>
                        <button class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content gap-1" onclick={() => deleteTask(task)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </section>
          {:else}
            <!-- Empty State -->
            <section>
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body py-12 text-center">
                  <div class="avatar placeholder mb-6">
                    <div class="bg-base-300 text-base-content w-20 rounded-full">
                      <CheckSquare size={40} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">No Tasks Found</h3>
                  <p class="text-base-content/60 mb-6">
                    {filterSourceType || filterPriority || showCompleted 
                      ? 'No tasks match your current filters.' 
                      : 'Start creating tasks to organize your daily actions and earn XP.'}
                  </p>
                  <button onclick={createTask} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Create Your First Task
                  </button>
                </div>
              </div>
            </section>
          {/if}
        </div>

        <!-- Sidebar (1/4 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Quick Stats Card -->
            <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
              <div class="card-body p-6">
                <h3 class="text-primary mb-4 font-semibold">Quick Stats</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm">Total Tasks:</span>
                    <span class="font-medium">{userTasks.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">High Priority:</span>
                    <span class="font-medium">{userTasks.filter(t => (t.priority || 0) >= 8).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">XP Earning:</span>
                    <span class="font-medium">{userTasks.filter(t => t.xpReward && t.xpReward > 0).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Recurring:</span>
                    <span class="font-medium">{userTasks.filter(t => t.isRecurring).length}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Task Types Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Task Types</h3>
                <div class="space-y-2">
                  {#each ['track_task', 'initiative_task', 'manual', 'todo'] as sourceType}
                    <div class="flex justify-between text-sm">
                      <span>{formatSourceType(sourceType)}:</span>
                      <span class="font-medium">{userTasks.filter(t => t.sourceType === sourceType).length}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Quick Actions</h3>
                <div class="space-y-2">
                  <button onclick={createTask} class="btn btn-outline btn-sm w-full gap-2">
                    <Plus size={16} />
                    Create New Task
                  </button>
                  <button onclick={() => goto('/quests')} class="btn btn-outline btn-sm w-full gap-2">
                    <Archive size={16} />
                    View Quests
                  </button>
                  <button onclick={() => goto('/projects')} class="btn btn-outline btn-sm w-full gap-2">
                    <Archive size={16} />
                    View Projects
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
