import { writable } from 'svelte/store';
import type { Task, TaskStats, CreateTaskInput, UpdateTaskInput } from '$lib/api/client';
import { journalApi } from '$lib/api/client';

interface TaskState {
  tasks: Task[];
  stats: TaskStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

function createTaskStore() {
  const { subscribe, set, update } = writable<TaskState>({
    tasks: [],
    stats: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const loadTasks = async (options?: {
    includeCompleted?: boolean;
    sortBy?: 'dueDate' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) => {
    update(state => ({ ...state, isLoading: true, error: null }));
    
    try {
      const [tasksResponse, statsResponse] = await Promise.all([
        journalApi.getTasks(options),
        journalApi.getTaskStats()
      ]);

      if (tasksResponse.success && statsResponse.success) {
        set({
          tasks: tasksResponse.data || [],
          stats: statsResponse.data || null,
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        set({
          tasks: [],
          stats: null,
          isLoading: false,
          error: tasksResponse.error || statsResponse.error || 'Failed to load tasks',
          lastUpdated: null
        });
      }
    } catch (error) {
      set({
        tasks: [],
        stats: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load tasks',
        lastUpdated: null
      });
    }
  };

  return {
    subscribe,
    
    // Load tasks and stats
    load: loadTasks,

    // Create a new task
    create: async (taskData: CreateTaskInput) => {
      try {
        const response = await journalApi.createTask(taskData);
        if (response.success && response.data) {
          update(state => ({
            ...state,
            tasks: [response.data!, ...state.tasks],
            stats: state.stats ? {
              ...state.stats,
              total: state.stats.total + 1,
              pending: state.stats.pending + 1
            } : null
          }));
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to create task');
        }
      } catch (error) {
        throw error;
      }
    },

    // Update an existing task
    update: async (taskId: string, taskData: UpdateTaskInput) => {
      try {
        const response = await journalApi.updateTask(taskId, taskData);
        if (response.success && response.data) {
          update(state => ({
            ...state,
            tasks: state.tasks.map(task =>
              task.id === taskId ? response.data! : task
            )
          }));
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to update task');
        }
      } catch (error) {
        throw error;
      }
    },

    // Toggle task completion
    toggle: async (taskId: string) => {
      try {
        const response = await journalApi.toggleTask(taskId);
        if (response.success && response.data) {
          update(state => {
            const newTasks = state.tasks.map(task =>
              task.id === taskId ? response.data! : task
            );
            
            // Update stats
            const oldTask = state.tasks.find(t => t.id === taskId);
            const newTask = response.data!;
            
            let newStats = state.stats;
            if (newStats && oldTask) {
              if (oldTask.isCompleted !== newTask.isCompleted) {
                if (newTask.isCompleted) {
                  newStats = {
                    ...newStats,
                    completed: newStats.completed + 1,
                    pending: newStats.pending - 1
                  };
                } else {
                  newStats = {
                    ...newStats,
                    completed: newStats.completed - 1,
                    pending: newStats.pending + 1
                  };
                }
              }
            }

            return {
              ...state,
              tasks: newTasks,
              stats: newStats
            };
          });
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to toggle task');
        }
      } catch (error) {
        throw error;
      }
    },

    // Delete a task
    delete: async (taskId: string) => {
      try {
        const response = await journalApi.deleteTask(taskId);
        if (response.success) {
          update(state => {
            const taskToDelete = state.tasks.find(t => t.id === taskId);
            const newTasks = state.tasks.filter(task => task.id !== taskId);
            
            let newStats = state.stats;
            if (newStats && taskToDelete) {
              newStats = {
                ...newStats,
                total: newStats.total - 1,
                ...(taskToDelete.isCompleted 
                  ? { completed: newStats.completed - 1 }
                  : { pending: newStats.pending - 1 }
                )
              };
            }

            return {
              ...state,
              tasks: newTasks,
              stats: newStats
            };
          });
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to delete task');
        }
      } catch (error) {
        throw error;
      }
    },

    // Clear all data
    clear: () => {
      set({
        tasks: [],
        stats: null,
        isLoading: false,
        error: null,
        lastUpdated: null
      });
    }
  };
}

export const taskStore = createTaskStore();
