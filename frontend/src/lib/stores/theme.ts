import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { preferencesApi } from '$lib/api';

// Available DaisyUI themes
export const availableThemes = [
	{ name: 'Light', value: 'light' },
	{ name: 'Dark', value: 'dark' },
	{ name: 'Cupcake', value: 'cupcake' },
	{ name: 'Bumblebee', value: 'bumblebee' },
	{ name: 'Emerald', value: 'emerald' },
	{ name: 'Corporate', value: 'corporate' },
	{ name: 'Synthwave', value: 'synthwave' },
	{ name: 'Retro', value: 'retro' },
	{ name: 'Cyberpunk', value: 'cyberpunk' },
	{ name: 'Valentine', value: 'valentine' },
	{ name: 'Halloween', value: 'halloween' },
	{ name: 'Garden', value: 'garden' },
	{ name: 'Forest', value: 'forest' },
	{ name: 'Aqua', value: 'aqua' },
	{ name: 'Lofi', value: 'lofi' },
	{ name: 'Pastel', value: 'pastel' },
	{ name: 'Fantasy', value: 'fantasy' },
	{ name: 'Wireframe', value: 'wireframe' },
	{ name: 'Black', value: 'black' },
	{ name: 'Luxury', value: 'luxury' },
	{ name: 'Dracula', value: 'dracula' },
	{ name: 'CMYK', value: 'cmyk' },
	{ name: 'Autumn', value: 'autumn' },
	{ name: 'Business', value: 'business' },
	{ name: 'Acid', value: 'acid' },
	{ name: 'Lemonade', value: 'lemonade' },
	{ name: 'Night', value: 'night' },
	{ name: 'Coffee', value: 'coffee' },
	{ name: 'Winter', value: 'winter' },
	{ name: 'Dim', value: 'dim' },
	{ name: 'Nord', value: 'nord' },
	{ name: 'Sunset', value: 'sunset' }
] as const;

export type Theme = typeof availableThemes[number]['value'];

function createThemeStore() {
	// Get initial theme from localStorage or default to 'light'
	let initialTheme: Theme = 'light';
	
	if (browser) {
		initialTheme = (localStorage.getItem('theme') as Theme) || 'light';
	}

	const { subscribe, set, update } = writable<Theme>(initialTheme);

	async function syncThemeToBackend(theme: Theme, isAuthenticated?: boolean) {
		if (browser && isAuthenticated) {
			try {
				await preferencesApi.set('theme', theme);
			} catch (error) {
				console.warn('Failed to sync theme to backend:', error);
				// Continue with local storage fallback for offline support
			}
		}
	}

	function applyTheme(theme: Theme) {
		if (browser) {
			// Update localStorage for offline support
			localStorage.setItem('theme', theme);
			
			// Update HTML data-theme attribute
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	return {
		subscribe,
		setTheme: async (theme: Theme, isAuthenticated = false) => {
			applyTheme(theme);
			set(theme);
			
			// Sync to backend if user is authenticated
			await syncThemeToBackend(theme, isAuthenticated);
		},
		init: async (isAuthenticated = false) => {
			if (browser) {
				let themeToUse: Theme = 'light';

				if (isAuthenticated) {
					// Try to get theme from backend first
					try {
						const response = await preferencesApi.getAll();
						const savedTheme = response.preferences?.theme as Theme;
						
						if (savedTheme && availableThemes.some(t => t.value === savedTheme)) {
							themeToUse = savedTheme;
						}
					} catch (error) {
						console.warn('Failed to load theme from backend, using local storage:', error);
						// Fall back to local storage
						const localTheme = localStorage.getItem('theme') as Theme;
						if (localTheme && availableThemes.some(t => t.value === localTheme)) {
							themeToUse = localTheme;
						}
					}
				} else {
					// Use local storage for non-authenticated users
					const savedTheme = localStorage.getItem('theme') as Theme;
					if (savedTheme && availableThemes.some(t => t.value === savedTheme)) {
						themeToUse = savedTheme;
					} else {
						// Use system preference if no saved theme
						const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
						themeToUse = prefersDark ? 'dark' : 'light';
					}
				}

				applyTheme(themeToUse);
				set(themeToUse);
			}
		}
	};
}

export const theme = createThemeStore();
