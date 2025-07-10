import { writable, derived } from 'svelte/store';
import { getAllFocuses, getCurrentDayFocus, type Focus } from '$lib/api/focus';

// Create a store for all focuses
export const focusesStore = writable<Focus[]>([]);

// Create a derived store for today's focus
export const currentDayFocus = writable<Focus | null>(null);

// Create a derived store to get focuses by day of week
export const focusesByDayOfWeek = derived(focusesStore, ($focuses) => {
  const map = new Map<number, Focus>();
  $focuses.forEach((focus) => {
    map.set(focus.dayOfWeek, focus);
  });
  return map;
});

// Function to load all focuses from the API
export async function loadAllFocuses(): Promise<void> {
  try {
    const focuses = await getAllFocuses();
    focusesStore.set(focuses);
    return;
  } catch (error) {
    console.error('Failed to load focuses:', error);
    focusesStore.set([]);
  }
}

// Function to load the current day's focus
export async function loadCurrentDayFocus(): Promise<void> {
  try {
    const focus = await getCurrentDayFocus();
    currentDayFocus.set(focus);
    return;
  } catch (error) {
    console.error('Failed to load current day focus:', error);
    currentDayFocus.set(null);
  }
}

// Helper function to get a focus by day of week from the store
export function getFocusByDayOfWeek(dayOfWeek: number, focuses: Focus[]): Focus | undefined {
  return focuses.find((focus) => focus.dayOfWeek === dayOfWeek);
}
