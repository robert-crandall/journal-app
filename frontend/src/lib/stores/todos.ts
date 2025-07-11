import { writable, derived } from 'svelte/store';
import type { SimpleTodoResponse } from '../../../.svelte-kit/backend-types/types/todos';
import { simpleTodosApi } from '../api/todos';

// Types for the store
interface SimpleTodosState {
  todos: SimpleTodoResponse[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: SimpleTodosState = {
  todos: [],
  loading: false,
  error: null,
};

// Create the writable store
const createSimpleTodosStore = () => {
  const { subscribe, set, update } = writable<SimpleTodosState>(initialState);

  return {
    subscribe,

    // Load todos from API
    async loadTodos() {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const todos = await simpleTodosApi.getTodos();
        update((state) => ({ ...state, todos, loading: false }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load todos';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to load todos:', error);
      }
    },

    // Create a new todo
    async createTodo(description: string) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const newTodo = await simpleTodosApi.createTodo({ description });
        update((state) => ({
          ...state,
          todos: [newTodo, ...state.todos], // Add to the beginning
          loading: false,
        }));
        return newTodo;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create todo';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to create todo:', error);
        throw error;
      }
    },

    // Update a todo
    async updateTodo(id: string, description: string) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const updatedTodo = await simpleTodosApi.updateTodo(id, { description });
        update((state) => ({
          ...state,
          todos: state.todos.map((todo) => (todo.id === id ? updatedTodo : todo)),
          loading: false,
        }));
        return updatedTodo;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update todo';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to update todo:', error);
        throw error;
      }
    },

    // Complete/uncomplete a todo
    async completeTodo(id: string, isCompleted: boolean) {
      // Optimistically update the UI
      update((state) => ({
        ...state,
        todos: state.todos.map((todo) => (todo.id === id ? { ...todo, isCompleted, completedAt: isCompleted ? new Date().toISOString() : null } : todo)),
      }));

      try {
        const updatedTodo = await simpleTodosApi.completeTodo(id, isCompleted);

        if (isCompleted) {
          // Remove completed todos from the list after a short delay for visual feedback
          setTimeout(() => {
            update((state) => ({
              ...state,
              todos: state.todos.filter((todo) => todo.id !== id),
            }));
          }, 1000);
        } else {
          // Update with server response
          update((state) => ({
            ...state,
            todos: state.todos.map((todo) => (todo.id === id ? updatedTodo : todo)),
          }));
        }

        return updatedTodo;
      } catch (error) {
        // Revert optimistic update on error
        update((state) => ({
          ...state,
          todos: state.todos.map((todo) => (todo.id === id ? { ...todo, isCompleted: !isCompleted, completedAt: null } : todo)),
          error: error instanceof Error ? error.message : 'Failed to update todo',
        }));
        console.error('Failed to complete todo:', error);
        throw error;
      }
    },

    // Delete a todo
    async deleteTodo(id: string) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        await simpleTodosApi.deleteTodo(id);
        update((state) => ({
          ...state,
          todos: state.todos.filter((todo) => todo.id !== id),
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo';
        update((state) => ({ ...state, loading: false, error: errorMessage }));
        console.error('Failed to delete todo:', error);
        throw error;
      }
    },

    // Clear error
    clearError() {
      update((state) => ({ ...state, error: null }));
    },

    // Reset store
    reset() {
      set(initialState);
    },
  };
};

// Export the store instance
export const simpleTodosStore = createSimpleTodosStore();

// Derived stores for easier access to specific parts of the state
export const todos = derived(simpleTodosStore, ($store) => $store.todos);
export const todosLoading = derived(simpleTodosStore, ($store) => $store.loading);
export const todosError = derived(simpleTodosStore, ($store) => $store.error);
