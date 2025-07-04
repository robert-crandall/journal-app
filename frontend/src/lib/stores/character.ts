import { writable } from 'svelte/store';
import type { Character } from '../api/characters';

// Character store state
interface CharacterState {
	character: Character | null;
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

// Create the character store
function createCharacterStore() {
	// Initial state
	const initialState: CharacterState = {
		character: null,
		loading: false,
		error: null,
		initialized: false
	};

	const { subscribe, set, update } = writable<CharacterState>(initialState);

	return {
		subscribe,

		// Set the character after successful fetch/create/update
		setCharacter: (character: Character | null) => {
			update((state) => ({
				...state,
				character,
				loading: false,
				error: null,
				initialized: true
			}));
		},

		// Clear character state
		clearCharacter: () => {
			update((state) => ({
				...state,
				character: null,
				loading: false,
				error: null,
				initialized: true
			}));
		},

		// Set loading state
		setLoading: (isLoading: boolean) => {
			update((state) => ({ ...state, loading: isLoading }));
		},

		// Set error state
		setError: (errorMessage: string | null) => {
			update((state) => ({ ...state, error: errorMessage, loading: false }));
		},

		// Set initialized state
		setInitialized: (initialized: boolean = true) => {
			update((state) => ({ ...state, initialized }));
		}
	};
}

// Export the character store
export const characterStore = createCharacterStore();
