<script lang="ts">
  import type { Task } from '$lib/api/client';
  import { Check, Clock, Calendar, MoreHorizontal } from 'lucide-svelte';
  import { taskStore } from '$lib/stores/tasks';
  import { dashboardStore } from '$lib/stores/dashboard';
  import { goto } from '$app/navigation';

  interface Props {
    task: Task;
    showActions?: boolean;
    compact?: boolean;
  }

  let { task, showActions = false, compact = false }: Props = $props();

  let isToggling = $state(false);

  async function toggleTask(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (isToggling) return;
    
    isToggling = true;
    try {
      const updatedTask = await taskStore.toggle(task.id);
      dashboardStore.updateTask(updatedTask);
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // TODO: Show error toast
    } finally {
      isToggling = false;
    }
  }

  function handleCardClick() {
    goto(`/tasks/${task.id}`);
  }

  function formatDueDate(dueDate: string) {
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (date < today) return 'Overdue';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  function getDueDateClass(dueDate: string) {
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) return 'text-error';
    if (date.getTime() === today.getTime()) return 'text-warning';
    return 'text-base-content/70';
  }
</script>

<div 
  class="card {compact ? 'card-compact' : ''} bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
  onclick={handleCardClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
  aria-label="View task: {task.title}"
>
  <div class="card-body {compact ? 'p-4' : ''}">
    <div class="flex items-start gap-3">
      <!-- Checkbox -->
      <button 
        class="checkbox {task.isCompleted ? 'checkbox-checked' : ''} {isToggling ? 'opacity-50' : ''}"
        onclick={toggleTask}
        disabled={isToggling}
        aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {#if task.isCompleted}
          <Check size={14} class="text-success" />
        {/if}
      </button>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="font-medium {task.isCompleted ? 'line-through text-base-content/50' : 'text-base-content'} {compact ? 'text-sm' : ''}">
          {task.title}
        </h3>
        
        {#if task.description && !compact}
          <p class="text-sm text-base-content/70 mt-1">
            {task.description}
          </p>
        {/if}

        <!-- Meta info -->
        <div class="flex items-center gap-3 mt-2 text-xs">
          {#if task.dueDate}
            <div class="flex items-center gap-1 {getDueDateClass(task.dueDate)}">
              <Calendar size={12} />
              <span>{formatDueDate(task.dueDate)}</span>
            </div>
          {/if}
          
          {#if task.isCompleted && task.completedAt}
            <div class="flex items-center gap-1 text-success">
              <Check size={12} />
              <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
            </div>
          {/if}

          {#if !task.isCompleted && !task.dueDate}
            <div class="flex items-center gap-1 text-base-content/50">
              <Clock size={12} />
              <span>No due date</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Actions -->
      {#if showActions && !compact}
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
            <MoreHorizontal size={16} />
          </div>
          <div tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <ul class="menu">
              <li><a href="/tasks/{task.id}/edit">Edit</a></li>
              <li><a href="/tasks/{task.id}">View Details</a></li>
              <li><button class="text-error">Delete</button></li>
            </ul>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .checkbox {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid oklch(var(--bc) / 0.3);
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .checkbox:hover {
    border-color: oklch(var(--p));
  }
  
  .checkbox-checked {
    background-color: oklch(var(--su));
    border-color: oklch(var(--su));
  }
</style>
